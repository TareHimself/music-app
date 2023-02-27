/* eslint-disable @typescript-eslint/no-unused-vars */
import Database from "better-sqlite3";
import {
  IAlbum,
  IAlbumRaw,
  IArtist,
  IArtistRaw,
  IPlaylist,
  IPlaylistRaw,
  IPlaylistRawMetaUpdate,
  IPlaylistTrack,
  ITrack,
  ITrackRaw,
} from "../types";
import { app } from 'electron'
import { getDatabasePath } from "./utils";

const DATABASE_DIR = getDatabasePath();

export const SQLITE_ARRAY_SEPERATOR = ",";

const db = Database(DATABASE_DIR);

const TABLE_STATEMENTS = [
  `
    CREATE TABLE IF NOT EXISTS artists(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
    ) WITHOUT ROWID;
    `,
  `
    CREATE TABLE IF NOT EXISTS albums(
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover TEXT NOT NULL,
        released INTEGER NOT NULL,
        genre TEXT NOT NULL
    ) WITHOUT ROWID;
    `,
  `
    CREATE TABLE IF NOT EXISTS album_artist(
        album REFERENCES albums(id),
        artist REFERENCES artists(id)
    )`,
  `
    CREATE TABLE IF NOT EXISTS tracks(
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        uri TEXT NOT NULL,
        album REFERENCES albums(id),
        duration INTEGER DEFAULT 0,
        position INTEGER NOT NULL
    ) WITHOUT ROWID;
    `,
  `
    CREATE TABLE IF NOT EXISTS track_artist(
        track REFERENCES tracks(id),
        artist REFERENCES artists(id)
    )`,
  `
    CREATE TABLE IF NOT EXISTS playlists(
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover TEXT NOT NULL,
        position INTEGER NOT NULL
    ) WITHOUT ROWID;
    `,
  `
    CREATE TABLE IF NOT EXISTS playlist_tracks(
        playlist TEXT NOT NULL,
        track TEXT NOT NULL,
        added INTEGER NOT NULL,
        FOREIGN KEY (playlist) REFERENCES playlists (id),
        FOREIGN KEY (track) REFERENCES tracks (id)
    )`,
];

// fix concurrency issues
db.pragma("journal_mode = WAL");

db.pragma("wal_checkpoint(RESTART)");

db.transaction((statements: string[]) => {
  statements.forEach((statement) => {
    db.prepare(statement).run();
  });
}).immediate(TABLE_STATEMENTS);

function objectToSetStatement(obj: object) {
  const keys = Object.keys(obj);
  return keys.reduce((t, c) => {
    return `${t} ${c}=@${c}`;
  }, "SET");
}

const InsertNewPlaylistStatement = db.prepare<IPlaylistRaw>(
  "REPLACE INTO playlists (id,title,cover,position) VALUES (@id,@title,@cover,@position)"
);

const InsertNewAlbumStatement = db.prepare<IAlbumRaw>(
  "REPLACE INTO albums (id,title,cover,released,genre) VALUES (@id,@title,@cover,@released,@genre)"
);

const InsertNewArtistStatement = db.prepare<IArtistRaw>(
  "REPLACE INTO artists (id,name) VALUES (@id,@name)"
);

const InsertNewAlbumArtistLinkStatement = db.prepare<{
  album: string;
  artist: string;
}>("REPLACE INTO album_artist (album,artist) VALUES (@album,@artist)");

const InsertNewTrackStatement = db.prepare<ITrackRaw>(
  "REPLACE INTO tracks (id,title,uri,album,duration,position) VALUES (@id,@title,@uri,@album,@duration,@position)"
);

const InsertNewTrackArtistLinkStatement = db.prepare<{
  track: string;
  artist: string;
}>("REPLACE INTO track_artist (track,artist) VALUES (@track,@artist)");

const GetPlaylistsStatement = db.prepare("SELECT * FROM playlists");

const GetPlaylistsTracksStatement = db.prepare<{ id: string }>(
  "SELECT track, added FROM playlist_tracks WHERE playlist=@id"
);

const GetArtistsStatement = db.prepare("SELECT * FROM artists");

const GetAlbumsStatement = db.prepare("SELECT * FROM albums");

const GetAlbumArtistsStatement = db.prepare<{ album: string }>(
  "SELECT artist FROM album_artist WHERE album=@album"
);

const GetAlbumTrackIdsStatement = db.prepare<{ id: string }>(
  "SELECT id FROM tracks WHERE album=@id"
);

const GetAlbumTracksStatement = db.prepare<{ id: string }>(
  "SELECT * FROM tracks WHERE album=@id"
);

