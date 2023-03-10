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
    return ipcRenderer.sendAsync("toStreamUrl", uri);
  },
  searchForStream: (search: string) => {
    return ipcRenderer.sendAsync("searchForStream", search);
  },
  getPlaylists: () => {
    return ipcRenderer.sendAsync("getPlaylists");
  },
  getAlbums: (albums) => {
    return ipcRenderer.sendAsync("getAlbums", albums);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTracks: (trackIds): Promise<ITrack[]> => {
    return ipcRenderer.sendAsync("getTracks", trackIds);
  },
  createPlaylists(data) {
    return ipcRenderer.sendAsync("createPlaylists", data);
  },
  getTrackStreamInfo: (track) => {
    return ipcRenderer.sendAsync("getTrackStreamInfo", track);
  },
  getAlbumTracks: (album) => {
    return ipcRenderer.sendAsync("getAlbumTracks", album);
  },
  updateDiscordPresence: (data) => {
    return ipcRenderer.sendAsync("updateDiscordPresence", data);
  },
  clearDiscordPresence: () => {
    return ipcRenderer.sendAsync("clearDiscordPresence");
  },
  getLibraryPath: () => {
    return ipcRenderer.sendAsync("getLibraryPath");
  },
  importItems: (uris) => {
    return ipcRenderer.sendAsync("importItems", uris);
  },
  getArtists: (ids) => {
    return ipcRenderer.sendAsync("getArtists", ids);
  },
  getPlatform: () => {
    return ipcRenderer.sendSync("getPlatform");
  },
  updateTrack: (update) => {
    return ipcRenderer.sendAsync("updateTrack", update);
  },
});
