import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ensureBridge } from "../../utils";
import { GenericSliceData, IAlbum, IAlbumNew, IArtist, KeyValuePair } from "../../../types";

export type AlbumsSliceState = GenericSliceData<{
  albums: KeyValuePair<string, IAlbum>;
  albumIds: string[];
  artists: KeyValuePair<string, IArtist>;
}>;

const initialState: AlbumsSliceState = {
  status: "empty",
  data: {
    albums: {},
    albumIds: [],
    artists: {},
  },
};

const loadAlbums = createAsyncThunk("albums/load", async () => {
  try {
    await ensureBridge();
    console.log("Loading albums")
    const items = await window.bridge.getAlbums();
    const index: { [key: string]: IAlbum } = {};

    const ids = items.map((a) => {
      index[a.id] = a;
      return a.id;
    });

    console.log("Loading Artists")
    const artists = await window.bridge.getArtists([]);

    console.log(`Loaded ${items.length} albums and ${artists.length} artists`)

    return {
      ids, lookup: index, artists: artists.reduce((t, a) => {
        t[a.id] = a;
        return t
      }, {} as KeyValuePair<string, IArtist>)
    };
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return { ids: [], lookup: {}, artists: {} };
  }
});

const createAlbums = createAsyncThunk(
  "albums/create",
  async ({ albums }: { albums: IAlbumNew[] }) => {
    try {
      await ensureBridge();

      return await window.bridge.createAlbums(albums);
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

export const albumsSlice = createSlice({
  name: "albums",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    editAlbum: (
      state,
      action: PayloadAction<
        Partial<IAlbum> & { id: IAlbum['id'] }
      >
    ) => {
      state.data.albums[action.payload.id] = {
        ...state.data.albums[action.payload.id],
        ...action.payload,
      };
    },
    setAlbumsStatus: (state, action: PayloadAction<(typeof state)["status"]>) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadAlbums.fulfilled, (state, action) => {
      state.data.albumIds = action.payload.ids;
      state.data.albums = action.payload.lookup;
      state.data.artists = action.payload.artists;
      state.status = "loaded";
      console.log(action.payload.artists)
    });
    builder.addCase(createAlbums.fulfilled, (state, action) => {
      if (action.payload) {
        action.payload.forEach(p => {
          state.data.albums[p.id] = p;
          state.data.albumIds.unshift(p.id)
        })
      }
    });
  },
});

export const { editAlbum, setAlbumsStatus } = albumsSlice.actions;
export { loadAlbums, createAlbums };

export default albumsSlice.reducer;
