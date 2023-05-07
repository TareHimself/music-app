import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { INavigationHistory, NavigationSliceState } from "@types";

const initialState: NavigationSliceState = {
  status: "loaded",
  data: {
    backwardHistory: [],
    forwardHistory: [],
    pathData: {},
    contextMenu: null,
  },
};

export const NavigationSlice = createSlice({
  name: "navigation",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setForwardHistory: (state, action: PayloadAction<INavigationHistory[]>) => {
      state.data.forwardHistory = action.payload;
    },
    setBackwardHistory: (
      state,
      action: PayloadAction<INavigationHistory[]>
    ) => {
      state.data.backwardHistory = action.payload;
    },
    setPathData: (state, action: PayloadAction<INavigationHistory["data"]>) => {
      state.data.pathData = action.payload;
    },
    setContextMenu: (
      state,
      action: PayloadAction<NavigationSliceState["data"]["contextMenu"]>
    ) => {
      state.data.contextMenu = action.payload;
    },
  },
});

export const {
  setForwardHistory,
  setBackwardHistory,
  setContextMenu,
  setPathData,
} = NavigationSlice.actions;
export default NavigationSlice.reducer;
