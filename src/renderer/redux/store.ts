/* eslint-disable import/no-named-as-default */
import { configureStore } from '@reduxjs/toolkit';
import wallpapersSlice from './wallpapersSlice';
import currentUserSlice from './currentUserSlice';
import appStateSlice from './appStateSlice';

export const store = configureStore({
  reducer: {
    currentUser: currentUserSlice,
    wallpapers: wallpapersSlice,
    app: appStateSlice,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
