import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import AppConstants from "../../../data";
import {
  GenericSliceData,
  IAlbum,
  IArtist,
  IArtistRaw,
  ILikedTrack,
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
  likedTracks: ILikedTrack[];
  likedTracksLookup: KeyValuePair<string, boolean>;
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
    likedTracks: [],
    likedTracksLookup: {},
  },
};

const initLibrary = createAsyncThunk("library/load", async () => {
  try {
    const result = await toast.promise(
      new Promise<
        [
          KeyValuePair<string, IPlaylist>,
          KeyValuePair<string, IArtist>,
          KeyValuePair<string, IAlbum>,
          KeyValuePair<string, ITrack>,
          ILikedTrack[]
        ]
      >((res, rej) => {
        try {
          ensureBridge().then(async () => {
            const playlists = await window.bridge.getPlaylists();
            const albums = await window.bridge.getAlbums();
            const likedTracks = await window.bridge.getLikedTracks();

            const artistsToLoad: string[] = [];
            const tracksToLoad: string[] = [];

            const playlistsIndex = arrayToIndex(playlists, (a) => a);
            const albumsIndex = arrayToIndex(albums, (a) => {
              artistsToLoad.push(...a.artists);
              return a;
            });

            likedTracks.forEach((t) => tracksToLoad.push(t.track));

            const tracksIndex = arrayToIndex<ITrack>(
              await window.bridge.getTracks(tracksToLoad),
              (a) => {
                artistsToLoad.push(...a.artists);
                return a;
              }
            );

            const artistsIndex = arrayToIndex<IArtistRaw, IArtist>(
              await window.bridge.getArtists(
                Array.from(new Set(artistsToLoad))
              ),
              (a) => a
            );
            console.log(
              `Loaded ${playlists.length} Playlists, ${
                albums.length
              } Albums and ${Object.keys(artistsIndex).length} Artists`
            );

            res([
              playlistsIndex,
              artistsIndex,
              albumsIndex,
              tracksIndex,
              likedTracks,
            ]);
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
    return [{}, {}, {}, {}, []] as [
      KeyValuePair<string, IPlaylist>,
      KeyValuePair<string, IArtist>,
      KeyValuePair<string, IAlbum>,
      KeyValuePair<string, ITrack>,
      ILikedTrack[]
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

const likeTrack = createAsyncThunk(
  "library/track-like-add",
  async ({ track }: { track: string }) => {
    try {
      const newLiked: ILikedTrack = {
        track: track,
        timestamp: Math.round(Date.now() * 1000), // accurate to seconds
      };
      await window.bridge.addLikedTracks([newLiked]);
      return newLiked;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  }
);

const removeLikedTrack = createAsyncThunk(
  "library/track-like-remove",
  async ({ track }: { track: string }) => {
    try {
      await window.bridge.removeLikedTracks([track]);
      return track;
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
      state.data.tracks = action.payload[3];
      state.data.likedTracks = action.payload[4];
      state.data.likedTracksLookup = action.payload[4].reduce<
        KeyValuePair<string, boolean>
      >((hash, cur) => {
        hash[cur.track] = true;
        return hash;
      }, {});
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
    builder.addCase(likeTrack.fulfilled, (state, action) => {
      if (action.payload) {
        state.data.likedTracks.unshift(action.payload);
        state.data.likedTracksLookup[action.payload.track] = true;
      }
    });
    builder.addCase(removeLikedTrack.fulfilled, (state, action) => {
      if (action.payload) {
        state.data.likedTracks.splice(
          state.data.likedTracks.findIndex((t) => t.track === action.payload),
          1
        );
        delete state.data.likedTracksLookup[action.payload];
      }
    });
  },
});

export const { setScreenId } = LibarySlice.actions;
export {
  initLibrary,
  loadTracks,
  loadTracksForAlbum,
  createPlaylist,
  importIntoLibrary,
  updateTrack,
  likeTrack,
  removeLikedTrack,
};
export default LibarySlice.reducer;
