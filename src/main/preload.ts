// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { BridgeEventReturn, IBridgeEvents, ILocalAlbum, ILocalPlaylist, ILocalPlaylistTrack, ILocalTrack, LocalPlaylistTracksContext, LocalTracksContext } from '../types';

const bridge: IBridgeEvents = {
    getPreloadPath: () => ipcRenderer.sendSync('getPreloadPath'),
    windowMinimize: function (): void {
        ipcRenderer.send('windowMinimize');
    },
    windowMaximize: () => {
        ipcRenderer.send('windowMaximize');
    },
    windowClose: () => {
        ipcRenderer.send('windowMinimize');
    },
    toStreamUrl: (uri: string) => {
        return new Promise<BridgeEventReturn<'toStreamUrl'>>((resolve) => {
            ipcRenderer.once('toStreamUrl', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('toStreamUrl', uri)
        })
    },
    searchForStream: (search: string) => {
        return new Promise<BridgeEventReturn<'searchForStream'>>((resolve) => {
            ipcRenderer.once('searchForStream', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('searchForStream', search)
        })
    },
    getLocalPlaylists: () => {
        console.log("Fetching playlists")
        return new Promise<BridgeEventReturn<'getLocalPlaylists'>>((resolve) => {
            ipcRenderer.once('getLocalPlaylists', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('getLocalPlaylists')
        })
    },
    getLocalAlbums: () => {
        return new Promise<BridgeEventReturn<'getLocalAlbums'>>((resolve) => {
            ipcRenderer.once('', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('getLocalAlbums')
        })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLocalTracks: (context: LocalTracksContext): Promise<any> => {
        return new Promise<BridgeEventReturn<'getLocalTracks'>>((resolve) => {
            ipcRenderer.once('getLocalTracks', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('getLocalTracks', context);
        })
    },
    createPlaylist(name, position) {
        return new Promise<BridgeEventReturn<'createPlaylist'>>((resolve) => {
            ipcRenderer.once('createPlaylist', (_, d) => {
                resolve(d);
            })
            ipcRenderer.send('createPlaylist', name, position);
        })
    },
}
contextBridge.exposeInMainWorld('bridge', bridge);


