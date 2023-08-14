import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AppConstants from "@root/data";
import { INavigationHistory, NavigationSliceState } from "@types";

// To prevent state updates every time we set it
let pathData: INavigationHistory["data"] = {}

const initialState: NavigationSliceState = {
  status: "loaded",
  data: {
    screenId: AppConstants.MAIN_NAV_IDS[1] || "",
    backwardHistory: [],
    forwardHistory: [],
    contextMenu: null,
  },
};

export const NavigationSlice = createSlice({
  name: "navigation",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setScreenId: (state, action: PayloadAction<string>) => {
      state.data.screenId = action.payload;
    },
    setForwardHistory: (state, action: PayloadAction<INavigationHistory[]>) => {
      state.data.forwardHistory = action.payload;
    },
    setBackwardHistory: (
      state,
      action: PayloadAction<INavigationHistory[]>
    ) => {
      state.data.backwardHistory = action.payload;
    },
    setContextMenu: (
      state,
      action: PayloadAction<NavigationSliceState["data"]["contextMenu"]>
    ) => {
      state.data.contextMenu = action.payload;
    },
  },
});

export function setPathData(data: INavigationHistory["data"]){
  pathData = data
}

export function getPathData(){
  return pathData
}
export const { setScreenId } = NavigationSlice.actions;
export const {
  setForwardHistory,
  setBackwardHistory,
  setContextMenu,
} = NavigationSlice.actions;
export default NavigationSlice.reducer;
