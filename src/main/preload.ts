// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer } from "../ipc";
import { IRendererToMainEvents, ITrack } from "@types";

ipcRenderer.exposeApi<IRendererToMainEvents>("bridge", {
  getPreloadPath: () => ipcRenderer.sendToMainSync("getPreloadPath"),
  windowMinimize: () => {
    ipcRenderer.sendToMainAsync("windowMinimize");
  },
  windowMaximize: () => {
    ipcRenderer.sendToMainAsync("windowMaximize");
  },
  windowClose: () => {
    ipcRenderer.sendToMainAsync("windowClose");
  },
  toStreamUrl: (uri: string) => {
    return ipcRenderer.sendToMainAsync("toStreamUrl", uri);
  },
  searchForStream: (search: string) => {
    return ipcRenderer.sendToMainAsync("searchForStream", search);
  },
  getPlaylists: () => {
    return ipcRenderer.sendToMainAsync("getPlaylists");
  },
  getAlbums: (albums) => {
    return ipcRenderer.sendToMainAsync("getAlbums", albums);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTracks: (trackIds): Promise<ITrack[]> => {
    return ipcRenderer.sendToMainAsync("getTracks", trackIds);
  },
  createPlaylists(data) {
    return ipcRenderer.sendToMainAsync("createPlaylists", data);
  },
  getTrackStreamInfo: (track) => {
    return ipcRenderer.sendToMainAsync("getTrackStreamInfo", track);
  },
  getAlbumTracks: (album) => {
    return ipcRenderer.sendToMainAsync("getAlbumTracks", album);
  },
  updateDiscordPresence: (data) => {
    return ipcRenderer.sendToMainAsync("updateDiscordPresence", data);
  },
  clearDiscordPresence: () => {
    return ipcRenderer.sendToMainAsync("clearDiscordPresence");
  },
  getLibraryPath: () => {
    return ipcRenderer.sendToMainAsync("getLibraryPath");
  },
  importItems: (uris) => {
    return ipcRenderer.sendToMainAsync("importItems", uris);
  },
  getArtists: (ids) => {
    return ipcRenderer.sendToMainAsync("getArtists", ids);
  },
  getPlatform: () => {
    return ipcRenderer.sendToMainSync("getPlatform");
  },
  isDev: () => {
    return ipcRenderer.sendToMainSync("isDev");
  },
  getLikedTracks: () => {
    return ipcRenderer.sendToMainAsync("getLikedTracks");
  },
  addLikedTracks: (tracks) => {
    return ipcRenderer.sendToMainAsync("addLikedTracks", tracks);
  },
  removeLikedTracks: (tracks) => {
    return ipcRenderer.sendToMainAsync("removeLikedTracks", tracks);
  },
  onFromMain: (event, callback) => {
    ipcRenderer.onFromMain(event, callback);
  },
  onceFromMain: (event, callback) => {
    ipcRenderer.onceFromMain(event, callback);
  },
  offFromMain: (event, callback) => {
    ipcRenderer.offFromMain(event, callback);
  },
  updatePlaylists: (items) => {
    return ipcRenderer.sendToMainAsync("updatePlaylists", items);
  },
  updateTracks: (items) => {
    return ipcRenderer.sendToMainAsync("updateTracks", items);
  },
  removePlaylists: (items) => {
    return ipcRenderer.sendToMainAsync("removePlaylists", items);
  },
  removeAlbums: (items) => {
    return ipcRenderer.sendToMainAsync("removeAlbums", items);
  },
  downloadTrack: (...args) => {
    return ipcRenderer.sendToMainAsync("downloadTrack", ...args);
  },
});
