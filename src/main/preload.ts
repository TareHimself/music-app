// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer } from "../ipc";
import {
  IBridgeEvents,
  IAlbumNew,
  ITrackNew,
  ITrack,
  IArtistNew,
  IAlbum,
  IPlaylist,
  IArtistRaw,
} from "../types";

ipcRenderer.exposeApi<IBridgeEvents>("bridge", {
  getPreloadPath: () => ipcRenderer.sendSync("getPreloadPath"),
  windowMinimize: () => {
    ipcRenderer.send("windowMinimize");
  },
  windowMaximize: () => {
    ipcRenderer.send("windowMaximize");
  },
  windowClose: () => {
    ipcRenderer.send("windowMinimize");
  },
  toStreamUrl: (uri: string) => {
    return ipcRenderer.asyncEventCall("toStreamUrl", uri);
  },
  searchForStream: (search: string) => {
    return ipcRenderer.asyncEventCall("searchForStream", search);
  },
  getPlaylists: () => {
    return ipcRenderer.asyncEventCall("getPlaylists");
  },
  getAlbums: () => {
    return ipcRenderer.asyncEventCall("getAlbums");
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTracks: (trackIds): Promise<ITrack[]> => {
    return ipcRenderer.asyncEventCall("getTracks", trackIds);
  },
  createPlaylists(data) {
    return ipcRenderer.asyncEventCall("createPlaylists", data);
  },
  getTrackStreamInfo: (track) => {
    return ipcRenderer.asyncEventCall("getTrackStreamInfo", track);
  },
  getAlbumTracks: (album: string) => {
    return ipcRenderer.asyncEventCall("getAlbumTracks", album);
  },
  createAlbums: (data: IAlbumNew[]) => {
    return ipcRenderer.asyncEventCall("createAlbums", data);
  },
  createTracks: (data: ITrackNew[]) => {
    return ipcRenderer.asyncEventCall("createTracks", data);
  },
  createArtists: (data: IArtistNew[]) => {
    return ipcRenderer.asyncEventCall("createArtists", data);
  },
  updateDiscordPresence: (data: ITrack) => {
    return ipcRenderer.asyncEventCall("updateDiscordPresence", data);
  },
  clearDiscordPresence: () => {
    return ipcRenderer.asyncEventCall("clearDiscordPresence");
  },
  getLibraryPath: () => {
    return ipcRenderer.asyncEventCall("getLibraryPath");
  },
  importSpotifyTracks: (uris: string[]) => {
    return ipcRenderer.asyncEventCall("importSpotifyTracks", uris);
  },
  importSpotifyAlbums: (uris: string[]) => {
    return ipcRenderer.asyncEventCall("importSpotifyAlbums", uris);
  },
  importSpotifyPlaylists: (uris: string[]) => {
    return ipcRenderer.asyncEventCall("importSpotifyPlaylists", uris);
  },
  getArtists: (ids: string[] = []) => {
    return ipcRenderer.asyncEventCall("getArtists", ids);
  },
});
