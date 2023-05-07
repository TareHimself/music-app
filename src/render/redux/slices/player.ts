import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ERepeatState, EShuffleState, PlayerSliceState } from "@types";

const initialState: PlayerSliceState = {
  status: "loaded",
  data: {
    currentTrack: null,
    queuedTracks: [],
    recentTracks: [],
    tempQueue: {
      index: 0,
      tracks: [],
    },
    mainQueue: {
      index: 0,
      tracks: [],
    },
    volume: 0.1,
    repeatState: ERepeatState.OFF,
    shuffleState: EShuffleState.OFF,
    isPaused: true,
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
    },
    replaceRecentTracks: (state, action: PayloadAction<string[]>) => {
      state.data.recentTracks = action.payload;
    },
    replaceQueuedTracks: (state, action: PayloadAction<string[]>) => {
      state.data.queuedTracks = action.payload;
    },
    setShuffleState: (state, action: PayloadAction<EShuffleState>) => {
      state.data.shuffleState = action.payload;
      if (action.payload === EShuffleState.ON) {
        state.data.queuedTracks = [...state.data.queuedTracks].sort(
          () => 0.5 - Math.random()
        );
      }
    },
    setRepeatState: (state, action: PayloadAction<ERepeatState>) => {
      state.data.repeatState = action.payload;
    },
    setIsPaused: (state, action: PayloadAction<boolean>) => {
      state.data.isPaused = action.payload;
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
  setIsPaused,
} = PlayerSlice.actions;
export default PlayerSlice.reducer;
