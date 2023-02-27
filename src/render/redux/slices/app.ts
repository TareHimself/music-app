import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import AppConstants from "../../../data";
import {
  GenericSliceData,
  IAlbum,
  IArtist,
  IArtistRaw,
  IPlaylist,
  ITrack,
  KeyValuePair,
} from "../../../types";
import { arrayToIndex, ensureBridge } from "../../utils";

export type AppSliceState = GenericSliceData<{
  screenId: string;
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  playlists: KeyValuePair<string, IPlaylist>;
  artists: KeyValuePair<string, IArtist>;
  currentTrack: ITrack | null;
}>;

const initialState: AppSliceState = {
  status: "loading",
  data: {
    screenId: AppConstants.MAIN_NAV_IDS[1],
    tracks: {},
    albums: {},
    playlists: {},
    artists: {},
    currentTrack: null,
  },
};

const initApp = createAsyncThunk("app/load", async () => {
  try {
    await ensureBridge();
    const playlists = await window.bridge.getPlaylists();
    const albums = await window.bridge.getAlbums();
    const artistsToLoad: string[] = [];
    const playlistsIndex = arrayToIndex(playlists, (a) => a);
    const albumsIndex = arrayToIndex(albums, (a) => {
      artistsToLoad.push(...a.artists);
      return a;
    });

    const artistsIndex = arrayToIndex<IArtistRaw, IArtist>(
      await window.bridge.getArtists(artistsToLoad),
      (a) => a
    );

    console.log(
      `Loaded ${playlists.length} Playlists, ${albums.length} Albums and ${
        Object.keys(artistsIndex).length
      } Artists`
    );

    return [playlistsIndex, artistsIndex, albumsIndex] as [
      KeyValuePair<string, IPlaylist>,
      KeyValuePair<string, IArtist>,
      KeyValuePair<string, IAlbum>
    ];
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return [{}, {}, {}] as [
      KeyValuePair<string, IPlaylist>,
      KeyValuePair<string, IArtist>,
      KeyValuePair<string, IAlbum>
    ];
  }
});

const loadTracks = createAsyncThunk<
  [ITrack[], IArtist[]],
  { trackIds: string[] },
  {
    state: {
      app: GenericSliceData<{ artists: KeyValuePair<string, IArtist> }>;
    };
  }
>("app/load-tracks", async ({ trackIds }, thunk) => {
  try {
    await ensureBridge();

    await ensureBridge();

    const existingArtists = thunk.getState().app.data.artists;

    const tracks = await window.bridge.getTracks(trackIds);

    const artistsNeeded = Array.from(
      new Set(
        tracks.reduce((t, c) => {
          const missingArtists = c.artists.filter(
            (c) => existingArtists[c] === undefined
          );
          if (missingArtists.length > 0) {
            t.push(...c.artists);
          }
          return t;
        }, [])
      )
    );

    const artistsGotten = await window.bridge.getArtists(artistsNeeded);

    return [tracks, artistsGotten] as [ITrack[], IArtist[]];
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return [[], []];
  }
});

const loadTracksForAlbum = createAsyncThunk<
  [ITrack[], IArtist[]],
  { albumId: string },
  {
    state: {
      app: GenericSliceData<{ artists: KeyValuePair<string, IArtist> }>;
    };
  }
>("app/load-album-tracks", async ({ albumId }, thunk) => {
  try {
    await ensureBridge();

    const existingArtists = thunk.getState().app.data.artists;

    const tracks = await window.bridge.getAlbumTracks(albumId);

    const artistsNeeded = Array.from(
      new Set(
        tracks.reduce((t, c) => {
          const missingArtists = c.artists.filter(
            (c) => existingArtists[c] === undefined
          );
          if (missingArtists.length > 0) {
            t.push(...c.artists);
          }
          return t;
        }, [])
      )
    );

    const artistsGotten = await window.bridge.getArtists(artistsNeeded);

    return [tracks, artistsGotten];
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return [[], []];
  }
});

const createPlaylist = createAsyncThunk(
  "app/create-playlist",
  async ({ title, position }: { title: string; position: number }) => {
    try {
      await ensureBridge();

      return (
        await window.bridge.createPlaylists([
          {
            title: title,
            position: position,
            cover:
              "https://e-cdn-images.dzcdn.net/images/cover/e5575c7a8dbda3440911c64f1508f15c/264x264-000000-80-0-0.jpg",
          },
        ])
      )[0];
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

export const AppSlice = createSlice({
  name: "app",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setScreenId: (state, action: PayloadAction<string>) => {
      state.data.screenId = action.payload;
    },
    setCurrentTrack: (state, action: PayloadAction<ITrack | null>) => {
      state.data.currentTrack = action.payload;
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  extraReducers: (builder) => {
    builder.addCase(initApp.fulfilled, (state, action) => {
      state.data.playlists = action.payload[0];
      state.data.artists = action.payload[1];
      state.data.albums = action.payload[2];
    });
    builder.addCase(loadTracks.fulfilled, (state, action) => {
      action.payload[0].forEach((a) => {
        state.data.tracks[a.id] = a;
      });

      action.payload[1].forEach((a) => {
        state.data.artists[a.id] = a;
      });
    });
    builder.addCase(loadTracksForAlbum.fulfilled, (state, action) => {
      action.payload[0].forEach((a) => {
        state.data.tracks[a.id] = a;
      });

      action.payload[1].forEach((a) => {
        state.data.artists[a.id] = a;
      });
    });
    builder.addCase(createPlaylist.fulfilled, (state, action) => {
      if (action.payload)
        state.data.playlists[action.payload.id] = action.payload;
    });
  },
});

export const { setScreenId, setCurrentTrack } = AppSlice.actions;
export { initApp, loadTracks, loadTracksForAlbum, createPlaylist };
export default AppSlice.reducer;
