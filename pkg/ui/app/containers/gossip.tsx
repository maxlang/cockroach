import _ = require("lodash");
import * as React from "react";
import { IInjectedProps } from "react-router";
import { AdminUIState } from "../redux/state";
import { refreshGossip } from "../redux/apiReducers";
import { connect } from "react-redux";

import * as protos from "../js/protos";
import { nodeIDAttr } from "../util/constants";
import { GossipResponseMessage } from "../util/api";

import { SortableTable } from "../components/sortabletable";

interface GossipProps {
  gossip: GossipResponseMessage;
  refreshGossip: typeof refreshGossip;
}

/**
 * Renders the main content of the help us page.
 */
class Gossip extends React.Component<GossipProps & IInjectedProps, {}> {

  componentWillMount() {
    this.props.refreshGossip(new protos.cockroach.server.serverpb.GossipRequest({ node_id: this.props.params[nodeIDAttr] }));
  }

  render() {
    if (this.props.gossip) {
      let gossipKVPairs = _.map(this.props.gossip.infos, (value, key): { key: string, value: string } => { return { key, value: JSON.stringify(value) }; });
      console.log("gossip", gossipKVPairs);
      const columns = [
        {
          title: "Key",
          cell: (index: number) => gossipKVPairs[index].key,
        },
        {
          title: "Value",
          cell: (index: number) => gossipKVPairs[index].value,
        },
      ];
      return <div className="logs-table">
        <SortableTable count={gossipKVPairs.length} columns={columns}>
        </SortableTable>
      </div>;
    }
    return <div className="logs-table">
      No data.
    </div>;
  }
}

let gossip = (state: AdminUIState): GossipResponseMessage => state.cachedData.gossip.data;

// Connect the EventsList class with our redux store.
let gossipConnected = connect(
  (state: AdminUIState) => {
    return {
      gossip: gossip(state),
    };
  },
  {
    refreshGossip,
  },
)(Gossip);

export default gossipConnected;
