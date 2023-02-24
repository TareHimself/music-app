/* eslint-disable @typescript-eslint/no-unused-vars */
import Database from 'better-sqlite3';
import { ILocalAlbum, ILocalArtist, ILocalPlaylist, ILocalTrack } from 'types';

const DATABASE_DIR = 'library.db';

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
        liked INTEGER DEFAULT 0,
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
db.pragma('journal_mode = WAL');

db.pragma('wal_checkpoint(RESTART)');

db.transaction((statements: string[]) => {
  statements.forEach((statement) => {
    db.prepare(statement).run();
  });
}).immediate(TABLE_STATEMENTS);
// const tInsertArtists = db.transaction((artists: ILocalArtist[]) => {});

// const tInsertTracks = db.transaction((artists: ILocalTrack[]) => {});

// const tInsertAlbums = db.transaction((albums: ILocalAlbum[]) => {});

// const tInsertPlaylists = db.transaction((playlists: ILocalPlaylist[]) => {});

// export { tInsertArtists, tInsertTracks, tInsertAlbums, tInsertPlaylists };
