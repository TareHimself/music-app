import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import AppConstants from "@root/data";
import {
  AppSliceState,
  IAlbum,
  IArtist,
  IArtistRaw,
  ILikedTrack,
  IPlaylist,
  IPlaylistUpdate,
  ITrack,
  ITrackUpdate,
  KeyValuePair,
  LibrarySliceState,
} from "@types";
import { arrayToIndex, ensureBridge } from "@render/utils";

const initialState: LibrarySliceState = {
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
  AppSliceState
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>("library/init", async (_, _thunk) => {
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

            const playlistUpdates = Object.values(playlistsIndex)
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
                if (a.position !== idx) {
                  const item = playlistsIndex[a.id];
                  if (item) {
                    item.position = idx;
                    return true;
                  }
                }
                return false;
              })
              .map((a) => {
                const update: IPlaylistUpdate = {
                  id: a.id,
                  position: playlistsIndex[a.id]?.position ?? -1,
                };

                return update;
              });

            if (playlistUpdates.length > 0) {
              await window.bridge.updatePlaylists(playlistUpdates);
            }

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
        pending: "Loading Library",
        success: {
          render(props) {
            if (!props.data) {
              return "Loading Error";
            }
            const data = props.data;

            return `Loaded ${Object.keys(data[0]).length} Playlists, and ${
              Object.keys(data[2]).length
            } Albums`;
          },
          type: "success",
          delay: 2000,
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
  AppSliceState
>("library/tracks/load", async ({ trackIds }, thunk) => {
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
  AppSliceState
>("library/albums/tracks/load", async ({ albumId }, thunk) => {
  try {
    await ensureBridge();

    const state = thunk.getState().library.data;
    const [existingArtists, existingTracks, albumData] = [
      state.artists,
      state.tracks,
      state.albums[albumId],
    ];

    if (!albumData) {
      return [[], []];
    }

    const tracksToLoad = albumData.tracks.filter(
      (t) => existingTracks[t] === undefined
    );

    const tracks =
      tracksToLoad.length > 0
        ? await window.bridge.getTracks(tracksToLoad)
        : [];

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
  "library/playlists/create",
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
  AppSliceState
>("library/import", async ({ items }, thunk) => {
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
                  if (a.position !== idx) {
                    const item = newData.playlists[a.id];
                    if (item) {
                      item.position = idx;
                      return true;
                    }
                  }
                  return false;
                })
                .map((a) => {
                  const update: IPlaylistUpdate = {
                    id: a.id,
                    position: newData.playlists[a.id]?.position || -1,
                  };

                  return update;
                });

              if (playlistUpdates.length > 0) {
                await window.bridge.updatePlaylists(playlistUpdates);
              }

              res(newData);
            });
          } catch (error) {
            rej(error);
          }
        }
      ),
      {
        pending: "Importing",
        success: {
          render(props) {
            if (!props.data) {
              return "Loading Error";
            }
            const data = props.data;

            return `Imported ${
              Object.keys(data.playlists).length
            } Playlists, and ${Object.keys(data.albums).length} Albums`;
          },
          type: "success",
          delay: 2000,
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
  "library/tracks/update",
  async ({ update }: { update: ITrackUpdate[] }) => {
    try {
      await window.bridge.updateTracks(update);
      return update;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return [];
    }
  }
);

const likeTrack = createAsyncThunk(
  "library/tracks/like/add",
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
  "library/tracks/like/remove",
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

const removeAlbums = createAsyncThunk(
  "library/albums/remove",
  async ({ items }: { items: string[] }) => {
    try {
      await window.bridge.removeAlbums(items);
      return items;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return [];
    }
  }
);

const removePlaylists = createAsyncThunk(
  "library/playlists/remove",
  async ({ items }: { items: string[] }) => {
    try {
      await window.bridge.removePlaylists(items);
      return items;
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error(e);
      return [];
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
    builder.addCase(updateTracks.fulfilled, (state, action) => {
      action.payload.forEach((t) => {
        if (state.data.tracks[t.id]) {
          const newTrack = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...state.data.tracks[t.id]!,
            ...t,
          };
          state.data.tracks[t.id] = newTrack;
        }
      });
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
    builder.addCase(removeAlbums.fulfilled, (state, action) => {
      action.payload.forEach((item) => {
        if (state.data.albums[item]) {
          delete state.data.albums[item];
        }
      });
    });
    builder.addCase(removePlaylists.fulfilled, (state, action) => {
      action.payload.forEach((item) => {
        if (state.data.playlists[item]) {
          delete state.data.playlists[item];
        }
      });
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
  removeAlbums,
  removePlaylists,
};
export default LibarySlice.reducer;
