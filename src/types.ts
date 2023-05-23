/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
export type Vector2 = { x: number; y: number };

export const enum ESearchFilter {
  TRACKS = "tracks",
  ALBUMS = "albums",
  PLAYLISTS = "playlists",
}
export interface INotificationInfo {
  id: number;
  content: string;
}

/**
 * Playlists
 */

export interface IPlaylistNew {
  id?: string;
  title: string;
  cover: string;
  position: number;
}

export interface IPlaylistRaw extends IPlaylistNew {
  id: string;
}

export interface IPlaylistTrackRaw {
  playlist: string;
  track: string;
  timestamp: number;
}

export interface IPlaylistTrack {
  track: IPlaylistTrackRaw["track"];
  timestamp: IPlaylistTrackRaw["timestamp"];
}

export interface IPlaylistUpdate extends Partial<IPlaylistRaw> {
  id: IPlaylistRaw["id"];
}

export interface IPlaylist extends IPlaylistRaw {
  tracks: IPlaylistTrack[];
}

/**
 * Albums
 */

export interface IAlbumNew<T = IArtistNew[]> {
  id?: string;
  title: string;
  cover: string;
  released: number;
  artists: T;
  genre: string;
}

export interface IAlbumRaw<T = string[]> extends IAlbumNew<T> {
  id: string;
}

export interface IAlbum extends IAlbumRaw<string[]> {
  id: string;
  tracks: string[];
}

/**
 * Artists
 */

export interface IArtistNew {
  id?: string;
  name: string;
}

export interface IArtistRaw extends IArtistNew {
  id: string;
}

export type IArtist = IArtistRaw;

/**
 * Tracks
 */

export interface ITrackNew {
  id?: string;
  title: string;
  album: string;
  uri: string;
  artists: string[];
  duration: number;
  position: number;
}

export interface ITrackRaw extends ITrackNew {
  id: string;
}

export interface ITrack extends ITrackNew {
  id: ITrackRaw["id"];
}

export interface ITrackUpdate extends Partial<ITrack> {
  id: ITrackRaw["id"];
}

export type ControllableSliderProps = {
  min: number;
  max: number;
  value?: number;
  defaultValue?: number;
  onUserUpdate?: (update: number, isFinal: boolean) => Awaitable<void>;
  style?: React.CSSProperties;
  step?: number;
};

export interface ILikedTrack {
  track: string;
  timestamp: number;
}

export type TrackStreamInfo = { uri: string; duration: number; from: string };

export interface ITrackResource {
  id: string;
  title: string;
  album: string;
  uri: string;
  artists: string[];
}

export type Awaitable<T> = T | Promise<T>;

export interface IContextMenuOption {
  id: string;
  name: string;
}

export type ICreateContextMenuEventData = {
  event: React.MouseEvent;
  options: IContextMenuOption[];
  callback: (selectedOption: string) => Awaitable<void>;
};

export type IRendererToMainEvents = {
  getPreloadPath: () => string;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  getTrackStreamInfo: (
    track: ITrackResource
  ) => Promise<TrackStreamInfo | null>;
  toStreamUrl: (uri: string) => Promise<string>;
  searchForStream: (search: string) => Promise<string>;
  getPlaylists: () => Promise<IPlaylist[]>;
  getAlbums: (albums?: string[]) => Promise<IAlbum[]>;
  getAlbumTracks: (album: string) => Promise<ITrack[]>;
  getTracks: (trackIds?: string[]) => Promise<ITrack[]>;
  getArtists: (ids: string[]) => Promise<IArtist[]>;
  createPlaylists: (data: IPlaylistNew[]) => Promise<IPlaylist[]>;
  updateDiscordPresence: (data: ITrack) => Promise<void>;
  clearDiscordPresence: () => Promise<void>;
  getLibraryPath: () => Promise<string>;
  importItems: (uris: string[]) => Promise<{
    albums: KeyValuePair<string, IAlbum>;
    artists: KeyValuePair<string, IArtist>;
    playlists: KeyValuePair<string, IPlaylist>;
  }>;
  getPlatform: () => NodeJS.Platform;
  isDev: () => boolean;
  getLikedTracks: () => Promise<ILikedTrack[]>;
  addLikedTracks: (tracks: ILikedTrack[]) => Promise<void>;
  removeLikedTracks: (tracks: string[]) => Promise<void>;
  onFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: EventParams<IMainToRendererEvents, T>) => Awaitable<any>
  ) => void;

  onceFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: EventParams<IMainToRendererEvents, T>) => Awaitable<any>
  ) => void;

  offFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: EventParams<IMainToRendererEvents, T>) => Awaitable<any>
  ) => void;
  updatePlaylists: (items: IPlaylistUpdate[]) => Promise<void>;
  updateTracks: (items: ITrackUpdate[]) => Promise<void>;
  removePlaylists: (items: string[]) => Promise<void>;
  removeAlbums: (items: string[]) => Promise<void>;
  downloadTrack: (
    trackId: string,
    streamInfo: TrackStreamInfo
  ) => Promise<boolean>;
};

