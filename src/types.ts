/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";

export type Vector2 = { x: number; y: number };
export interface GenericSliceData<T> {
  status: "loading" | "loaded";
  data: T;
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

export interface IPlaylistRawMetaUpdate extends Partial<IPlaylistRaw> {
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

export interface IRendererToMainEvents {
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
  updateTrack: (update: ITrackUpdate) => Promise<void>;
  isDev: () => boolean;
  getLikedTracks: () => Promise<ILikedTrack[]>;
  addLikedTracks: (tracks: ILikedTrack[]) => Promise<void>;
  removeLikedTracks: (tracks: string[]) => Promise<void>;
  onFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ) => void;

  onceFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ) => void;

  offFromMain: <T extends keyof IMainToRendererEvents>(
    event: T,
    callback: (...args: MainToRendererEventParams<T>) => Awaitable<any>
  ) => void;
}

export interface IMainToRendererEvents {
  onImport: (ids: string) => void;
}

export type RendererToMainEventReturn<T extends keyof IRendererToMainEvents> =
  Awaited<ReturnType<IRendererToMainEvents[T]>>;

export type RendererToMainEventParams<T extends keyof IRendererToMainEvents> =
  Parameters<IRendererToMainEvents[T]>;

export type MainToRendererEventReturn<T extends keyof IMainToRendererEvents> =
  Awaited<ReturnType<IMainToRendererEvents[T]>>;

export type MainToRendererEventParams<T extends keyof IMainToRendererEvents> =
  Parameters<IMainToRendererEvents[T]>;

export type IAddTracksEventData = {
  tracks: string[];
};

export type IQueueTrackEventData = {
  tracks: string[];
  replaceQueue: boolean;
};
export type IPlayTrackEventData = {
  track: string;
};

export interface IGlobalUtils {
  playTrack: (data: IPlayTrackEventData) => Promise<void>;
  addTracksToNext: (data: IAddTracksEventData) => Promise<void>;
  addTracksToLater: (data: IAddTracksEventData) => Promise<void>;
  queueTracks: (data: IQueueTrackEventData) => Promise<void>;
}

declare global {
  interface Window {
    bridge: IRendererToMainEvents;
    utils: IGlobalUtils;
  }
}

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
  track_number: 1;
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

export {};
