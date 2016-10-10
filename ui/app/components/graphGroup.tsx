import _ from "lodash";
import * as React from "react";
import { connect } from "react-redux";

import { MetricsDataProvider } from "../containers/metricsDataProvider";
import { AdminUIState } from "../redux/state";
import { setUISetting } from "../redux/ui";

const SHOWN_SETTING_PREFIX = "graphGroup/SHOWN_SETTING/";

// /**
//  * GraphGroup is a stateless react component that wraps a group of graphs (the
//  * children of this component) in a MetricsDataProvider and some additional tags
//  * relevant to the layout of our graphs pages.
//  */
// export default function(props: { groupId: string, childClassName?: string, children?: any }) {
//   return <div>
//   {
//     React.Children.map(props.children, (child, idx) => {
//       let key = props.groupId + idx.toString();
//       return <div style={{float:"left"}} key={key} className={ props.childClassName || "" }>
//         <MetricsDataProvider id={key}>
//           { child }
//         </MetricsDataProvider>
//       </div>;
//     })
//   }
//   </div>;
// }

interface GraphGroupProps {
  groupId: string;
  childClassName?: string;
  setUISetting: typeof setUISetting;
  shownAccessor: string;
  shownSetting: boolean;
  title: string;
}

class GraphGroup extends React.Component<GraphGroupProps, {}> {

  setVisibility(visibility: boolean) {
    this.props.setUISetting(this.props.shownAccessor, visibility);
  }

  render() {
    return <div className="graph-group">
      {this.props.title ?
        <div onClick={() => this.setVisibility(!this.props.shownSetting)}><h2 className="graph-group-title">{this.props.title}</h2>
          <img className={"expand-icon " + (this.props.shownSetting ? "shown" : "hidden")} src="/assets/Collapse icon.png" /></div> :
        null}
      {this.props.shownSetting ?
        (React.Children.map(this.props.children, (child, idx) => {
          let key = this.props.groupId + idx.toString();
          return <div style={{ float: "left" }} key={key} className={this.props.childClassName || ""}>
            <MetricsDataProvider id={key}>
              {child}
            </MetricsDataProvider>
          </div>;
        })) : null}
    </div>;
  }
}

interface GraphGroupOwnProps {
  groupId: string;
  title?: string;
  childClassName?: string;
  shownDefault?: boolean;
}

let graphGroupConnected = connect(
  (state: AdminUIState, ownProps: GraphGroupOwnProps) => {
    let shownAccessor = SHOWN_SETTING_PREFIX + ownProps.groupId;
    return {
      shownAccessor: shownAccessor,
      shownSetting: !_.isUndefined(state.ui[shownAccessor]) ? state.ui[shownAccessor] : (ownProps.shownDefault || false),
    };
  },
  {
    setUISetting,
  }
)(GraphGroup);

export default graphGroupConnected;
