import { app, BrowserWindow } from "electron";

import { IPlaylistRaw } from "../types";
import { v4 as uuidv4 } from "uuid";
import {
  getPlaylists,
  getAlbums,
  getAlbumTracks,
  getArtists,
  getTracks,
} from "./sqlite";
import { ipcMain } from "../ipc";
import DiscordRichPrecenceClient from "discord-rich-presence";
import { getLibraryPath } from "./utils";
import { platform } from "os";
import YoutubeSource from "./sources/youtube";
import { SourceManager } from "./sources/source";
import { SourceImporterManager } from "./importers/importer";
import SpotifyImporter from "./importers/spotify";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const mediaSources = new SourceManager();
const mediaImporters = new SourceImporterManager();
mediaImporters
  .useSource(new SpotifyImporter())
  .then(() => console.log("Spotify importer loaded"))
  .catch(console.log);
mediaSources
  .useSource(new YoutubeSource())
  .then(() => console.log("Youtube Souce Loaded"))
  .catch(console.log);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const PRESENCE_CLIENT = DiscordRichPrecenceClient("1079194728953815191");

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      webSecurity: false,
    },
    frame: platform() !== "win32",
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.commandLine.appendSwitch("js-flags", "--max-old-space-size=8192");
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function makeLocalId() {
  return `local:${uuidv4().toString().replaceAll("-", "")}`;
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("getPreloadPath", (e) => {
  e.replySync(MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);
});

ipcMain.on("getTrackStreamInfo", async (ev, track) => {
  ev.reply(await mediaSources.parse(track));
});

ipcMain.on("windowMaximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("windowMinimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("windowClose", () => {
  mainWindow?.close();
});

ipcMain.on("getAlbums", (e, ids) => {
  e.reply(getAlbums(ids || []));
});

ipcMain.on("getPlaylists", (ev) => {
  const playlists = getPlaylists();
  ev.reply(playlists);
});

ipcMain.on("createPlaylists", (ev, data) => {
  const newData: IPlaylistRaw[] = data.map((a) => ({
    ...a,
    id: a.id || makeLocalId(),
  }));

  //tCreatePlaylists.deferred(newData);

  ev.reply(newData.map((a) => ({ ...a, tracks: [] })));
});

ipcMain.on("getAlbumTracks", (e, album) => {
  e.reply(getAlbumTracks(album));
});

ipcMain.on("updateDiscordPresence", (ev) => {
  // const album = getAlbums([track.album])[0];
  // const artist = getArtists(album.artists)[0];

  // PRESENCE_CLIENT.updatePresence({
  //   state: `by ${artist.name}`,
  //   details: track.title,
  //   startTimestamp: Date.now(),
  //   largeImageKey: album.cover,
  //   instance: false,
  // });
  ev.reply();
});

ipcMain.on("clearDiscordPresence", (ev) => {
  PRESENCE_CLIENT.updatePresence({});
  ev.reply();
});

ipcMain.on("getLibraryPath", (ev) => {
  ev.reply(getLibraryPath());
});

ipcMain.on("getTracks", (ev, ids) => {
  ev.reply(getTracks(ids || []));
});

ipcMain.on("getArtists", async (ev, ids) => {
  ev.reply(getArtists(ids || []));
});

ipcMain.on("getPlatform", (ev) => {
  ev.replySync(platform());
});

ipcMain.on("importItems", async (ev, uri) => {
  ev.reply(await mediaImporters.parse(uri));
});
