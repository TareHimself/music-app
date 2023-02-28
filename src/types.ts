/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";

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
  added: number;
}

export interface IPlaylistTrack {
  track: IPlaylistTrackRaw["track"];
  added: IPlaylistTrackRaw["added"];
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

export type ControllableSliderProps = {
  min: number;
  max: number;
  value?: number;
  defaultValue?: number;
  onUserUpdate?: (update: number, isFinal: boolean) => Awaitable<void>;
  style?: React.CSSProperties;
  step?: number;
};

export type TrackStreamInfo = { uri: string; duration: number; from: string };

export type Awaitable<T> = T | Promise<T>;

export type IQueueTrackEventData = {
  tracks: ITrack[];
  replaceQueue: boolean;
};
export type IPlayTrackEventData = {
  track: ITrack;
};
export interface IBridgeEvents {
  getPreloadPath: () => string;
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  getTrackStreamInfo: (track: ITrack) => Promise<TrackStreamInfo>;
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
  importSpotifyTracks: (uris: string[]) => Promise<ITrack[]>;
  importSpotifyAlbums: (uris: string[]) => Promise<IAlbum[]>;
  importSpotifyPlaylists: (uris: string[]) => Promise<IPlaylist[]>;
}

export type BridgeEventReturn<T extends keyof IBridgeEvents> = Awaited<
  ReturnType<IBridgeEvents[T]>
>;

export type BridgeEventParams<T extends keyof IBridgeEvents> = Parameters<
  IBridgeEvents[T]
>;

export interface IGlobalUtils {
  playTrack: (data: IPlayTrackEventData) => Promise<void>;
  queueTracks: (data: IQueueTrackEventData) => Promise<void>;
}

declare global {
  interface Window {
    bridge: IBridgeEvents;
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

export type KeyValuePair<K extends string | number | symbol, D> = {
  [key in K]: D | undefined;
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

export {};
