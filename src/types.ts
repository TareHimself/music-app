import React from 'react';

export interface GenericSliceData<T> {
  status: 'empty' | 'loading' | 'loaded';
  data: T;
}

export interface INotificationInfo {
  id: number;
  content: string;
}

export interface ILocalPlaylist {
  id: string;
  title: string;
  cover: string;
  position: number;
}

export interface ILocalPlaylistMetaUpdate extends Partial<ILocalPlaylist> {
  id: ILocalPlaylist['id'];
}

export interface ILocalAlbum {
  id: string;
  title: string;
  cover: string;
  released: number;
  artist: string;
  genre: string;
}

export interface ILocalPlaylistTrack {
  playlist: string;
  track: string;
  added: number;
}

export interface ILocalTrack {
  id: string;
  title: string;
  album: string;
  uri: string;
  artists: string;
  duration: number;
  position: number;
}

export interface ILocalArtist {
  id: string;
  name: string;
}

export interface IArtist {
  id: string;
  name: string;
  cover: string;
}

export interface ITrack {
  id: string;
  title: string;
  album: string;
  uri: string;
  artists: IArtist[];
  duration: number;
  position: number;
}

export interface IPlaylistTrack {
  track: ITrack;
  added: number;
}

export interface IPlaylist extends ILocalPlaylist {
  tracks: IPlaylistTrack[];
}

export interface IAlbum {
  id: string;
  title: string;
  cover: string;
  released: number;
  artists: IArtist[];
  tracks: ILocalTrack[];
}

export type ControllableSliderProps = {
  min: number;
  max: number;
  value?: number;
  defaultValue?: number;
  onUserUpdate?: (update: number, isFinal: boolean) => any;
  style?: React.CSSProperties;
  step?: number;
};

export interface SpotifyImportBundle {
  tracks: ITrack[];
  Albums: IAlbum[];
  playlists: IPlaylist[];
}

export type LocalPlaylistTracksContext = { playlistId: string };

export type LocalAlbumsTracksContext = { albumId: string };

export type LocalTracksContext =
  | LocalPlaylistTracksContext
  | LocalAlbumsTracksContext;

export interface MusicAppIpcEvents {
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose(): () => void;
  toStreamUrl: (uri: string) => Promise<string>;
  searchForStream: (search: string) => Promise<string>;
  getLocalPlaylists: () => Promise<ILocalPlaylist[]>;
  getLocalAlbums: () => Promise<ILocalAlbum[]>;
  getLocalTracks: <T extends LocalTracksContext>(
    context: LocalTracksContext
  ) => Promise<
    T extends LocalPlaylistTracksContext ? ILocalPlaylistTrack[] : ILocalTrack[]
  >;
}

/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    electron: {
      bridge: MusicAppIpcEvents & {
        on<T extends keyof MusicAppIpcEvents>(
          channel: T,
          func: (...args: any) => void
        ): (() => void) | undefined;
        once<T extends keyof MusicAppIpcEvents>(
          channel: T,
          func: (...args: any) => void
        ): void;
      };
    };
  }

  namespace Electron {
    interface IpcMain {
      /**
       * Listens to `channel`, when a new message arrives `listener` would be called with
       * `listener(event, args...)`.
       */
      on<T extends keyof MusicAppIpcEvents>(
        channel: T,
        listener: (event: import('electron').IpcMainEvent, ...args: any) => void
      ): this;
      /**
       * Adds a one time `listener` function for the event. This `listener` is invoked
       * only the next time a message is sent to `channel`, after which it is removed.
       */
      once<T extends keyof MusicAppIpcEvents>(
        channel: T,
        listener: (event: import('electron').IpcMainEvent, ...args: any) => void
      ): this;
    }

    interface WebContents {
      send<T extends keyof MusicAppIpcEvents>(channel: T, ...args: any): void;
    }

    interface IpcRenderer {
      /**
       * Listens to `channel`, when a new message arrives `listener` would be called with
       * `listener(event, args...)`.
       */
      on<T extends keyof MusicAppIpcEvents>(
        channel: T,
        listener: (
          event: import('electron').IpcRendererEvent,
          ...args: any
        ) => void
      ): this;
      /**
       * Adds a one time `listener` function for the event. This `listener` is invoked
       * only the next time a message is sent to `channel`, after which it is removed.
       */
      once<T extends keyof MusicAppIpcEvents>(
        channel: T,
        listener: (
          event: import('electron').IpcRendererEvent,
          ...args: any
        ) => void
      ): this;

      send<T extends keyof MusicAppIpcEvents>(event: T, ...args: any): void;

      /**
       * Removes the specified `listener` from the listener array for the specified
       * `channel`.
       */
      removeListener<T extends keyof MusicAppIpcEvents>(
        channel: T,
        listener: (
          event: import('electron').IpcRendererEvent,
          ...args: any
        ) => void
      ): this;
    }
  }
}

export {};
