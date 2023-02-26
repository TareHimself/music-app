import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GenericSliceData } from "../../../types";
import AppConstants from "../../../data";

export type AppSliceState = GenericSliceData<{
  screenId: string;
}>;

const initialState: AppSliceState = {
  status: "loaded",
  data: {
    screenId: AppConstants.MAIN_NAV_IDS[1],
  },
};

export const AppSlice = createSlice({
  name: "app",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setScreenId: (state, action: PayloadAction<string>) => {
      state.data.screenId = action.payload;
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  extraReducers: (builder) => {},
});

export const { setScreenId } = AppSlice.actions;

export default AppSlice.reducer;
