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
  IPlaylistUpdate,
  ITrack,
  ITrackUpdate,
  KeyValuePair,
} from "../../../types";
import { arrayToIndex, ensureBridge } from "../../utils";

const ALBUM_TRACKS_LOADED: KeyValuePair<string, boolean> = {};
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

type SliceState = {
  state: {
    library: AppSliceState;
  };
};

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

const initLibrary = createAsyncThunk<
  [
    KeyValuePair<string, IPlaylist>,
    KeyValuePair<string, IArtist>,
    KeyValuePair<string, IAlbum>,
    KeyValuePair<string, ITrack>,
    ILikedTrack[]
  ],
  undefined,
  SliceState
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>("library/load", async (_, _thunk) => {
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

            // This is to fix some dev bugs
            // const playlistUpdates = Object.values(playlistsIndex)
            //   .sort((a, b) => {
            //     const posA = a.position;
            //     const posB = b.position;
            //     if (posA === -1 && posA === posB) {
            //       return 0;
            //     } else if (posA === -1) {
            //       return 1;
            //     } else if (posB === -1) {
            //       return -1;
            //     }
            //     return posA - posB;
            //   })
            //   .filter((a, idx) => {
            //     if (a.position === -1) {
            //       a.position = idx;
            //       const item = playlistsIndex[a.id];
            //       if (item) {
            //         item.position = idx;
            //       }
            //       return true;
            //     }
            //     return false;
            //   })
            //   .map((a) => {
            //     const update: IPlaylistUpdate = {
            //       id: a.id,
            //       position: a.position,
            //     };

            //     return update;
            //   });

            // if (playlistUpdates.length > 0) {
            //   await window.bridge.updatePlaylists(playlistUpdates);
            // }

            console.log();

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
        success: (data) => {
          return `Loaded ${Object.keys(data[0]).length} Playlists, and ${
            Object.keys(data[2]).length
          } Albums`;
        },
        error: "Error Loading Library",
      }
    );

    return result;
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return [{}, {}, {}, {}, []];
  }
});

const loadTracks = createAsyncThunk<
  [ITrack[], IArtist[]],
  { trackIds: string[] },
  SliceState
>("library/load-tracks", async ({ trackIds }, thunk) => {
  try {
    await ensureBridge();
    const currentState = thunk.getState();
    const [existingArtists, exisingTracks] = [
      currentState.library.data.artists,
      currentState.library.data.tracks,
    ];
    const tracksToFetch = trackIds.filter(
      (t) => exisingTracks[t] === undefined
    );

    if (tracksToFetch.length === 0) {
      return [[], []];
    }
    const tracks = await window.bridge.getTracks(tracksToFetch);

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
  SliceState
>("library/load-album-tracks", async ({ albumId }, thunk) => {
  try {
    await ensureBridge();

    if (ALBUM_TRACKS_LOADED[albumId]) {
      return [[], []];
    }

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
    ALBUM_TRACKS_LOADED[albumId] = true;
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

const importIntoLibrary = createAsyncThunk<
  Awaited<ReturnType<typeof window.bridge.importItems>> | null,
  { items: string[] },
  SliceState
>("library/import-items", async ({ items }, thunk) => {
  try {
    const result = await toast.promise(
      new Promise<Awaited<ReturnType<typeof window.bridge.importItems>>>(
        (res, rej) => {
          try {
            ensureBridge().then(async () => {
              const newData = await window.bridge.importItems(items);
              const existingPlaylists = thunk.getState().library.data.playlists;
              console.log(
                `Immported ${
                  Object.keys(newData.playlists).length
                } Playlists, ${Object.keys(newData.albums).length} Albums and ${
                  Object.keys(newData.artists).length
                } Artists`
              );

              const playlistUpdates = Object.values(existingPlaylists)
                .sort((a, b) => {
                  const posA = a.position;
                  const posB = b.position;
                  if (posA === -1 && posA === posB) {
                    return 0;
                  } else if (posA === -1) {
                    return 1;
                  } else if (posB === -1) {
                    return -1;
                  }
                  return posA - posB;
                })
                .filter((a, idx) => {
                  if (a.position === -1) {
                    a.position = idx;
                    const item = newData.playlists[a.id];
                    if (item) {
                      item.position = idx;
                    }
                    return true;
                  }
                  return false;
                })
                .map((a) => {
                  const update: IPlaylistUpdate = {
                    id: a.id,
                    position: a.position,
                  };

                  return update;
                });

              if (playlistUpdates.length > 0) {
                await window.bridge.updatePlaylists(playlistUpdates);
              }

              console.log("Imported data", newData);

              res(newData);
            });
          } catch (error) {
            rej(error);
          }
        }
      ),
      {
        loading: "Importing",
        success: (data) => {
          return `Imported ${
            Object.keys(data.playlists).length
          } Playlists, and ${Object.keys(data.albums).length} Albums`;
        },
        error: "Import Error",
      }
    );

    return result;
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return null;
  }
});

const updateTracks = createAsyncThunk(
  "library/update-track",
  async ({ update }: { update: ITrackUpdate[] }) => {
    try {
      await window.bridge.updateTracks(update);
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
        timestamp: Math.round(Date.now() / 1000), // accurate to seconds
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
      console.log(action.payload[0]);
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
    builder.addCase(updateTracks.fulfilled, (state, action) => {
      if (action.payload !== null) {
        action.payload.forEach((t) => {
          if (state.data.tracks[t.id]) {
            const newTrack = {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              ...state.data.tracks[t.id]!,
              ...action.payload,
            };
            console.log("Updating", state.data.tracks[t.id], "=>", newTrack);
            state.data.tracks[t.id] = newTrack;
          }
        });
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
  updateTracks,
  likeTrack,
  removeLikedTrack,
};
export default LibarySlice.reducer;
