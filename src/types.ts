/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        myPing(): void;
        windowMinimize(): void;
        windowMaximize(): void;
        windowClose(): void;
        on(
          channel: string,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

export interface INotificationInfo {
  id: number;
  content: string;
}

export interface ILocalPlaylist {
  id: string;
  title: string;
  cover: string;
}

export interface ILocalAlbum {
  id: string;
  title: string;
  cover: string;
  released: number;
  artist_id: string;
}

export interface ILocalPlaylistTrack {
  playlist_id: string;
  track_id: string;
  added: number;
}

export interface ILocalTrack {
  id: string;
  title: string;
  album_id: string;
  uri: string;
  artists_ids: string;
  duration: number;
  position: number;
}

export interface ILocalArtist {
  id: string;
  name: string;
  cover: string;
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
  artists: IArtist;
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

export {};
