/* eslint-disable import/no-named-as-default */
import { configureStore } from "@reduxjs/toolkit";
import AppSlice from "./slices/app";
import PlaylistsSlice from "./slices/playlists";
import TracksSlice from "./slices/tracks";
import AlbumsSlice from "./slices/albums";
export const store = configureStore({
  reducer: {
    playlists: PlaylistsSlice,
    app: AppSlice,
    tracks: TracksSlice,
    albums: AlbumsSlice
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
