// source: pages/account.ts
/// <reference path="../../bower_components/mithriljs/mithril.d.ts" />
/// <reference path="../components/topbar.ts"/>
/// <reference path="../components/navbar.ts"/>
/// <reference path="../util/convert.ts"/>

// Author: Max Lang (max@cockroachlabs.com)

/**
 * AdminViews is the primary module for Cockroaches administrative web
 * interface.
 */
module AdminViews {
  "use strict";
  import NavigationBar = Components.NavigationBar;
  import Target = NavigationBar.Target;

  /**
   * Log is the view for exploring the logs from nodes.
   */
  export module Settings {
    /**
     * Page displays log entries from the current node.
     */

     let isActive: (targ: NavigationBar.Target) => boolean = (t: NavigationBar.Target) => {
       return ((m.route.param("detail") || "") === t.route);
     };

    export module Page {

      export function controller(): _mithril.MithrilController {
        return null;
      }

      export function view(ctrl: _mithril.MithrilController): _mithril.MithrilVirtualElement {

        let t: Target = {view: "Support", route: "support"};

        return m(".page.registration", [
          m.component(Components.Topbar, {title: "Settings", updated: Utils.Convert.MilliToNano(Date.now())}),
          m.component(
            Components.NavigationBar,
            {ts: {
              baseRoute: "/settings/",
              targets: <Utils.ReadOnlyProperty<Target[]>>Utils.Prop([t]),
              isActive: isActive,
            },
          }),
          m(".section", [
            m(".header", m("h1", "Help Cockroach Labs")),
            m(".form", [
              m(".intro", [
                `Cockroach DB is in beta and we're working diligently to make it \
                better. Sign up to share feedback, submit bug reports, and get
                updates, or just hit us up on `,
                m("a", {href: "http://www.github.com/cockroachdb/cockroach"}, "Github"),
                ".", ]),
              m("hr"),
              m("input", {placeholder: "Full Name"}),
              m("input", {placeholder: "Email"}),
              m("input", {placeholder: "Company (optional)"}),
              m("", [
                m("input[type=checkbox]", {id: "updates"}),
                m("label", {for: "updates"}, "Send me updates about Cockroach"),
              ]),
              m("hr"),
              m("button", "Submit"),
            ]),
          ]),
        ]);
      };
    }
  }
}