const GetTracksStatement = db.prepare("SELECT * FROM tracks");

const GetTrackArtistsStatement = db.prepare<{ track: string }>(
  "SELECT artist FROM track_artist WHERE track=@track"
);

// const tInsertArtists = db.transaction((artists: ILocalArtist[]) => {});

// const tInsertTracks = db.transaction((artists: ILocalTrack[]) => {});

// const tInsertAlbums = db.transaction((albums: ILocalAlbum[]) => {});

export const tCreatePlaylists: Database.Transaction<
  (playlists: IPlaylistRaw[]) => void
> = db.transaction((playlists) => {
  for (let i = 0; i < playlists.length; i++) {
    InsertNewPlaylistStatement.run(playlists[i]);
  }
});

export const tCreateAlbums: Database.Transaction<(data: IAlbumRaw[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      InsertNewAlbumStatement.run(data[i]);
      data[i].artists.forEach((a) => {
        InsertNewAlbumArtistLinkStatement.run({ artist: a, album: data[i].id });
      });
    }
  });

export const tCreateTracks: Database.Transaction<(data: ITrackRaw[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      InsertNewTrackStatement.run(data[i]);
      data[i].artists.forEach((a) => {
        InsertNewTrackArtistLinkStatement.run({ artist: a, track: data[i].id });
      });
    }
  });

export const tCreateArtists: Database.Transaction<
  (data: IArtistRaw[]) => void
> = db.transaction((data) => {
  for (let i = 0; i < data.length; i++) {
    InsertNewArtistStatement.run(data[i]);
  }
});

export const tUpdatePlaylistsMeta: Database.Transaction<
  (updates: IPlaylistRawMetaUpdate[]) => void
> = db.transaction((updates: IPlaylistRawMetaUpdate[]) => {
  for (let i = 0; i < updates.length; i++) {
    db.prepare<IPlaylistRawMetaUpdate>(
      `UPDATE playlists ${objectToSetStatement(updates[i])} WHERE id=@id`
    ).run(updates[i]);
  }
});

export function getPlaylists(): IPlaylist[] {
  const playlists = GetPlaylistsStatement.all() as IPlaylistRaw[];

  return playlists.map((p) => {
    const tracks = GetPlaylistsTracksStatement.all({
      id: p.id,
    }) as IPlaylistTrack[];

    return { ...p, tracks: tracks };
  });
}

export function getArtists(ids: string[] = []): IArtist[] {
  let artists: IArtistRaw[] = [];

  if (ids.length) {
    artists = db.prepare(`SELECT * FROM artists WHERE id IN (${ids.map(a => `'${a}'`).join(",")})`).all();
  } else {
    artists = GetArtistsStatement.all();
  }

  return artists;
}

export function getAlbumTracksIds(album: string): string[] {
  return (GetAlbumTrackIdsStatement.all({ id: album }) as { id: string }[]).map(
    (a) => a.id
  );
}

export function getAlbum(id: string): IAlbum[] {
  const albums = GetAlbumsStatement.all() as IAlbumRaw[];

  return albums.map((p) => {
    return {
      ...p,
      tracks: getAlbumTracksIds(p.id),
      artists: GetAlbumArtistsStatement.all({ album: p.id }).map((a) => a.artist),
    };
  });
}

export function getAlbums(ids: string[] = []): IAlbum[] {
  let albums: IAlbumRaw[] = [];

  if (ids.length) {
    albums = db.prepare(`SELECT * FROM albums WHERE id IN (${ids.map(a => `'${a}'`).join(",")})`).all();
  } else {
    albums = GetAlbumsStatement.all();
  }

  return albums.map((p) => {
    return {
      ...p,
      tracks: getAlbumTracksIds(p.id),
      artists: GetAlbumArtistsStatement.all({ album: p.id }).map((a) => a.artist),
    };
  });
}

export function getAlbumTracks(album: string): ITrack[] {
  return (GetAlbumTracksStatement.all({ id: album }) as ITrackRaw[]).map(
    (a) => ({
      ...a,
      artists: GetTrackArtistsStatement.all({ track: a.id }).map((a) => a.artist),
    })
  );
}

export function getTracks(ids: string[] = []): ITrack[] {
  let tracks: ITrackRaw[] = [];

  if (ids.length) {
    tracks = db.prepare(`SELECT * FROM tracks WHERE id IN (${ids.map(a => `'${a}'`).join(",")})`).all();
  } else {
    tracks = GetTracksStatement.all();
  }

  return tracks.map((p) => {
    return {
      ...p,
      artists: GetTrackArtistsStatement.all({ track: p.id }).map((a) => a.artist),
    };
  });
}
