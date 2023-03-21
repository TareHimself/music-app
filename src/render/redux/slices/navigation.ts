import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GenericSliceData } from "../../../types";

export type NavigationSliceState = GenericSliceData<{
  backwardHistory: string[];
  forwardHistory: string[];
}>;

const initialState: NavigationSliceState = {
  status: "loaded",
  data: {
    backwardHistory: [],
    forwardHistory: [],
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
  },
});

export const { setForwardHistory, setBackwardHistory } =
  NavigationSlice.actions;
export default NavigationSlice.reducer;
