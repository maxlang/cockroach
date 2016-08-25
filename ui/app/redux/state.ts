/**
 * state.ts defines the shape of the AdminUIState. It's pulled out into its owns
 * file so that
 *
 * TODO (maxlang): cleanup and create a .d.ts file defining AdminUIState as a
 * series of nested modules.
 */

import { IRouterState } from "react-router-redux";
import { NodeStatus } from "../util/proto";
import { VersionList } from "../interfaces/cockroachlabs";
import moment from "moment";

/**
 * PROTO TYPES
 */

export type DatabasesRequestMessage = cockroach.server.serverpb.DatabasesRequestMessage;
export type DatabasesResponseMessage = cockroach.server.serverpb.DatabasesResponseMessage;

export type DatabaseDetailsRequestMessage = cockroach.server.serverpb.DatabaseDetailsRequestMessage;
export type DatabaseDetailsResponseMessage = cockroach.server.serverpb.DatabaseDetailsResponseMessage;

export type TableDetailsRequestMessage = cockroach.server.serverpb.TableDetailsRequestMessage;
export type TableDetailsResponseMessage = cockroach.server.serverpb.TableDetailsResponseMessage;

export type EventsRequestMessage = cockroach.server.serverpb.EventsRequestMessage;
export type EventsResponseMessage = cockroach.server.serverpb.EventsResponseMessage;

export type NodesRequestMessage = cockroach.server.serverpb.NodesRequestMessage;
export type NodesResponseMessage = cockroach.server.serverpb.NodesResponseMessage;

export type GetUIDataRequestMessage = cockroach.server.serverpb.GetUIDataRequestMessage;
export type GetUIDataResponseMessage = cockroach.server.serverpb.GetUIDataResponseMessage;

export type SetUIDataRequestMessage = cockroach.server.serverpb.SetUIDataRequestMessage;
export type SetUIDataResponseMessage = cockroach.server.serverpb.SetUIDataResponseMessage;

export type RaftDebugRequestMessage = cockroach.server.serverpb.RaftDebugRequestMessage;
export type RaftDebugResponseMessage = cockroach.server.serverpb.RaftDebugResponseMessage;

export type TimeSeriesQueryRequestMessage = cockroach.ts.tspb.TimeSeriesQueryRequestMessage;
export type TimeSeriesQueryResponseMessage = cockroach.ts.tspb.TimeSeriesQueryResponseMessage;

export type HealthRequestMessage = cockroach.server.serverpb.HealthRequestMessage;
export type HealthResponseMessage = cockroach.server.serverpb.HealthResponseMessage;

export type ClusterRequestMessage = cockroach.server.serverpb.ClusterRequestMessage;
export type ClusterResponseMessage = cockroach.server.serverpb.ClusterResponseMessage;

export type TableStatsRequestMessage = cockroach.server.serverpb.TableStatsRequestMessage;
export type TableStatsResponseMessage = cockroach.server.serverpb.TableStatsResponseMessage;

export type LogsRequestMessage = cockroach.server.serverpb.LogsRequestMessage;
export type LogEntriesResponseMessage = cockroach.server.serverpb.LogEntriesResponseMessage;

/**
 * LOCAL UI STATE
 */

/**
 * UISettingsDict keeps track of local UI settings that are not persisted.
 */
export class UISettingsDict {
  [key: string]: any;
}

/**
 * UIDataSet maintains the current values of fields that are persisted to the
 * server as UIData. Fields are maintained in this collection as untyped
 * objects.
 */
export class UIDataSet {
  inFlight = 0;
  error: Error;
  data: {[key: string]: any} = {};
}

/**
 * METRICS STATE
 */

export type TSRequestMessage = cockroach.ts.tspb.TimeSeriesQueryRequestMessage;
export type TSResponseMessage = cockroach.ts.tspb.TimeSeriesQueryResponseMessage;

/**
 * MetricsQuery maintains the cached data for a single component.
 */
