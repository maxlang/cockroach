/**
 * This module maintains a globally-available time window, currently used by all
 * metrics graphs in the ui.
 */

import { Action, PayloadAction } from "../interfaces/action";
import _ from "lodash";
import moment from "moment";

import { TimeScale, TimeWindow, TimeWindowState } from "./state";

export const SET_WINDOW = "cockroachui/timewindow/SET_WINDOW";
export const SET_SCALE = "cockroachui/timewindow/SET_SCALE";

export interface TimeScaleCollection {
  [key: string]: TimeScale;
}

/**
 * availableTimeScales is a preconfigured set of time scales that can be
 * selected by the user.
 */
export let availableTimeScales: TimeScaleCollection = {
  "10 min": {
    windowSize: moment.duration(10, "minutes"),
    windowValid: moment.duration(10, "seconds"),
  },
  "1 hour": {
    windowSize: moment.duration(1, "hour"),
    windowValid: moment.duration(1, "minute"),
  },
  "6 hours": {
    windowSize: moment.duration(6, "hours"),
    windowValid: moment.duration(5, "minutes"),
  },
  "12 hours": {
    windowSize: moment.duration(12, "hours"),
    windowValid: moment.duration(10, "minutes"),
  },
  "1 day": {
    windowSize: moment.duration(1, "day"),
    windowValid: moment.duration(10, "minutes"),
  },
};

export default function(state = new TimeWindowState(availableTimeScales["10 min"]), action: Action): TimeWindowState {
  switch (action.type) {
    case SET_WINDOW:
      let { payload: tw } = action as PayloadAction<TimeWindow>;
      state = _.clone(state);
      state.currentWindow = tw;
      state.scaleChanged = false;
      return state;
    case SET_SCALE:
      let { payload: scale } = action as PayloadAction<TimeScale>;
      state = _.clone(state);
      state.scale = scale;
      state.scaleChanged = true;
      return state;
    default:
      return state;
  }
}

export function setTimeWindow(tw: TimeWindow): PayloadAction<TimeWindow> {
  return {
    type: SET_WINDOW,
    payload: tw,
  };
}

export function setTimeScale(ts: TimeScale): PayloadAction<TimeScale> {
  return {
    type: SET_SCALE,
    payload: ts,
  };
}
