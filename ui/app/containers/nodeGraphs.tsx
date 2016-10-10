import _ from "lodash";
import * as React from "react";
import * as d3 from "d3";
import { IInjectedProps } from "react-router";
import { connect } from "react-redux";
import { createSelector } from "reselect";
import { Link } from "react-router";

import { nodeIDAttr } from "./../util/constants";

import GraphGroup from "../components/graphGroup";
import { LineGraph, Axis, Metric } from "../components/linegraph";
import { StackedAreaGraph } from "../components/stackedgraph";
import { Bytes } from "../util/format";
import { NanoToMilli } from "../util/convert";
import { AdminUIState } from "../redux/state";
import { refreshNodes } from "../redux/apiReducers";
import { NodeStatus, MetricConstants, BytesUsed } from  "../util/proto";


interface NodeGraphsProps {
  clusterInfo: {
    totalNodes: number;
    availableCapacity: number;
    bytesUsed: number;
  };
  refreshNodes: typeof refreshNodes;
}

/**
 * Renders the main content of the help us page.
 */
class NodeGraphs extends React.Component<NodeGraphsProps & IInjectedProps, {}> {
  static displayTimeScale = true;

  render() {
    let sources: string[];
    let node = this.props.params[nodeIDAttr];
    sources = node ? [node] : null;
    let specifier = node ? `on node ${node}` : "across all nodes";

    let { totalNodes, bytesUsed, availableCapacity } = this.props.clusterInfo;
    let capacityPercent = (availableCapacity !== 0) ? bytesUsed / (bytesUsed + availableCapacity) : 0.0;

    return <div className="section node">
      <div className="summaries inline">
        <div className="node-summary visualization-wrapper">
          <div className="visualization">
            <h3>Nodes</h3>
            <Link to="/nodes/overview"><div style={{zoom:0.5}} className="number">{ d3.format("s")(totalNodes) }</div></Link>
          </div>
          <div className="visualization">
            <h3>Capacity Used</h3>
            <div style={{zoom:0.5}} className="number">{ d3.format("0.1%")(capacityPercent) }</div>
          </div>
        </div>

        <div className="events-summary visualization-wrapper">
          <h3>Events</h3>
        </div>
      </div>
      <div className="charts">
        <GraphGroup groupId="node.activity" title="Activity" shownDefault={true}>
          <LineGraph title="SQL Connections" sources={sources} tooltip={`The total number of active SQL connections ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.conns" title="Client Connections" />
              </Axis>
            </LineGraph>

            <LineGraph title="SQL Traffic" sources={sources} tooltip={`The average amount of SQL client network traffic in bytes per second ${specifier}.`}>
              <Axis format={ Bytes }>
                <Metric name="cr.node.sql.bytesin" title="Bytes In" nonNegativeRate />
                <Metric name="cr.node.sql.bytesout" title="Bytes Out" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Queries Per Second" sources={sources} tooltip={`The average number of SQL queries per second ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.query.count" title="Queries/Sec" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Live Bytes" sources={sources} tooltip={`The amount of storage space used by live (non-historical) data ${specifier}.`}>
              <Axis format={ Bytes }>
                <Metric name="cr.store.livebytes" title="Live Bytes" />
              </Axis>
            </LineGraph>

            <LineGraph title="Query Time"
                       subtitle="(Max Per Percentile)"
                       tooltip={`The latency between query requests and responses over a 1 minute period.
                                 Percentiles are first calculated on each node.
                                 For each percentile, the maximum latency across all nodes is then shown.`}
                       sources={sources}>
              <Axis format={ (n: number) => d3.format(".1f")(NanoToMilli(n)) } label="Milliseconds">
                <Metric name="cr.node.exec.latency-max" title="Max Latency"
                        aggregateMax downsampleMax />
                <Metric name="cr.node.exec.latency-p99" title="99th percentile latency"
                        aggregateMax downsampleMax />
                <Metric name="cr.node.exec.latency-p90" title="90th percentile latency"
                        aggregateMax downsampleMax />
                <Metric name="cr.node.exec.latency-p50" title="50th percentile latency"
                        aggregateMax downsampleMax />
              </Axis>
            </LineGraph>

            <LineGraph title="GC Pause Time" sources={sources} tooltip={`The ${sources ? "average and maximum" : ""} amount of processor time used by Go’s garbage collector per second ${specifier}. During garbage collection, application code execution is paused.`}>
              <Axis label="Milliseconds" format={ (n) => d3.format(".1f")(NanoToMilli(n)) }>
                <Metric name="cr.node.sys.gc.pause.ns" title={`${sources ? "" : "Avg "}Time`} aggregateAvg nonNegativeRate />
                { node ? null : <Metric name="cr.node.sys.gc.pause.ns" title="Max Time" aggregateMax nonNegativeRate /> }
              </Axis>
            </LineGraph>

          </GraphGroup>
          <GraphGroup groupId="node.queries" title="SQL Queries">
            <LineGraph title="Reads" sources={sources} tooltip={`The average number of SELECT statements per second ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.select.count" title="Selects" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Writes" sources={sources} tooltip={`The average number of INSERT, UPDATE, and DELETE statements per second across ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.update.count" title="Updates" nonNegativeRate />
                <Metric name="cr.node.sql.insert.count" title="Inserts" nonNegativeRate />
                <Metric name="cr.node.sql.delete.count" title="Deletes" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Transactions" sources={sources} tooltip={`The average number of transactions committed, rolled back, or aborted per second ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.txn.commit.count" title="Commits" nonNegativeRate />
                <Metric name="cr.node.sql.txn.rollback.count" title="Rollbacks" nonNegativeRate />
                <Metric name="cr.node.sql.txn.abort.count" title="Aborts" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Schema Changes" sources={sources} tooltip={`The average number of DDL statements per second ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sql.ddl.count" title="DDL Statements" nonNegativeRate />
              </Axis>
            </LineGraph>

          </GraphGroup>
          <GraphGroup groupId="node.resources" title="System Resources">

            <StackedAreaGraph title="CPU Usage" sources={sources} tooltip={`The average percentage of CPU used by CockroachDB (User %) and system-level operations (Sys %) ${specifier}.`}>
              <Axis format={ d3.format(".2%") }>
                <Metric name="cr.node.sys.cpu.user.percent" aggregateAvg title="CPU User %" />
                <Metric name="cr.node.sys.cpu.sys.percent" aggregateAvg title="CPU Sys %" />
              </Axis>
            </StackedAreaGraph>

            <LineGraph title="Memory Usage" sources={sources} tooltip={<div>{`Memory in use ${specifier}:`}<dl>
            <dt>RSS</dt><dd>Total memory in use by CockroachDB</dd>
            <dt>Go Allocated</dt><dd>Memory allocated by the Go layer</dd>
            <dt>Go Total</dt><dd>Total memory managed by the Go layer</dd>
            <dt>C Allocated</dt><dd>Memory allocated by the C layer</dd>
            <dt>C Total</dt><dd>Total memory managed by the C layer</dd>
            </dl></div>}>
              <Axis format={ Bytes }>
                <Metric name="cr.node.sys.rss" title="Total memory (RSS)" />
                <Metric name="cr.node.sys.go.allocbytes" title="Go Allocated" />
                <Metric name="cr.node.sys.go.totalbytes" title="Go Total" />
                <Metric name="cr.node.sys.cgo.allocbytes" title="C Allocated" />
                <Metric name="cr.node.sys.cgo.totalbytes" title="C Total" />
              </Axis>
            </LineGraph>

            <LineGraph title="Goroutine Count" sources={sources} tooltip={`The number of Goroutines ${specifier}. This count should rise and fall based on load.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sys.goroutines" title="Goroutine Count" />
              </Axis>
            </LineGraph>

            <LineGraph title="Cgo Calls" sources={sources} tooltip={`The average number of calls from Go to C per second ${specifier}.`}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.node.sys.cgocalls" title="Cgo Calls" nonNegativeRate />
              </Axis>
            </LineGraph>

          </GraphGroup>
          <GraphGroup groupId="node.internals" title="Advanced Internals">

            <StackedAreaGraph title="Key/Value Transactions" sources={sources}>
              <Axis label="transactions/sec" format={ d3.format(".1f") }>
                <Metric name="cr.node.txn.commits-count" title="Commits" nonNegativeRate />
                <Metric name="cr.node.txn.commits1PC-count" title="Fast 1PC" nonNegativeRate />
                <Metric name="cr.node.txn.aborts-count" title="Aborts" nonNegativeRate />
                <Metric name="cr.node.txn.abandons-count" title="Abandons" nonNegativeRate />
              </Axis>
            </StackedAreaGraph>

            <LineGraph title="Engine Memory Usage" sources={sources}>
              <Axis format={ Bytes }>
                <Metric name="cr.store.rocksdb.block.cache.usage" title="Block Cache" />
                <Metric name="cr.store.rocksdb.block.cache.pinned-usage" title="Iterators" />
                <Metric name="cr.store.rocksdb.memtable.total-size" title="Memtable" />
                <Metric name="cr.store.rocksdb.table-readers-mem-estimate" title="Index" />
              </Axis>
            </LineGraph>

            <StackedAreaGraph title="Block Cache Hits/Misses" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.rocksdb.block.cache.hits"
                        title="Cache Hits"
                        nonNegativeRate />
                <Metric name="cr.store.rocksdb.block.cache.misses"
                        title="Cache Missses"
                        nonNegativeRate />
              </Axis>
            </StackedAreaGraph>

            <StackedAreaGraph title="Range Events" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.range.splits" title="Splits" nonNegativeRate />
                <Metric name="cr.store.range.adds" title="Adds" nonNegativeRate />
                <Metric name="cr.store.range.removes" title="Removes" nonNegativeRate />
              </Axis>
            </StackedAreaGraph>

            <LineGraph title="Flushes and Compactions" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.rocksdb.flushes" title="Flushes" nonNegativeRate />
                <Metric name="cr.store.rocksdb.compactions" title="Compactions" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Bloom Filter Prefix" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.rocksdb.bloom.filter.prefix.checked"
                        title="Checked"
                        nonNegativeRate />
                <Metric name="cr.store.rocksdb.bloom.filter.prefix.useful"
                        title="Useful"
                        nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Read Amplification" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.rocksdb.read-amplification" title="Read Amplification" />
              </Axis>
            </LineGraph>

            <StackedAreaGraph title="Raft Time" sources={sources}>
              <Axis label="Milliseconds" format={ (n) => d3.format(".1f")(NanoToMilli(n)) }>
                <Metric name="cr.store.raft.process.workingnanos" title="Working" nonNegativeRate />
                <Metric name="cr.store.raft.process.tickingnanos" title="Ticking" nonNegativeRate />
              </Axis>
            </StackedAreaGraph>

            <StackedAreaGraph title="Raft Messages received" sources={sources}>
              <Axis label="Count" format={ d3.format(".1f") }>
                <Metric name="cr.store.raft.rcvd.prop" title="MsgProp" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.app" title="MsgApp" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.appresp" title="MsgAppResp" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.vote" title="MsgVote" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.voteresp" title="MsgVoteResp" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.snap" title="MsgSnap" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.heartbeat" title="MsgHeartbeat" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.heartbeatresp" title="MsgHeartbeatResp" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.transferleader" title="MsgTransferLeader" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.timeoutnow" title="MsgTimeoutNow" nonNegativeRate />
                <Metric name="cr.store.raft.rcvd.dropped" title="MsgDropped" nonNegativeRate />
              </Axis>
            </StackedAreaGraph>

            <LineGraph title="GCInfo metrics" sources={sources}>
              <Axis label="Count" format={ d3.format(".1f") }>
                <Metric name="cr.store.queue.gc.info.numkeysaffected" title="NumKeysAffected" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.intentsconsidered" title="IntentsConsidered" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.intenttxns" title="IntentTxns" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.transactionspanscanned" title="TransactionSpanScanned" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.transactionspangcaborted" title="TransactionSpanGCAborted" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.transactionspangccommitted" title="TransactionSpanGCCommitted" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.transactionspangcpending" title="TransactionSpanGCPending" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.abortspanscanned" title="AbortSpanScanned" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.abortspanconsidered" title="AbortSpanConsidered" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.abortspangcnum" title="AbortSpanGCNum" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.pushtxn" title="PushTxn" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.resolvetotal" title="ResolveTotal" nonNegativeRate />
                <Metric name="cr.store.queue.gc.info.resovlesuccess" title="ResolveSuccess" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Raft Transport Queue Pending Count" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.raft.enqueued.pending" title="Outstanding message count in the Raft Transport queue" />
              </Axis>
            </LineGraph>

            <LineGraph title="Replicas: Details" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.replicas.leaders" title="Leaders" />
                <Metric name="cr.store.replicas.leaseholders" title="Lease Holders" />
                <Metric name="cr.store.replicas.leaders_not_leaseholders" title="Leaders w/o Lease" />
                <Metric name="cr.store.replicas.quiescent" title="Quiescent" />
              </Axis>
            </LineGraph>

            <LineGraph title="Raft Ticks" sources={sources}>
              <Axis format={ d3.format(".1f") }>
                <Metric name="cr.store.raft.ticks" title="Raft Ticks" nonNegativeRate />
              </Axis>
            </LineGraph>

            <LineGraph title="Critical Section Time"
                       tooltip={`The maximum duration (capped at 1s) for which the corresponding mutex was held in the last minute ${specifier}.`}
                       sources={sources}>
              <Axis format={ (n: number) => d3.format(".1f")(NanoToMilli(n)) } label="Milliseconds">
                <Metric name="cr.store.mutex.storenanos-max" title="StoreMu"
                        aggregateMax downsampleMax />
                <Metric name="cr.store.mutex.schedulernanos-max" title="SchedulerMu"
                        aggregateMax downsampleMax />
                <Metric name="cr.store.mutex.replicananos-max" title="ReplicaMu"
                        aggregateMax downsampleMax />
                <Metric name="cr.store.mutex.raftnanos-max" title="RaftMu"
                        aggregateMax downsampleMax />
              </Axis>

            </LineGraph>

          </GraphGroup>
      </div>
    </div>;
  }
}

let nodeStatuses = (state: AdminUIState): NodeStatus[] => state.cachedData.nodes.data;
let clusterInfo = createSelector(
  nodeStatuses,
  (nss) => {
    return {
      totalNodes: nss && nss.length || 0,
      availableCapacity: _.sumBy(nss, (ns) => ns.metrics.get(MetricConstants.availableCapacity)),
      bytesUsed: _.sumBy(nss, BytesUsed),
    };
  }
);

let nodeGraphsConnected = connect(
  (state: AdminUIState): {} => {
    return {
      clusterInfo: clusterInfo(state),
    };
  },
  {
    refreshNodes,
  }
)(NodeGraphs);

export default nodeGraphsConnected;
