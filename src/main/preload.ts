// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer } from "../ipc";
import { IBridgeEvents, ITrack } from "../types";

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
  getAlbums: (albums: string[]) => {
    return ipcRenderer.asyncEventCall("getAlbums", albums);
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
  getAlbumTracks: (album) => {
    return ipcRenderer.asyncEventCall("getAlbumTracks", album);
  },
  updateDiscordPresence: (data) => {
    return ipcRenderer.asyncEventCall("updateDiscordPresence", data);
  },
  clearDiscordPresence: () => {
    return ipcRenderer.asyncEventCall("clearDiscordPresence");
  },
  getLibraryPath: () => {
    return ipcRenderer.asyncEventCall("getLibraryPath");
  },
  importSpotifyTracks: (uris) => {
    return ipcRenderer.asyncEventCall("importSpotifyTracks", uris);
  },
  importSpotifyAlbums: (uris) => {
    return ipcRenderer.asyncEventCall("importSpotifyAlbums", uris);
  },
  importSpotifyPlaylists: (uris) => {
    return ipcRenderer.asyncEventCall("importSpotifyPlaylists", uris);
  },
  getArtists: (ids) => {
    return ipcRenderer.asyncEventCall("getArtists", ids);
  },
});
