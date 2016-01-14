/// <reference path="../../../bower_components/mithriljs/mithril.d.ts" />
/// <reference path="../../../typings/d3/d3.d.ts" />

// Author: Max Lang (max@cockroachlabs.com)

module Visualizations {
  "use strict";

  import MithrilVirtualElement = _mithril.MithrilVirtualElement;

  interface NumberVisualizationData {
    value: number;
  }

  interface NumberVisualizationConfig {
    format?: string; // TODO: better automatic formatting
    formatFn?: (n: number) => string;
    zoom?: string; // TODO: compute fontsize/zoom automatically
    data: NumberVisualizationData;
  }

  class Controller {}

  export module NumberVisualization {
    export function controller(): Controller {
      return new Controller();
    }

    export function view(ctrl: Controller, info: NumberVisualizationConfig): MithrilVirtualElement {
      let formatFn: (n: number) => string = info.formatFn || d3.format(info.format || ".3s");

      return m(
        ".visualization",
        m(".number", {style: "zoom:" + (info.zoom || "100%") + ";"}, formatFn(info.data.value))
      );
    }
  }
}
