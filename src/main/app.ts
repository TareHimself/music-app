import { app, BrowserWindow } from "electron";
import * as play from "play-dl";
import { IAlbumRaw, IPlaylistRaw, ITrackRaw, IArtistRaw, ISpotifyAlbumsResponse, KeyValuePair, IAlbum, ISpotifyTracksResponse, ITrack } from "../types";
import { v4 as uuidv4 } from "uuid";
import { tCreatePlaylists, getPlaylists, tCreateAlbums, tCreateTracks, tCreateArtists, getAlbums, getAlbumTracks, getArtists } from "./sqlite";
import { ipcMain } from '../ipc'
import DiscordRichPrecenceClient from 'discord-rich-presence';
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


const PRESENCE_CLIENT = DiscordRichPrecenceClient('1079194728953815191')

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
  e.replySync(MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY)
});

async function uriToStream(uri: string): Promise<string> {
  console.log('Fetching stream for uri', uri);
  const urlInfo = await play.video_info(uri)
  const possibleFormat = urlInfo.format.filter(a => a.audioQuality === 'AUDIO_QUALITY_MEDIUM')[0]
  return possibleFormat.url;
}

ipcMain.on("searchForStream", async (ev, search) => {
  console.log("Searching for stream for term", search);
  const result = await play.search(search, {
    source: {
      youtube: "video",
    },
    limit: 1,
  });

  if (result.length) {
    console.log("Stream found, fetching url");
    let uri = ""
    let tries = 0
    while (tries < 10) {
      const testUri = await uriToStream(result[0].url)
      try {
        const testResponse = await axios.head(testUri)

        uri = testUri;
        break;
      } catch (error) {
        console.log(`Error fetching stream for ${result[0].url}:\n`, error.message)
        tries++;
        continue;
      }
    }

    ev.reply(uri);
    return;
  }

  console.log("Stream not found");
  ev.reply("");
});

