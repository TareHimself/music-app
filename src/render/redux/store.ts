/* eslint-disable import/no-named-as-default */
import { configureStore } from '@reduxjs/toolkit';
import AppSlice from './slices/app';
import PlaylistsSlice from './slices/playlists'
export const store = configureStore({
  reducer: {
    playlists: PlaylistsSlice,
    app: AppSlice
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
