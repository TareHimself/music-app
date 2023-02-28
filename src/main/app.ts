import { app, BrowserWindow } from "electron";
import * as play from "play-dl";
import {
  IAlbumRaw,
  IPlaylistRaw,
  ITrackRaw,
  IArtistRaw,
  ISpotifyAlbumsResponse,
  KeyValuePair,
  IAlbum,
  ISpotifyTracksResponse,
  ITrack,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import {
  tCreatePlaylists,
  getPlaylists,
  tCreateAlbums,
  tCreateTracks,
  tCreateArtists,
  getAlbums,
  getAlbumTracks,
  getArtists,
  getTracks,
} from "./sqlite";
import { ipcMain } from "../ipc";
import DiscordRichPrecenceClient from "discord-rich-presence";
import { getLibraryPath } from "./utils";
import { SpotifyApi } from "../api";
import axios from "axios";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

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
    frame: false,
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

function makeSpotifyId(id: string) {
  return `spotify:${id}`;
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on("getPreloadPath", (e) => {
  e.replySync(MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY);
});

async function uriToStream(uri: string): Promise<string> {
  const urlInfo = await play.video_info(uri);
  const possibleFormat = urlInfo.format.filter(
    (a) => a.audioQuality === "AUDIO_QUALITY_MEDIUM"
  )[0];
  return possibleFormat.url;
}
const MAX_URI_TRIES = 10

ipcMain.on("getTrackStreamInfo", async (ev, track) => {
  if (track.uri.length <= 0) {
    const album = getAlbums([track.album])[0];
    const artist = getArtists(album.artists)[0];
    const searchTerm = `${album.title} - ${track.title} - ${artist.name} - Audio`;
    console.log(`Searching using [${searchTerm}] since no uri was given.`);
    const videoDetails = (await play.search(searchTerm, {
      source: {
        youtube: "video",
      },
      limit: 4, // 4 results so we have options
    })).find(a => {
      if (searchTerm.toLowerCase().includes('video')) return true; // not much of a choice here

      return a.title && !a.title.toLowerCase().includes('video')
    });

    track.uri = videoDetails.url;

    console.log(`Found [${track.uri}] using [${searchTerm}]`);
  }

  let tries = 0;
  while (tries < MAX_URI_TRIES) {
    try {
      const urlInfo = await play.video_info(track.uri);
      const possibleFormat = urlInfo.format.filter(
        (a) => a.audioQuality === "AUDIO_QUALITY_MEDIUM"
      )[0];

      await axios.head(possibleFormat.url);

      ev.reply({
        uri: possibleFormat.url,
        duration: parseInt(possibleFormat.approxDurationMs || "0", 10),
        from: track.uri,
      });
      break;
    } catch (error) {
      console.log(
        `Error fetching stream for ${track.uri}:\n`,
        error.message
      );
      console.log(`Attempting to fetch new stream url. [${tries + 1}/${MAX_URI_TRIES} Attempts]`)
      tries++;
    }
  }
});

ipcMain.on("toStreamUrl", async (ev, uri) => {
  ev.reply(await uriToStream(uri));
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

  tCreatePlaylists.deferred(newData);

  ev.reply(newData.map((a) => ({ ...a, tracks: [] })));
});

ipcMain.on("getAlbumTracks", (e, album) => {
  e.reply(getAlbumTracks(album).sort((a, b) => a.position - b.position));
});

ipcMain.on("updateDiscordPresence", (ev, track) => {
  const album = getAlbums([track.album])[0];
  const artist = getArtists(album.artists)[0];

  PRESENCE_CLIENT.updatePresence({
    state: `by ${artist.name}`,
    details: track.title,
    startTimestamp: Date.now(),
    largeImageKey: album.cover,
    instance: true,
  });
  ev.reply();
});

ipcMain.on("clearDiscordPresence", (ev) => {
  PRESENCE_CLIENT.updatePresence({});
  ev.reply();
});

ipcMain.on("getLibraryPath", (ev) => {
  ev.reply(getLibraryPath());
});

ipcMain.on("importSpotifyTracks", async (ev, uris) => {
  const data = (
    await SpotifyApi.get<ISpotifyTracksResponse>(`tracks?ids=${uris.join(",")}`)
  ).data;
  const newTracks: KeyValuePair<
    string,
    {
      track: ITrackRaw;
      album: IAlbumRaw;
      artists: KeyValuePair<string, IArtistRaw>;
    }
  > = {};

  data.tracks.forEach((track) => {
    if (newTracks[track.id]) return;

    const allTrackArtists: KeyValuePair<string, IArtistRaw> = {};

    const newAlbum: IAlbumRaw<string[]> = {
      id: makeSpotifyId(track.id),
      title: track.name,
      cover: track.album.images[0].url,
      released: parseInt(track.album.release_date.split("-")[0]),
      artists: track.album.artists
        .filter((a) => a.type === "artist")
        .map((a) => {
          const newArtist: IArtistRaw = {
            id: makeSpotifyId(a.id),
            name: a.name,
          };
          if (!allTrackArtists[a.id]) {
            allTrackArtists[a.id] = newArtist;
          }

          return newArtist.id;
        }),

      genre: "",
    };

    const trackArtists = track.artists
      .filter((a) => a.type === "artist")
      .map((a) => {
        const newArtist: IArtistRaw = {
          id: makeSpotifyId(a.id),
          name: a.name,
        };

        if (!allTrackArtists[a.id]) {
          allTrackArtists[a.id] = newArtist;
        }

        return newArtist.id;
      });

    const newTrack: ITrackRaw = {
      id: makeSpotifyId(track.id),
      title: track.name,
      album: newAlbum.id,
      uri: "",
      artists: trackArtists,
      duration: 0,
      position: track.track_number,
    };

    newTracks[track.id] = {
      track: newTrack,
      artists: allTrackArtists,
      album: newAlbum,
    };
  });

  const result: ITrack[] = Object.values(newTracks).map((data) => {
    // Must happen in this order to keep foreign key constraints
    tCreateArtists(Object.values(data.artists));
    tCreateAlbums([data.album]);
    tCreateTracks([data.track]);
    return data.track;
  });

  ev.reply(result);
});

ipcMain.on("importSpotifyAlbums", async (ev, uris) => {
  const data = (
    await SpotifyApi.get<ISpotifyAlbumsResponse>(`albums?ids=${uris.join(",")}`)
  ).data;
  const newAlbums: KeyValuePair<
    string,
    {
      album: IAlbumRaw;
      tracks: ITrackRaw[];
      artists: KeyValuePair<string, IArtistRaw>;
    }
  > = {};

  data.albums.forEach((album) => {
    if (newAlbums[album.id]) return;

    const allAlbumArtists: KeyValuePair<string, IArtistRaw> = {};

    const newAlbum: IAlbumRaw = {
      id: makeSpotifyId(album.id),
      title: album.name,
      cover: album.images[0].url,
      released: parseInt(album.release_date.split("-")[0]),
      artists: album.artists
        .filter((a) => a.type === "artist")
        .map((a) => {
          const newArtist: IArtistRaw = {
            id: makeSpotifyId(a.id),
            name: a.name,
          };
          if (!allAlbumArtists[a.id]) {
            allAlbumArtists[a.id] = newArtist;
          }

          return newArtist.id;
        }),

      genre: album.genres.join("|"),
    };

    newAlbums[album.id] = {
      album: newAlbum,
      artists: allAlbumArtists,
      tracks: album.tracks.items.map((currentTrack) => {
        const trackArtists = currentTrack.artists
          .filter((a) => a.type === "artist")
          .map((a) => {
            const newArtist: IArtistRaw = {
              id: makeSpotifyId(a.id),
              name: a.name,
            };

            if (!allAlbumArtists[a.id]) {
              allAlbumArtists[a.id] = newArtist;
            }

            return newArtist.id;
          });

        const newTrack: ITrackRaw = {
          id: makeSpotifyId(currentTrack.id),
          title: currentTrack.name,
          album: newAlbum.id,
          uri: "",
          artists: trackArtists,
          duration: 0,
          position: currentTrack.track_number,
        };

        return newTrack;
      }),
    };
  });

  const result: IAlbum[] = Object.values(newAlbums).map((data) => {
    // Must happen in this order to keep foreign key constraints
    tCreateArtists(Object.values(data.artists));
    tCreateAlbums([data.album]);
    tCreateTracks(data.tracks);
    return {
      ...data.album,
      tracks: data.tracks
        .sort((a, b) => a.position - b.position)
        .map((t) => t.id),
    };
  });

  ev.reply(result);
});

ipcMain.on("importSpotifyPlaylists", async (ev) => {
  ev.reply([]);
});

ipcMain.on("getTracks", (ev, ids) => {
  ev.reply(getTracks(ids || []));
});

ipcMain.on("getArtists", async (ev, ids) => {
  ev.reply(getArtists(ids || []));
});
