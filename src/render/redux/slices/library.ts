import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import AppConstants from "../../../data";
import {
  GenericSliceData,
  IAlbum,
  IArtist,
  IArtistRaw,
  IPlaylist,
  ITrack,
  ITrackUpdate,
  KeyValuePair,
} from "../../../types";
import { arrayToIndex, ensureBridge } from "../../utils";

export type AppSliceState = GenericSliceData<{
  screenId: string;
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  playlists: KeyValuePair<string, IPlaylist>;
  artists: KeyValuePair<string, IArtist>;
  googleDriveApiKey: string;
}>;

const initialState: AppSliceState = {
  status: "loading",
  data: {
    screenId: AppConstants.MAIN_NAV_IDS[1] || "",
    tracks: {},
    albums: {},
    playlists: {},
    artists: {},
    googleDriveApiKey: "",
  },
};

const initLibrary = createAsyncThunk("library/load", async () => {
  try {
    const result = await toast.promise(
      new Promise<
        [
          KeyValuePair<string, IPlaylist>,
          KeyValuePair<string, IArtist>,
          KeyValuePair<string, IAlbum>
        ]
      >((res, rej) => {
        try {
          ensureBridge().then(async () => {
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
              `Loaded ${playlists.length} Playlists, ${
                albums.length
              } Albums and ${Object.keys(artistsIndex).length} Artists`
            );

            res([playlistsIndex, artistsIndex, albumsIndex]);
          });
        } catch (error) {
          rej(error);
        }
      }),
      {
        loading: "Loading Library",
        success: "Library Loaded",
        error: "Error Loading Library",
      }
    );

    return result;
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
      library: GenericSliceData<{ artists: KeyValuePair<string, IArtist> }>;
    };
  }
>("library/load-tracks", async ({ trackIds }, thunk) => {
  try {
    await ensureBridge();

    const existingArtists = thunk.getState().library.data.artists;

    const tracks = await window.bridge.getTracks(trackIds);

    const artistsNeeded = Array.from(
      new Set(
        tracks.reduce<string[]>((t, c) => {
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
      library: GenericSliceData<{ artists: KeyValuePair<string, IArtist> }>;
    };
  }
>("library/load-album-tracks", async ({ albumId }, thunk) => {
  try {
    await ensureBridge();

    const existingArtists = thunk.getState().library.data.artists;

    const tracks = await window.bridge.getAlbumTracks(albumId);

    const artistsNeeded = Array.from(
      new Set(
        tracks.reduce<string[]>((t, c) => {
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
  "library/create-playlist",
  async ({ title, position }: { title: string; position: number }) => {
    try {
      await ensureBridge();

      return (
        await window.bridge.createPlaylists([
          {
            title: title,
            position: position,
            cover: "",
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

const importIntoLibrary = createAsyncThunk(
  "library/import-items",
  async ({ items }: { items: string[] }) => {
    try {
      const result = await toast.promise(
        new Promise<Awaited<ReturnType<typeof window.bridge.importItems>>>(
          (res, rej) => {
            try {
              ensureBridge().then(async () => {
                const newData = await window.bridge.importItems(items);

                console.log(
                  `Immported ${
                    Object.keys(newData.playlists).length
                  } Playlists, ${
                    Object.keys(newData.albums).length
                  } Albums and ${Object.keys(newData.artists).length} Artists`
                );

                res(newData);
              });
            } catch (error) {
              rej(error);
            }
          }
        ),
        {
          loading: "Importing",
          success: "Import Complete",
          error: "Import Error",
        }
      );

      return result;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

const updateTrack = createAsyncThunk(
  "library/update-track",
  async ({ update }: { update: ITrackUpdate }) => {
    try {
      await window.bridge.updateTrack(update);
      return update;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

export const LibarySlice = createSlice({
  name: "library",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setScreenId: (state, action: PayloadAction<string>) => {
      state.data.screenId = action.payload;
    },
    updateTrackSync: (state, action: PayloadAction<ITrackUpdate>) => {
      if (state.data.tracks[action.payload.id]) {
        state.data.tracks[action.payload.id] = {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...state.data.tracks[action.payload.id]!,
          ...action.payload,
        };
      }
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  extraReducers: (builder) => {
    builder.addCase(initLibrary.fulfilled, (state, action) => {
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
    builder.addCase(importIntoLibrary.fulfilled, (state, action) => {
      if (action.payload) {
        state.data.albums = { ...state.data.albums, ...action.payload.albums };
        state.data.artists = {
          ...state.data.artists,
          ...action.payload.artists,
        };
        state.data.playlists = {
          ...state.data.playlists,
          ...action.payload.playlists,
        };
      }
    });
    builder.addCase(updateTrack.fulfilled, (state, action) => {
      if (action.payload && state.data.tracks[action.payload.id]) {
        state.data.tracks[action.payload.id] = {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...state.data.tracks[action.payload.id]!,
          ...action.payload,
        };
      }
    });
  },
});

export const { setScreenId } = LibarySlice.actions;
export {
  initLibrary as initLibrary,
  loadTracks,
  loadTracksForAlbum,
  createPlaylist,
  importIntoLibrary,
  updateTrack,
};
export default LibarySlice.reducer;