export class MetricsQuery {
  // ID of the component which owns this data.
  id: string;
  // The currently cached response data for this component.
  data: TSResponseMessage;
  // If the immediately previous request attempt returned an error, rather than
  // a response, it is maintained here. Null if the previous request was
  // successful.
  error: Error;
  // The previous request, which will have resulted in either "data" or "error"
  // being populated.
  request: TSRequestMessage;
  // A possibly outstanding request used to retrieve data from the server for this
  // component. This may represent a currently in-flight query, and thus is not
  // necessarily the request used to retrieve the current value of "data".
  nextRequest: TSRequestMessage;

  constructor(id: string) {
    this.id = id;
  }
}

/**
 * MetricsQueries is a collection of individual MetricsQuery objects, indexed by
 * component id.
 */
export interface MetricQuerySet {
  [id: string]: MetricsQuery;
}

/**
 * MetricQueryState maintains a MetricQuerySet collection, along with some
 * metadata relevant to server queries.
 */
export class MetricQueryState {
  // A count of the number of in-flight fetch requests.
  inFlight = 0;
  // The collection of MetricQuery objects.
  queries: MetricQuerySet;
}

/**
 * TIMEWINDOW STATE
 */

/**
 * TimeWindow represents an absolute window of time, defined with a start and
 * end time.
 */
export interface TimeWindow {
  start: moment.Moment;
  end: moment.Moment;
}

/**
 * TimeScale describes the requested dimensions of TimeWindows; it
 * prescribes a length for the window, along with a period of time that a
 * newly created TimeWindow will remain valid.
 */
export interface TimeScale {
  // The size of a global time window. Default is ten minutes.
  windowSize: moment.Duration;
  // The length of time the global time window is valid. The current time window
  // is invalid if now > (currentWindow.end + windowValid). Default is ten
  // seconds.
  windowValid: moment.Duration;
}

export class TimeWindowState {
  // Currently selected scale.
  scale: TimeScale;
  // Currently established time window.
  currentWindow: TimeWindow;
  // True if scale has changed since currentWindow was generated.
  scaleChanged: boolean;
  constructor(defaultScale: TimeScale) {
    this.scale = defaultScale;
  }
}

/**
 * CACHED DATA STATE
 */

// CachedDataReducerState is used to track the state of the cached data.
export class CachedDataReducerState<TResponseMessage> {
  data: TResponseMessage; // the latest data received
  inFlight = false; // true if a request is in flight
  valid = false; // true if data has been received and has not been invalidated
  lastError: Error; // populated with the most recent error, if the last request failed
}

// KeyedCachedDataReducerState is used to track the state of the cached data
// that is associated with a key.
export class KeyedCachedDataReducerState<TResponseMessage> {
  [id: string]: CachedDataReducerState<TResponseMessage>;
}

export type HealthState = CachedDataReducerState<HealthResponseMessage>;

export interface APIReducersState {
  cluster: CachedDataReducerState<ClusterResponseMessage>;
  events: CachedDataReducerState<EventsResponseMessage>;
  health: HealthState;
  nodes: CachedDataReducerState<NodeStatus[]>;
  raft: CachedDataReducerState<RaftDebugResponseMessage>;
  version: CachedDataReducerState<VersionList>;
  databases: CachedDataReducerState<DatabasesResponseMessage>;
  databaseDetails: KeyedCachedDataReducerState<DatabaseDetailsResponseMessage>;
  tableDetails: KeyedCachedDataReducerState<TableDetailsResponseMessage>;
  tableStats: KeyedCachedDataReducerState<TableStatsResponseMessage>;
  logs: CachedDataReducerState<LogEntriesResponseMessage>;
}

/**
 * OVERALL STATE
 */

export interface AdminUIState {
    routing: IRouterState;
    ui: UISettingsDict;
    uiData: UIDataSet;
    metrics: MetricQueryState;
    timewindow: TimeWindowState;
    cachedData: APIReducersState;
}