export type IMainToRendererEvents = {
  onImport: (ids: string) => void;
};

export type IEventBase = {
  [key: string]: (...args: any[]) => Awaitable<any>;
};

export type EventReturnType<E extends IEventBase, T extends keyof E> = Awaited<
  ReturnType<E[T]>
>;

export type EventParams<E extends IEventBase, T extends keyof E> = Parameters<
  E[T]
>;

export type IQueueTracksEventData = {
  tracks: string[];
};

export interface IQueueTracksEventDataWithReplace
  extends IQueueTracksEventData {
  startIndex: number;
}

export interface IGlobalUtils {
  playNext: (data: IQueueTracksEventData) => void;
  playLater: (data: IQueueTracksEventData) => void;
  queueTracks: (data: IQueueTracksEventDataWithReplace) => void;
  skipToQueueIndex: (data: number) => void;
  skipCurrentTrack: () => void;
}

export type SearchReturnType<T extends ESearchFilter> =
  T extends ESearchFilter.ALBUMS
    ? IAlbum[]
    : T extends ESearchFilter.TRACKS
    ? ITrack[]
    : IPlaylist[];

export interface ISpotifyArtist {
  id: string;
  name: string;
  type: string;
}

export interface ISpotifyAlbumCovers {
  url: string;
}

export interface ISpotifyTrack {
  id: string;
  name: string;
  artists: ISpotifyArtist[];
  disc_number: number;
  track_number: number;
}

export interface ISpotifyAlbumNoTracks {
  id: string;
  artists: ISpotifyArtist[];
  images: ISpotifyAlbumCovers[];
  name: string;
  release_date: string;
  release_date_precision: string;
}

export interface ISpotifyAlbum extends ISpotifyAlbumNoTracks {
  tracks: {
    items: ISpotifyTrack[];
  };
  genres: string[];
}

export interface ISpotifyAlbumsResponse {
  albums: ISpotifyAlbum[];
}

export interface ISpotifyTracksResponse {
  tracks: (ISpotifyTrack & { album: ISpotifyAlbum })[];
}

export interface ISpotifyPlaylistResponse {
  id: string;
  name: string;
  tracks: {
    items: {
      added_at: string;
      track: ISpotifyTrack & { album: ISpotifyAlbum };
    }[];
    next: string | null;
    previous: string | null;
  };
}

export interface ISearchSection<T> {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: T[];
}

export interface IResourceImport {
  albums: KeyValuePair<string, IAlbum>;
  artists: KeyValuePair<string, IArtist>;
  playlists: KeyValuePair<string, IPlaylist>;
}

export interface ISpotifySearchResponse {
  tracks: ISearchSection<ISpotifyTrack & { album: ISpotifyAlbum }>;
  albums: ISearchSection<ISpotifyAlbumNoTracks>;
}

export type KeyValuePair<K extends string | number | symbol, D> = {
  [key in K]: D;
};

export const enum ERepeatState {
  OFF = "Off",
  REPEAT = "Repeat",
  REPEAT_ONE = "Repeat One",
}

export const enum EShuffleState {
  OFF = "Off",
  ON = "On",
}

export interface IActiveContextMenu {
  position: Vector2;
  options: IContextMenuOption[];
  callback: ICreateContextMenuEventData["callback"];
}

export interface GenericSliceData<T> {
  status: "loading" | "loaded";
  data: T;
}

export type LibrarySliceState = GenericSliceData<{
  screenId: string;
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  playlists: KeyValuePair<string, IPlaylist>;
  artists: KeyValuePair<string, IArtist>;
  likedTracks: ILikedTrack[];
  likedTracksLookup: KeyValuePair<string, boolean>;
  googleDriveApiKey: string;
}>;

export interface INavigationHistory {
  path: string;
  data: { [key: string]: any };
}
export type NavigationSliceState = GenericSliceData<{
  backwardHistory: INavigationHistory[];
  forwardHistory: INavigationHistory[];
  pathData: INavigationHistory["data"];
  contextMenu: IActiveContextMenu | null;
}>;

export type PlayerSliceState = GenericSliceData<{
  currentTrack: string | null;
  queuedTracks: string[];
  recentTracks: string[];
  tempQueue: {
    index: number;
    tracks: string[];
  };
  mainQueue: {
    index: number;
    tracks: string[];
  };
  volume: number;
  repeatState: ERepeatState;
  shuffleState: EShuffleState;
  isPaused: boolean;
}>;

export type AppSliceState = {
  state: {
    library: LibrarySliceState;
    player: PlayerSliceState;
    navigation: NavigationSliceState;
  };
};

interface IGlobalKeys {
  SPOTIFY_API_KEY: string;
}
declare global {
  interface Window {
    bridge: IRendererToMainEvents;
    utils: IGlobalUtils;
  }

  interface Array<T> {
    batch: (size: number) => T[][];
    lastIndex: () => number;
  }

  let keys: IGlobalKeys;
}

export {};
