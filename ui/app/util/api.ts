/// <reference path="../../typings/index.d.ts" />

/**
 * This module contains all the REST endpoints for communicating with the admin UI.
 */

import * as _ from "lodash";
import "whatwg-fetch";
import moment = require("moment");

import * as protos from "../js/protos";
import * as state from "../redux/state";

let serverpb = protos.cockroach.server.serverpb;
let ts = protos.cockroach.ts.tspb;

// API constants
export const API_PREFIX = "/_admin/v1";
export const STATUS_PREFIX = "/_status";

// HELPER FUNCTIONS

// Inspired by https://github.com/github/fetch/issues/175
//
// withTimeout wraps a promise in a timeout.
export function withTimeout<T>(promise: Promise<T>, timeout?: moment.Duration): Promise<T> {
  if (timeout) {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => reject(new Error(`Promise timed out after ${timeout.asMilliseconds()} ms`)), timeout.asMilliseconds());
      promise.then(resolve, reject);
    });
  } else {
    return promise;
  }
}

interface TRequestMessage {
  encodeJSON(): string;
  toArrayBuffer(): ArrayBuffer;
}

// timeoutFetch is a wrapper around fetch that provides timeout and protocol
// buffer marshalling and unmarshalling.
//
// This function is intended for use with generated protocol buffers. In
// particular, TResponse is a generated interface that describes the JSON
// representation of the response, while TRequestMessage and TResponseMessage
// are generated interfaces which are implemented by the protocol buffer
// objects themselves. TResponseMessageBuilder is an interface implemented by
// the builder objects provided at runtime by protobuf.js.
function timeoutFetch<TResponse, TResponseMessage, TResponseMessageBuilder extends {
  new (json: TResponse): TResponseMessage
  decode(buffer: ArrayBuffer): TResponseMessage
  decode(buffer: ByteBuffer): TResponseMessage
  decode64(buffer: string): TResponseMessage
}>(builder: TResponseMessageBuilder, url: string, req: TRequestMessage = null, timeout: moment.Duration = moment.duration(30, "s")): Promise<TResponseMessage> {
  return withTimeout(
    fetch(url, {
      method: req ? "POST" : "GET",
      headers: {
        "Accept": "application/x-protobuf",
        "Content-Type": "application/x-protobuf",
        "Grpc-Timeout": timeout ? timeout.asMilliseconds() + "m" : undefined,
      },
      body: req ? req.toArrayBuffer() : undefined,
    }),
    timeout
   ).then((res) => {
    if (!res.ok) {
      throw Error(res.statusText);
    }
    return res.arrayBuffer().then((buffer) => builder.decode(buffer));
  });
}

export type APIRequestFn<TRequestMessage, TResponseMessage> = (req: TRequestMessage, timeout?: moment.Duration) => Promise<TResponseMessage>

// propsToQueryString is a helper function that converts a set of object
// properties to a query string
// - keys with null or undefined values will be skipped
// - non-string values will be toString'd
export function propsToQueryString(props: any) {
  return _.compact(_.map(props, (v: any, k: string) => !_.isNull(v) && !_.isUndefined(v) ? `${encodeURIComponent(k)}=${encodeURIComponent(v.toString())}` : null)).join("&");
}
/**
 * ENDPOINTS
 */

// getDatabaseList gets a list of all database names
export function getDatabaseList(req: state.DatabasesRequestMessage, timeout?: moment.Duration): Promise<state.DatabasesResponseMessage> {
  return timeoutFetch(serverpb.DatabasesResponse, `${API_PREFIX}/databases`, null, timeout);
}

// getDatabaseDetails gets details for a specific database
export function getDatabaseDetails(req: state.DatabaseDetailsRequestMessage, timeout?: moment.Duration): Promise<state.DatabaseDetailsResponseMessage> {
  return timeoutFetch(serverpb.DatabaseDetailsResponse, `${API_PREFIX}/databases/${req.database}`, null, timeout);
}

// getTableDetails gets details for a specific table
export function getTableDetails(req: state.TableDetailsRequestMessage, timeout?: moment.Duration): Promise<state.TableDetailsResponseMessage> {
  return timeoutFetch(serverpb.TableDetailsResponse, `${API_PREFIX}/databases/${req.database}/tables/${req.table}`, null, timeout);
}

// getUIData gets UI data
export function getUIData(req: state.GetUIDataRequestMessage, timeout?: moment.Duration): Promise<state.GetUIDataResponseMessage> {
  let queryString = _.map(req.keys, (key) => "keys=" + encodeURIComponent(key)).join("&");
  return timeoutFetch(serverpb.GetUIDataResponse, `${API_PREFIX}/uidata?${queryString}`, null, timeout);
}

// setUIData sets UI data
export function setUIData(req: state.SetUIDataRequestMessage, timeout?: moment.Duration): Promise<state.SetUIDataResponseMessage> {
  return timeoutFetch(serverpb.SetUIDataResponse, `${API_PREFIX}/uidata`, req, timeout);
}

// getEvents gets event data
export function getEvents(req: state.EventsRequestMessage, timeout?: moment.Duration): Promise<state.EventsResponseMessage> {
  let queryString = propsToQueryString(_.pick(req, ["type", "target_id"]));
  return timeoutFetch(serverpb.EventsResponse, `${API_PREFIX}/events?${queryString}`, null, timeout);
}

// getNodes gets node data
export function getNodes(req: state.NodesRequestMessage, timeout?: moment.Duration): Promise<state.NodesResponseMessage> {
  return timeoutFetch(serverpb.NodesResponse, `/_status/nodes`, null, timeout);
}

export function raftDebug(req: state.RaftDebugRequestMessage): Promise<state.RaftDebugResponseMessage> {
  // NB: raftDebug intentionally does not pass a timeout through.
  return timeoutFetch(serverpb.RaftDebugResponse, `/_status/raft`);
}

// queryTimeSeries queries for time series data
export function queryTimeSeries(req: state.TimeSeriesQueryRequestMessage, timeout?: moment.Duration): Promise<state.TimeSeriesQueryResponseMessage> {
  return timeoutFetch(ts.TimeSeriesQueryResponse, `/ts/query`, req, timeout);
}

// getHealth gets health data
export function getHealth(req: state.HealthRequestMessage, timeout?: moment.Duration): Promise<state.HealthResponseMessage> {
  return timeoutFetch(serverpb.HealthResponse, `${API_PREFIX}/health`, null, timeout);
}

// getCluster gets info about the cluster
export function getCluster(req: state.ClusterRequestMessage, timeout?: moment.Duration): Promise<state.ClusterResponseMessage> {
  return timeoutFetch(serverpb.ClusterResponse, `${API_PREFIX}/cluster`, null, timeout);
}

// getTableStats gets details stats about the current table
export function getTableStats(req: state.TableStatsRequestMessage, timeout?: moment.Duration): Promise<state.TableStatsResponseMessage> {
  return timeoutFetch(serverpb.TableStatsResponse, `${API_PREFIX}/databases/${req.database}/tables/${req.table}/stats`, null, timeout);
}

// TODO (maxlang): add filtering
// getLogs gets the logs for a specific node
export function getLogs(req: state.LogsRequestMessage, timeout?: moment.Duration): Promise<state.LogEntriesResponseMessage> {
  return timeoutFetch(serverpb.LogEntriesResponse, `${STATUS_PREFIX}/logs/${req.node_id}`, null, timeout);
}
