import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GenericSliceData, IActiveContextMenu } from "../../../types";

export type NavigationSliceState = GenericSliceData<{
  backwardHistory: string[];
  forwardHistory: string[];
  contextMenu: IActiveContextMenu | null;
}>;

const initialState: NavigationSliceState = {
  status: "loaded",
  data: {
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
    setForwardHistory: (state, action: PayloadAction<string[]>) => {
      state.data.forwardHistory = action.payload;
    },
    setBackwardHistory: (state, action: PayloadAction<string[]>) => {
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

export const { setForwardHistory, setBackwardHistory, setContextMenu } =
  NavigationSlice.actions;
export default NavigationSlice.reducer;
