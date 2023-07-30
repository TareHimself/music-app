import { app, BrowserWindow } from "electron";
import { IPlaylist } from "@types";
import { v4 as uuidv4 } from "uuid";
import {
  getPlaylists,
  getAlbums,
  getAlbumTracks,
  getArtists,
  getTracks,
  tUpdateTracks,
  getLikedTracks,
  tAddLikedTracks,
  tRemoveLikedTracks,
  tCreatePlaylists,
  tUpdatePlaylists,
  tRemovePlaylists,
  tRemoveAlbums,
  getRandomPlaylistCovers,
} from "./sqlite";
import { ipcMain } from "../ipc-impl";
import DiscordRichPrecenceClient from "discord-rich-presence";
import { getLocalLibraryFilesPath, isDev } from "./utils";
import { platform } from "os";
import path from "path";
import YoutubeSource from "./sources/youtube";
import SpotifySource from "./sources/spotify";
import { SourceManager } from "./sources/source";
import LocalSource from "./sources/local";
// import multer from "multer";
import express from "express";
import { AddressInfo } from "net";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
console.log("DEFAULT APP");
const mediaSources = new SourceManager();

mediaSources.useSource(new LocalSource());
mediaSources.useSource(new SpotifySource());
mediaSources.useSource(new YoutubeSource());

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const expressApp = express();

// const upload = multer();

expressApp.get(/file\/(.*)/, async (req, res) => {
  try {
    res.sendFile(req.params["0"] as string);
  } catch (error) {
    res.sendStatus(404);
  }
});

// expressApp.put(/bg\/(.*)/, upload.single("file"), async (req, res) => {
//   const file = req.file;
//   if (!file) {
//     res.sendStatus(400);
//     return;
//   }

//   try {
//     await writeFile(
//       path.join(cachedBackgroundsPath, `${req.params["0"]}.png`),
//       file.buffer
//     );

//     res.sendStatus(200);
//   } catch (error) {
//     console.error(error);
//     res.sendStatus(500);
//   }
// });

let mainWindow: BrowserWindow | null = null;

function connectRichPrecence() {
  return new Promise<ReturnType<typeof DiscordRichPrecenceClient> | null>(
    (res) => {
      const rp = DiscordRichPrecenceClient("1079194728953815191");
      rp.on("error", (e) => {
        console.info("Failed to connect to discord client, Error:", e);
        res(null);
      });
      rp.on("connected", () => {
        res(rp);
      });
    }
  );
}

let PRESENCE_CLIENT: ReturnType<typeof DiscordRichPrecenceClient> | null = null;

connectRichPrecence().then((p) => {
  PRESENCE_CLIENT = p;
});

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon: "./assets/icon",
    height: 600,
    width: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      webSecurity: false,
    },
    frame: platform() !== "win32",
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow && isDev()) {
      mainWindow.webContents.openDevTools();
    }
  });
  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.commandLine.appendSwitch("js-flags", "--max-old-space-size=8192");
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const server = expressApp.listen(() => {
  app.whenReady().then(() => {
    createWindow();
  });
  global.SERVER_ADDRESS = `http://localhost:${
    (server.address() as AddressInfo).port
  }`;
});
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

const APP_URL_REGEX = new RegExp(/musicz:\/\/([a-z0-9-]+)\/(.*)/, "i");
async function onAppUrl(url: string) {
  if (!mainWindow) return;

  const match = url.match(APP_URL_REGEX);
  if (match) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, type, payload] = match;
    if (type === "import") {
      ipcMain.send(mainWindow, "onImport", payload || "");
    }
    console.log("Recieved app url", type, payload);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.on("second-instance", (_event, commandLine, _workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  // the commandLine is array of strings in which last element is deep link url
  // the url str ends with /
  onAppUrl((commandLine.pop() || "").slice(0, -1));
});

app.on("open-url", (_event, url) => {
  onAppUrl(url);
});

function makeLocalId(type: "playlist" | "album" | "track") {
  return `local-${type}-${uuidv4().toString().replaceAll("-", "")}`;
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("musicz", process.execPath, [
      path.resolve(process.argv[1] || ""),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("musicz");
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle("getPreloadPath", () => {
  return MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
});

ipcMain.handle("getTrackStreamInfo", async (track) => {
  return await mediaSources.getStream(track);
});

ipcMain.handle("windowMaximize", () => {
  if (mainWindow) {
    console.log(mainWindow.isMaximizable(), mainWindow.isMaximized());
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("windowMinimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("windowClose", () => {
  mainWindow?.close();
});

ipcMain.handle("getAlbums", async (ids) => {
  return getAlbums(ids || []);
});

ipcMain.handle("getPlaylists", async () => {
  const playlists = getPlaylists();
  return playlists;
});

ipcMain.handle("createPlaylists", async (data) => {
  const newData: IPlaylist[] = data.map((a) => ({
    ...a,
    id: a.id || makeLocalId("playlist"),
    tracks: [],
  }));

  tCreatePlaylists.deferred(newData);

  return newData.map((a) => ({ ...a, tracks: [] }));
});

ipcMain.handle("getAlbumTracks", async (album) => {
  return getAlbumTracks(album);
});

ipcMain.handle("updateDiscordPresence", async (track) => {
  if (!PRESENCE_CLIENT) PRESENCE_CLIENT = await connectRichPrecence();

  try {
    const album = getAlbums([track.album])[0];
    const artist = getArtists(album?.artists)[0];

    PRESENCE_CLIENT?.updatePresence({
      state: `by ${artist?.name}`,
      details: track.title,
      startTimestamp: Date.now(),
      largeImageKey: album?.cover || "default",
      instance: false,
    });
  } catch (error) {
    console.error(error);
  }
});

ipcMain.handle("clearDiscordPresence", async () => {
  if (!PRESENCE_CLIENT) PRESENCE_CLIENT = await connectRichPrecence();
  PRESENCE_CLIENT?.updatePresence({});
  console.log("Returned")
});

ipcMain.handle("getLibraryPath", async () => {
  return getLocalLibraryFilesPath();
});

ipcMain.handle("getTracks", async (ids) => {
  return getTracks(ids || []);
});

ipcMain.handle("getArtists", async (ids) => {
  return getArtists(ids || []);
});

ipcMain.handle("getPlatform", () => {
  return platform();
});

ipcMain.handle("importItems", async (uri) => {
  return await mediaSources.import(uri);
});

ipcMain.handle("isDev", () => {
  return isDev();
});

ipcMain.handle("getLikedTracks", async () => {
  return getLikedTracks();
});

ipcMain.handle("addLikedTracks", async (tracks) => {
  tAddLikedTracks(tracks);
});

ipcMain.handle("removeLikedTracks", async (tracks) => {
  tRemoveLikedTracks(tracks);
});

ipcMain.handle("updatePlaylists", async (items) => {
  tUpdatePlaylists(items);
});

ipcMain.handle("updateTracks", async (items) => {
  tUpdateTracks(items);
});

ipcMain.handle("removePlaylists", async (items) => {
  tRemovePlaylists(items);
});

ipcMain.handle("removeAlbums", async (items) => {
  tRemoveAlbums(items);
});

ipcMain.handle("downloadTrack", async (trackId, streamInfo) => {
  const localSource = mediaSources.getSource<LocalSource>("local");
  if (!localSource) {
    return false;
  }

  return await localSource.downloadTrack(trackId, streamInfo);
});

ipcMain.handle("getServerAddress", () => {
  return SERVER_ADDRESS;
});

ipcMain.handle("getRandomPlaylistCovers", async (playlistId) => {
  return getRandomPlaylistCovers(playlistId);
});
