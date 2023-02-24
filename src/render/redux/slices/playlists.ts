import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ensureBridge } from '../../utils';
import { GenericSliceData, ILocalPlaylist } from '../../../types';

export type PlaylistsSliceState = GenericSliceData<{
  lookup: { [key: string]: ILocalPlaylist };
  ids: string[];
}>

const initialState: PlaylistsSliceState = {
  status: 'empty',
  data: {
    lookup: {},
    ids: [],
  },
};

const loadPlaylists = createAsyncThunk('playlists/load', async () => {
  try {
    await ensureBridge();
    const items = await window.bridge.getLocalPlaylists();
    const index: { [key: string]: ILocalPlaylist } = {};

    const ids = items
      .sort((a, b) => {
        return b.position - a.position;
      })
      .map((a) => {
        index[a.id] = a;
        return a.id
      });

    console.log(`Loaded ${ids.length} Playlists`, items, index, ids)
    return { ids, lookup: index };
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return { ids: [], lookup: {} };
  }
});

const createPlaylist = createAsyncThunk('playlists/create', async ({ title, position }: { title: string, position: number }) => {
  try {
    await ensureBridge();

    return await window.bridge.createPlaylist(title, position);
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
    return null;
  }
});

export const playlistsSlice = createSlice({
  name: 'playlists',
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
    setStatus: (state, action: PayloadAction<(typeof state)['status']>) => {
      state.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadPlaylists.fulfilled, (state, action) => {
      state.data.ids = action.payload.ids;
      state.data.lookup = action.payload.lookup;
      state.status = 'loaded';
    });
    builder.addCase(createPlaylist.fulfilled, (state, action) => {
      if (action.payload) {
        state.data.lookup[action.payload.id] = action.payload
        state.data.ids.unshift(action.payload.id)
        state.data.ids.sort((a, b) => state.data.lookup[b].position - state.data.lookup[a].position)
      }
    });
  },
});

export const { editPlaylist, setStatus } = playlistsSlice.actions;
export { loadPlaylists, createPlaylist };

export default playlistsSlice.reducer;