ipcMain.on('getTrackStreamInfo', async (ev, track) => {
  if (track.uri.length <= 0) {
    const album = getAlbums(track.album)[0]
    const artist = getArtists(album.artist)[0]
    const searchTerm = `${album.title} - ${track.title} - ${artist.name} - Audio`
    const videoDetails = await play.search(searchTerm, {
      source: {
        youtube: "video",
      },
      limit: 1,
    });

    track.uri = videoDetails[0].url;
  }


  let tries = 0
  while (tries < 10) {
    try {
      const urlInfo = await play.video_info(track.uri)
      const possibleFormat = urlInfo.format.filter(a => a.audioQuality === 'AUDIO_QUALITY_MEDIUM')[0]

      await axios.head(possibleFormat.url)

      ev.reply({
        uri: possibleFormat.url,
        duration: parseInt(possibleFormat.approxDurationMs || '0', 10),
        from: track.uri
      });
      break;
    } catch (error) {
      console.log(`Error fetching stream for ${track.uri}:\n`, error.message)
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

ipcMain.on('getAlbums', (e) => {
  e.reply(getAlbums())
});

ipcMain.on('getPlaylists', (ev) => {
  const playlists = getPlaylists();
  ev.reply(playlists);
});

ipcMain.on("createPlaylists", (ev, data) => {

  const newData: IPlaylistRaw[] = data.map(a => ({ ...a, id: a.id || makeLocalId() }))

  tCreatePlaylists.deferred(newData);

  ev.reply(newData.map(a => ({ ...a, tracks: [] })));
});

ipcMain.on('createAlbums', (ev, data) => {
  const newData: IAlbumRaw[] = data.map(a => ({ ...a, id: a.id || makeLocalId() }))

  tCreateAlbums.deferred(newData);

  // need to ensure artists are in db here
  ev.reply(newData.map(a => ({ ...a, tracks: [] })));
});

ipcMain.on('createTracks', (ev, data) => {
  const newData: ITrackRaw[] = data.map(a => ({ ...a, id: a.id || makeLocalId() }))

  tCreateTracks.deferred(newData);

  // need to ensure artists are in db here
  ev.reply(newData.map(a => ({ ...a, artists: a.artists.split(' ') })).sort((a, b) => a.position - b.position));
});
ipcMain.on('createArtists', (ev, data) => {
  const newData: IArtistRaw[] = data.map(a => ({ ...a, id: a.id || makeLocalId() }))

  tCreateArtists.deferred(newData);

  ev.reply(newData);
})

ipcMain.on('getAlbumTracks', (e, album) => {
  e.reply(getAlbumTracks(album).sort((a, b) => a.position - b.position))
});

ipcMain.on('updateDiscordPresence', (ev, track) => {
  const album = getAlbums(track.album)[0];
  const artist = getArtists(album.artist)[0];

  PRESENCE_CLIENT.updatePresence({
    state: `by ${artist.name}`,
    details: track.title,
    startTimestamp: Date.now(),
    largeImageKey: album.cover,
    instance: true,
  })
  ev.reply()
})

ipcMain.on('clearDiscordPresence', (ev) => {
  PRESENCE_CLIENT.updatePresence({})
  ev.reply()
})

ipcMain.on('getLibraryPath', (ev) => {
  ev.reply(getLibraryPath())
})

ipcMain.on('importSpotifyTracks', async (ev, uris) => {
  const data = (await SpotifyApi.get<ISpotifyTracksResponse>(`tracks?ids=${uris.join(',')}`)).data
  const newTracks: KeyValuePair<string, {
    track: ITrackRaw;
    album: IAlbumRaw;
    artists: KeyValuePair<string, IArtistRaw>;
  }> = {};

  data.tracks.forEach((track) => {
    if (newTracks[track.id]) return;

    const allTrackArtists: KeyValuePair<string, IArtistRaw> = {}

    const newAlbum: IAlbumRaw = {
      id: makeSpotifyId(track.id),
      title: track.name,
      cover: track.album.images[0].url,
      released: parseInt(track.album.release_date.split('-')[0]),
      artist: track.album.artists.filter(a => a.type === 'artist').map((a) => {
        const newArtist: IArtistRaw = {
          id: makeSpotifyId(a.id),
          name: a.name
        }
        if (!allTrackArtists[a.id]) {
          allTrackArtists[a.id] = newArtist
        }

        return newArtist;
      })[0].id,

      genre: ''
    }

    const trackArtists = track.artists.filter(a => a.type === 'artist').reduce((all, a, idx, arr) => {
      const newArtist: IArtistRaw = {
        id: makeSpotifyId(a.id),
        name: a.name
      }

      if (!allTrackArtists[a.id]) {
        allTrackArtists[a.id] = newArtist
      }

      return all + (idx === arr.length - 1 ? `${newArtist.id}` : `${newArtist.id}|`);
    }, '')


    const newTrack: ITrackRaw = {
      id: makeSpotifyId(track.id),
      title: track.name,
      album: newAlbum.id,
      uri: "",
      artists: trackArtists,
      duration: 0,
      position: track.track_number
    }

    newTracks[track.id] = {
      track: newTrack,
      artists: allTrackArtists,
      album: newAlbum
    }
  })

  const result: ITrack[] = Object.values(newTracks).map((data) => {
    // Must happen in this order to keep foreign key constraints
    tCreateArtists(Object.values(data.artists))
    tCreateAlbums([data.album])
    tCreateTracks([data.track])
    return ({ ...data.track, artists: data.track.artists.split("|") })
  })


  ev.reply(result)
})

ipcMain.on('importSpotifyAlbums', async (ev, uris) => {
  const data = (await SpotifyApi.get<ISpotifyAlbumsResponse>(`albums?ids=${uris.join(',')}`)).data
  const newAlbums: KeyValuePair<string, {
    album: IAlbumRaw;
    tracks: ITrackRaw[];
    artists: KeyValuePair<string, IArtistRaw>;
  }> = {};

  data.albums.forEach((album) => {
    if (newAlbums[album.id]) return;

    const allAlbumArtists: KeyValuePair<string, IArtistRaw> = {}

    const newAlbum: IAlbumRaw = {
      id: makeSpotifyId(album.id),
      title: album.name,
      cover: album.images[0].url,
      released: parseInt(album.release_date.split('-')[0]),
      artist: album.artists.filter(a => a.type === 'artist').map((a) => {
        const newArtist: IArtistRaw = {
          id: makeSpotifyId(a.id),
          name: a.name
        }
        if (!allAlbumArtists[a.id]) {
          allAlbumArtists[a.id] = newArtist
        }

        return newArtist;
      })[0].id,

      genre: album.genres.join('|')
    }



    newAlbums[album.id] = {
      album: newAlbum,
      artists: allAlbumArtists,
      tracks: album.tracks.items.map((currentTrack) => {
        const trackArtists = currentTrack.artists.filter(a => a.type === 'artist').reduce((all, a, idx, arr) => {
          const newArtist: IArtistRaw = {
            id: makeSpotifyId(a.id),
            name: a.name
          }

          if (!allAlbumArtists[a.id]) {
            allAlbumArtists[a.id] = newArtist
          }

          return all + (idx === arr.length - 1 ? `${newArtist.id}` : `${newArtist.id}|`);
        }, '')


        const newTrack: ITrackRaw = {
          id: makeSpotifyId(currentTrack.id),
          title: currentTrack.name,
          album: newAlbum.id,
          uri: "",
          artists: trackArtists,
          duration: 0,
          position: currentTrack.track_number
        }

        return newTrack;
      })
    }
  })

  const result: IAlbum[] = Object.values(newAlbums).map((data) => {
    // Must happen in this order to keep foreign key constraints
    tCreateArtists(Object.values(data.artists))
    tCreateAlbums([data.album])
    tCreateTracks(data.tracks)
    return ({ ...data.album, tracks: data.tracks.sort((a, b) => a.position - b.position).map(t => t.id) })
  })


  ev.reply(result)
})

ipcMain.on('importSpotifyPlaylists', async (ev, uris) => {
  ev.reply([])
})

ipcMain.on('getArtists', async (ev, ids) => {
  ev.reply(getArtists(ids.join(",")));
})




