import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ensureBridge } from 'renderer/utils';
import { GenericSliceData, ILocalPlaylist } from 'types';

export interface PlaylistsSliceState
  extends GenericSliceData<{
    lookup: { [key: string]: ILocalPlaylist };
    ids: string[];
  }> {}

const initialState: PlaylistsSliceState = {
  status: 'empty',
  data: {
    lookup: {},
    ids: [],
  },
};

const loadPlaylists = createAsyncThunk('currentUser/load', async () => {
  try {
    await ensureBridge();
    const items = await window.electron.bridge.getLocalPlaylists();
    const index: { [key: string]: ILocalPlaylist } = {};

    const ids = items
      .sort((a, b) => {
        if (!index[a.id]) index[a.id] = a;
        if (!index[b.id]) index[b.id] = b;
        return a.position - b.position;
      })
      .map((a) => a.id);

    return { ids, lookup: index };
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return { ids: [], lookup: {} };
  }
});

export const playlistsSlice = createSlice({
  name: 'currentUser',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    editPlaylist: (
      state,
      action: PayloadAction<
        Partial<ILocalPlaylist> & { id: ILocalPlaylist['id'] }
      >
    ) => {
      state.data.lookup[action.payload.id] = {
        ...state.data.lookup[action.payload.id],
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadPlaylists.fulfilled, (state, action) => {
      state.data.ids = action.payload.ids;
      state.data.lookup = action.payload.lookup;
    });
  },
});

export const { editPlaylist } = playlistsSlice.actions;
export { loadPlaylists };

export default playlistsSlice.reducer;
