import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ERepeatState, EShuffleState, GenericSliceData } from "../../../types";

export type AppSliceState = GenericSliceData<{
  currentTrack: string | null;
  queuedTracks: string[];
  recentTracks: string[];
  volume: number;
  repeatState: ERepeatState;
  shuffleState: EShuffleState;
}>;

const initialState: AppSliceState = {
  status: "loaded",
  data: {
    currentTrack: null,
    queuedTracks: [],
    recentTracks: [],
    volume: 0.1,
    repeatState: ERepeatState.OFF,
    shuffleState: EShuffleState.OFF,
  },
};

export const PlayerSlice = createSlice({
  name: "player",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<string | null>) => {
      state.data.currentTrack = action.payload;
    },
    addRecentTracks: (state, action: PayloadAction<string[]>) => {
      state.data.recentTracks = [...action.payload, ...state.data.recentTracks];
    },
    addQueuedTracks: (state, action: PayloadAction<string[]>) => {
      state.data.queuedTracks = [...state.data.queuedTracks, ...action.payload];
      if (state.data.shuffleState === EShuffleState.ON) {
        state.data.queuedTracks = [...state.data.queuedTracks].sort(
          () => 0.5 - Math.random()
        );
      }
    },
    replaceRecentTracks: (state, action: PayloadAction<string[]>) => {
      state.data.recentTracks = action.payload;
    },
    replaceQueuedTracks: (state, action: PayloadAction<string[]>) => {
      state.data.queuedTracks = action.payload;
      if (state.data.shuffleState === EShuffleState.ON) {
        state.data.queuedTracks = [...state.data.queuedTracks].sort(
          () => 0.5 - Math.random()
        );
      }
    },
    setShuffleState: (state, action: PayloadAction<EShuffleState>) => {
      state.data.shuffleState = action.payload;
      state.data.queuedTracks = [...state.data.queuedTracks].sort(
        () => 0.5 - Math.random()
      );
    },
    setRepeatState: (state, action: PayloadAction<ERepeatState>) => {
      state.data.repeatState = action.payload;
    },
  },
});

export const {
  setCurrentTrack,
  addRecentTracks,
  addQueuedTracks,
  replaceQueuedTracks,
  replaceRecentTracks,
  setRepeatState,
  setShuffleState,
} = PlayerSlice.actions;
export default PlayerSlice.reducer;
