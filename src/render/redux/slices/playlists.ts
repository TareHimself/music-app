import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ensureBridge } from "../../utils";
import { GenericSliceData, IPlaylist } from "../../../types";

export type PlaylistsSliceState = GenericSliceData<{
  playlists: { [key: string]: IPlaylist };
  playlistsIds: string[];
}>;

const initialState: PlaylistsSliceState = {
  status: "empty",
  data: {
    playlists: {},
    playlistsIds: [],
  },
};

const loadPlaylists = createAsyncThunk("playlists/load", async () => {
  try {
    await ensureBridge();
    const items = await window.bridge.getPlaylists();
    const index: { [key: string]: IPlaylist } = {};

    const ids = items
      .sort((a, b) => {
        return b.position - a.position;
      })
      .map((a) => {
        index[a.id] = a;
        return a.id;
      });

    console.log(`Loaded ${ids.length} Playlists`, items, index, ids);
    return { ids, lookup: index };
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return { ids: [], lookup: {} };
  }
});

const createPlaylist = createAsyncThunk(
  "playlists/create",
  async ({ title, position }: { title: string; position: number }) => {
    try {
      await ensureBridge();

      return await window.bridge.createPlaylists([
        {
          title: title,
          position: position,
          cover:
            "https://e-cdn-images.dzcdn.net/images/cover/e5575c7a8dbda3440911c64f1508f15c/264x264-000000-80-0-0.jpg",
        },
      ]);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

export const playlistsSlice = createSlice({
  name: "playlists",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    editPlaylist: (
      state,
      action: PayloadAction<Partial<IPlaylist> & { id: IPlaylist["id"] }>
    ) => {
      state.data.playlists[action.payload.id] = {
        ...state.data.playlists[action.payload.id],
        ...action.payload,
      };
    },
    setStatus: (state, action: PayloadAction<(typeof state)["status"]>) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadPlaylists.fulfilled, (state, action) => {
      state.data.playlistsIds = action.payload.ids;
      state.data.playlists = action.payload.lookup;
      state.status = "loaded";
    });
    builder.addCase(createPlaylist.fulfilled, (state, action) => {
      if (action.payload) {
        action.payload.forEach((p) => {
          state.data.playlists[p.id] = p;
          state.data.playlistsIds.unshift(p.id);
        });
        state.data.playlistsIds.sort(
          (a, b) =>
            state.data.playlists[b].position - state.data.playlists[a].position
        );
      }
    });
  },
});

export const { editPlaylist, setStatus } = playlistsSlice.actions;
export { loadPlaylists, createPlaylist };

export default playlistsSlice.reducer;
