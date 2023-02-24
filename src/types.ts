/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
    onUserUpdate?: (update: number, isFinal: boolean) => Awaitable<void>;
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

export type Awaitable<T> = T | Promise<T>

export interface IBridgeEvents {
    getPreloadPath: () => string
    windowMinimize: () => void;
    windowMaximize: () => void;
    windowClose: () => void;
    toStreamUrl: (uri: string) => Promise<string>;
    searchForStream: (search: string) => Promise<string>;
    getLocalPlaylists: () => Promise<ILocalPlaylist[]>;
    getLocalAlbums: () => Promise<ILocalAlbum[]>;
    getLocalTracks: <T extends LocalTracksContext>(
        context: LocalTracksContext
    ) => Promise<
        T extends LocalPlaylistTracksContext ? ILocalPlaylistTrack[] : ILocalTrack[]
    >;
    createPlaylist: (title: string, position: number) => Promise<ILocalPlaylist>

}

export type BridgeEventReturn<T extends keyof IBridgeEvents> = Awaited<ReturnType<IBridgeEvents[T]>>

export type BridgeEventParams<T extends keyof IBridgeEvents> = Parameters<IBridgeEvents[T]>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TsParameters<T extends (...args: any) => any> = Parameters<T>;

declare global {
    interface Window {
        bridge: IBridgeEvents
    }

    namespace Electron {

        interface IpcRenderer {

            send<T extends keyof IBridgeEvents>(event: T, ...args: BridgeEventParams<T>): void;
            once<T extends keyof IBridgeEvents>(channel: T, callback: (event: import('electron').IpcRendererEvent, data: BridgeEventReturn<T>) => Awaitable<void>): void;
        }

        interface IpcMain {
            once<T extends keyof IBridgeEvents>(channel: T, callback: (event: import('electron').IpcMainEvent, ...args: BridgeEventParams<T>) => Awaitable<void>): void;
            on<T extends keyof IBridgeEvents>(channel: T, callback: (event: import('electron').IpcMainEvent, ...args: BridgeEventParams<T>) => Awaitable<void>): void;

        }
    }
}


export { }