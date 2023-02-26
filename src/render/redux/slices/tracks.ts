import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { GenericSliceData, ITrack } from "../../../types";
import { ensureBridge } from "../../utils";

export type TracksIndex = { [trackId: string]: ITrack }
export type TracksSliceState = GenericSliceData<TracksIndex>;

const initialState: TracksSliceState = {
  status: 'loaded',
  data: {},
};

const loadTracks = createAsyncThunk("playlists/load", async ({ trackIds }: { trackIds: string[] }) => {
  try {
    await ensureBridge();
    const tracksFound = await window.bridge.getTracks(trackIds)

    return tracksFound.reduce((indexed, track) => {
      indexed[track.id] = track
      return indexed;
    }, {} as TracksIndex);
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return {};
  }
});

export const TracksSlice = createSlice({
  name: "tracks",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  extraReducers: (builder) => {
    builder.addCase(loadTracks.fulfilled, (stata, action) => {
      stata.data = action.payload;
    })
  },
});

export default TracksSlice.reducer;

