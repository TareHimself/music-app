/* eslint-disable @typescript-eslint/no-unused-vars */
import Database from "better-sqlite3";
import {
  IAlbumRaw,
  IPlaylistRaw,
  IPlaylistRawMetaUpdate,
  ITrackRaw,
  IPlaylist,
  IPlaylistTrack,
  IArtistRaw,
  IAlbum,
  ITrack,
  IArtist,
} from "../types";
import { getDatabasePath } from "./utils";

const DATABASE_DIR = getDatabasePath();

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
        artist TEXT NOT NULL,
        genre TEXT NOT NULL,
        FOREIGN KEY (artist) REFERENCES artists (id)
    ) WITHOUT ROWID;
    `,
  `
    CREATE TABLE IF NOT EXISTS tracks(
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        uri TEXT NOT NULL,
        album TEXT NOT NULL,
        artists TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        position INTEGER NOT NULL,
        FOREIGN KEY (album) REFERENCES albums (id)
    ) WITHOUT ROWID;
    `,
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
    return `${t} ${c} = @${c}`;
  }, "SET");
}

const InsertNewPlaylistStatement = db.prepare<IPlaylistRaw>(
  "REPLACE INTO playlists (id,title,cover,position) VALUES (@id,@title,@cover,@position)"
);

const InsertNewAlbumStatement = db.prepare<IAlbumRaw>(
  "REPLACE INTO albums (id,title,cover,released,artist,genre) VALUES (@id,@title,@cover,@released,@artist,@genre)"
);

const InsertNewArtistStatement = db.prepare<IArtistRaw>(
  "REPLACE INTO artists (id,name) VALUES (@id,@name)"
);

const InsertNewTrackStatement = db.prepare<ITrackRaw>(
  "REPLACE INTO tracks (id,title,uri,album,artists,duration,position) VALUES (@id,@title,@uri,@album,@artists,@duration,@position)"
);

const GetPlaylistsStatement = db.prepare("SELECT * FROM playlists");

const GetPlaylistsTracksStatement = db.prepare<{ id: string }>(
  "SELECT track, added FROM playlist_tracks WHERE playlist=@id"
);

const GetArtistsStatement = db.prepare("SELECT * FROM artists");

const GetSpecificArtistsStatement = db.prepare<{ ids: string }>(
  "SELECT * FROM artists WHERE id IN (@ids)"
);

const GetAlbumsStatement = db.prepare("SELECT * FROM albums");

const GetSpecificAlbumsStatement = db.prepare<{ ids: string }>(
  "SELECT * FROM albums WHERE id IN (@ids)"
);

const GetAlbumTrackIdsStatement = db.prepare<{ id: string }>(
  "SELECT id FROM tracks WHERE album=@id"
);

const GetAlbumTracksStatement = db.prepare<{ id: string }>(
  "SELECT * FROM tracks WHERE album=@id"
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
    }
  });

export const tCreateTracks: Database.Transaction<(data: ITrackRaw[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      InsertNewTrackStatement.run(data[i]);
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

export function getArtists(ids?: string): IArtist[] {
  let artists: IArtistRaw[] = [];

  if (ids) {
    artists = GetSpecificArtistsStatement.all({ ids: ids });
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
    return { ...p, tracks: getAlbumTracksIds(p.id) };
  });
}

export function getAlbums(ids?: string): IAlbum[] {
  let albums: IAlbumRaw[] = [];

  if (ids) {
    albums = GetSpecificAlbumsStatement.all({ ids: ids });
  } else {
    albums = GetAlbumsStatement.all();
  }

  return albums.map((p) => {
    return { ...p, tracks: getAlbumTracksIds(p.id) };
  });
}

export function getAlbumTracks(album: string): ITrack[] {
  return (GetAlbumTracksStatement.all({ id: album }) as ITrackRaw[]).map(
    (a) => ({ ...a, artists: a.artists.split("|") })
  );
}
