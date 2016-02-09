// source: components/events.ts
/// <reference path="../../bower_components/mithriljs/mithril.d.ts" />
/// <reference path="../../typings/browser.d.ts" />
/// <reference path="../models/sqlquery.ts" />
/// <reference path="../models/proto.ts" />
/// <reference path="../util/property.ts" />

// Author: Max Lang (max@cockroachlabs.com)

module Components {
  "use strict";
  export module Events {
    import MithrilVirtualElement = _mithril.MithrilVirtualElement;
    import MithrilBasicProperty = _mithril.MithrilBasicProperty;
    import TableData = Components.Table.TableData;
    import TableColumn = Components.Table.TableColumn;
    import MithrilController = _mithril.MithrilController;
    import ReadOnlyProperty = Utils.ReadOnlyProperty;
    import Property = Utils.Property;
    import Prop = Utils.Prop;

    function runQuery(q: string, data: Property<Object[]>, updated: Property<number>): void {
      Models.SQLQuery.runQuery(q, true).then(data).then(function(): void {
        updated(Date.now());
      });
    }

    function populateTableDataFromResult(r1: Object[], r2: Object[]): TableData<any> {
      let columns: Property<TableColumn<any>[]> = Prop([]);

      let joined: Property<Object[]> = Prop(_.sortBy(r1.concat(r2), "timestamp"));

      return {
        columns: columns,
        rows: joined,
      };
    }

    enum FilterType {
      RANGE, CLUSTER, NODE, DB, TABLE, USER
    }

    interface Filter {
      text: string;
      type: FilterType;
      selected: boolean;
    }

    class SQLController implements MithrilController {
      data: Property<Object[]> = Prop([]);
      data2: Property<Object[]> = Prop([]);
      updated: Property<number> = Prop(Date.now());
      tableData: ReadOnlyProperty<TableData<Object>> = Utils.Computed(this.data, this.data2, function(r1: Object[], r2: Object[]): TableData<any> {
        return populateTableDataFromResult(r1, r2);
      });
      query: MithrilBasicProperty<string> = m.prop("");

      filters: Filter[] = [
        {selected: true, type: FilterType.RANGE, text: "Range Events"},
        {selected: true, type: FilterType.CLUSTER, text: "Cluster Events"},
        {selected: true, type: FilterType.NODE, text: "Node Events"},
        {selected: true, type: FilterType.DB, text: "Database Events"},
        {selected: true, type: FilterType.TABLE, text: "Table Events"},
        {selected: true, type: FilterType.USER, text: "User Events"},
      ];

    }

    export function controller(eventRefresher: { callback: () => void; }): SQLController {
      let ctrl: SQLController = new SQLController();
      ctrl.query("SELECT 'range', timestamp, rangeID , storeID , eventType , otherRangeID FROM SYSTEM.RANGELOG ORDER BY timestamp DESC LIMIT 10;");
      runQuery(ctrl.query(), ctrl.data, ctrl.updated);
      runQuery("SELECT 'event', timestamp, eventType, targetID, reportingID, info FROM SYSTEM.EVENTLOG ORDER BY timestamp DESC LIMIT 10;", ctrl.data2, ctrl.updated);

      eventRefresher.callback = () => {
        runQuery(ctrl.query(), ctrl.data, ctrl.updated);
        runQuery("SELECT 'event', timestamp, eventType, targetID, reportingID, info FROM SYSTEM.EVENTLOG ORDER BY timestamp DESC LIMIT 10;", ctrl.data2, ctrl.updated);
      };
      return ctrl;
    }

    function eventMessage(row: any): (string|MithrilVirtualElement) {
      console.log("ROW", row);
      if (row["'range'"]) {
        let rangeID: number = row.rangeID;
        let storeID: number = row.storeID;
        let type: string = row.eventType;
        let otherRangeID: number = row.otherRangeID;

        if (type === "split") {
          return m("span", [
            "Range " + rangeID + " was ",
            m("strong", "split"),
            " to create range " + otherRangeID + " on store " + storeID,
          ]);
        } else if (type === "add") {
          return m("span", [
            "Range replica for range " + rangeID + " was ",
            m("strong", "added"),
            " on store " + storeID,
          ]);
        } else if (type === "remove") {
          return m("span", [
            "Range replica for range " + rangeID + " was ",
            m("strong", "removed"),
            " on store " + storeID,
          ]);
        }
      } else {
        return row.info;
      }
    }

    export function view(ctrl: SQLController): MithrilVirtualElement {
      console.log("ctrl.tableData().r", ctrl.tableData().rows());
      return m(".event-table-container", [
        m(".table-header", [
          m("button.right", "View All"),
          m("h1", "Range Events"),
          m("span", _.map(ctrl.filters, function(filter: Filter): MithrilVirtualElement {
            return m(
              "button" + (filter.selected ? ".toggled" : ".untoggled"),
              {
                onclick: function(): void {
                  filter.selected = !filter.selected;
                },
              },
              filter.text
            );
          })),
        ]),
        m(".event-table", m("table", m("tbody", _.map(ctrl.tableData().rows(), function (row: any): MithrilVirtualElement {
          return m("tr", [
            m("td", m(".icon-info-filled")),
            m("td", m(".timestamp", row.timestamp)),
            m("td", m(".message", eventMessage(row))),
          ]);
        })))),
      ]);
    }
  }
}
