/* eslint-disable import/no-named-as-default */
import { configureStore } from "@reduxjs/toolkit";
import LibarySlice from "./slices/library";
import PlayerSlice from "./slices/player";
import NavigationSlice from "./slices/navigation";
import VirtualLibarySlice from "./slices/virtualLibrary";
export const store = configureStore({
  reducer: {
    library: LibarySlice,
    player: PlayerSlice,
    navigation: NavigationSlice,
    virtualLibrary: VirtualLibarySlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
