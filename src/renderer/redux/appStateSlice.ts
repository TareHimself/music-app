import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { IAppState } from 'renderer/types';

// Define a type for the slice state

// Define the initial state using that type
const initialState: IAppState = {
  settingsState: 'neutral',
};

export const appStateSlice = createSlice({
  name: 'appState',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSettingsState: (
      state,
      action: PayloadAction<IAppState['settingsState']>
    ) => {
      state.settingsState = action.payload;
    },
  },
  extraReducers: () => {},
});

export const { setSettingsState } = appStateSlice.actions;

export default appStateSlice.reducer;
