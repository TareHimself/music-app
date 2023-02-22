import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosResponse } from 'axios';
import { addNotification, getDatabaseUrl } from 'renderer/utils';
import {
  IConvertedSystemFiles,
  IWallpaperData,
  IWallpapersState,
} from 'renderer/types';

// Define a type for the slice state

// Define the initial state using that type
const initialState: IWallpapersState = {
  data: [],
  dataPendingUpload: null,
  hasNextPage: false,
  hasPreviousPage: false,
  currentWallpaper: null,
  currentPage: 0,
  query: '',
  maxItems: 12,
};

async function getWallpapers(page: number, maxItems: number, query: string) {
  const result: {
    data: IWallpaperData[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } = {
    data: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };

  if (maxItems > 0) {
    const response = (await axios
      .get(
        `${await getDatabaseUrl()}/wallpapers?o=${page * maxItems}&l=${
          maxItems + 1
        }&q=${query}`
      )
      .catch(() => {
        addNotification('Failed to fetch wallpapers');
      })) as AxiosResponse<IWallpaperData[]> | null | undefined;

    if (response && response.data) {
      const wallpapersFromApi = response.data;

      if (wallpapersFromApi.length - maxItems > 0) {
        wallpapersFromApi.pop();
        result.hasNextPage = true;
      } else {
        result.hasNextPage = false;
      }

      result.hasPreviousPage = page > 0;

      result.data = wallpapersFromApi.map((wallpaper) => {
        wallpaper.tags = wallpaper.tags.replaceAll(`''`, `'`);
        return wallpaper;
      });
    }
  }
  return result;
}

// First, create the thunk
const fetchWallpapers = createAsyncThunk(
  'wallpapers/fetch',
  async ({
    page: inPage,
    maxItems,
    query,
  }: {
    page: number;
    maxItems: number;
    query: string;
  }) => {
    const fetchResult = await getWallpapers(inPage, maxItems, query);
    return { ...fetchResult, currentPage: inPage, query, maxItems };
  }
);

const refreshWallpapers = createAsyncThunk(
  'wallpapers/refreshWallpapers',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ bShouldReset }: { bShouldReset: boolean }, { getState }) => {
    const { wallpapers } = (await getState()) as {
      wallpapers: IWallpapersState;
    };

    if (bShouldReset) {
      const fetchResult = await getWallpapers(0, wallpapers.maxItems, '');

      return { ...fetchResult };
    }

    const fetchResult = await getWallpapers(
      wallpapers.currentPage,
      wallpapers.maxItems,
      wallpapers.query
    );

    return { ...fetchResult };
  }
);

export const wallpapersSlice = createSlice({
  name: 'wallpapers',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setCurrentWallpaper: (state, action: PayloadAction<string | null>) => {
      if (action.payload === null) {
        state.currentWallpaper = action.payload;
        return;
      }
      state.currentWallpaper =
        state.data.find((a) => a.id === action.payload) ||
        state.data[0] ||
        null;
    },
    setMaxItems: (state, action: PayloadAction<number>) => {
      state.maxItems = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setWallpapersPendingUpload: (
      state,
      action: PayloadAction<IConvertedSystemFiles[] | null>
    ) => {
      state.dataPendingUpload = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWallpapers.fulfilled, (state, action) => {
      Object.assign(state, { ...state, ...action.payload });
    });
    builder.addCase(refreshWallpapers.fulfilled, (state, action) => {
      Object.assign(state, { ...state, ...action.payload });
    });
  },
});

export const {
  setCurrentWallpaper,
  setWallpapersPendingUpload,
  setMaxItems,
  setPage,
} = wallpapersSlice.actions;
export { fetchWallpapers, refreshWallpapers };

export default wallpapersSlice.reducer;
