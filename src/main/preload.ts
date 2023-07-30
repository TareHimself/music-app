// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer } from "../ipc-impl";

const exposedApi = ipcRenderer.exposeApi("bridge", {
  getPreloadPath: () => ipcRenderer.sendSync("getPreloadPath"),
  windowMinimize: () => {
    ipcRenderer.sendAsync("windowMinimize");
  },
  windowMaximize: () => {
    ipcRenderer.sendAsync("windowMaximize");
  },
  windowClose: () => {
    ipcRenderer.sendAsync("windowClose");
  },
  getPlaylists: () => {
    return ipcRenderer.sendAsync("getPlaylists");
  },
  getAlbums: (albums) => {
    return ipcRenderer.sendAsync("getAlbums", albums);
  },
  getTracks: (trackIds) => {
    return ipcRenderer.sendAsync("getTracks", trackIds);
  },
  createPlaylists(data) {
    return ipcRenderer.sendAsync("createPlaylists", data);
  },
  getTrackStreamInfo: (...args) =>
    ipcRenderer.sendAsync("getTrackStreamInfo", ...args),
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
  isDev: () => {
    return ipcRenderer.sendSync("isDev");
  },
  getLikedTracks: () => {
    return ipcRenderer.sendAsync("getLikedTracks");
  },
  addLikedTracks: (tracks) => {
    return ipcRenderer.sendAsync("addLikedTracks", tracks);
  },
  removeLikedTracks: (tracks) => {
    return ipcRenderer.sendAsync("removeLikedTracks", tracks);
  },
  updatePlaylists: (items) => {
    return ipcRenderer.sendAsync("updatePlaylists", items);
  },
  updateTracks: (items) => {
    return ipcRenderer.sendAsync("updateTracks", items);
  },
  removePlaylists: (items) => {
    return ipcRenderer.sendAsync("removePlaylists", items);
  },
  removeAlbums: (items) => {
    return ipcRenderer.sendAsync("removeAlbums", items);
  },
  downloadTrack: (...args) => {
    return ipcRenderer.sendAsync("downloadTrack", ...args);
  },
  getServerAddress: (...args) =>
    ipcRenderer.sendSync("getServerAddress", ...args),
  getRandomPlaylistCovers: (...args) =>
    ipcRenderer.sendAsync("getRandomPlaylistCovers", ...args),
});

declare global {
  interface Window {
    bridge: typeof exposedApi;
  }
}
