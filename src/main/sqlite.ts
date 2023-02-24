/* eslint-disable @typescript-eslint/no-unused-vars */
import Database from 'better-sqlite3';
import { ILocalPlaylist, ILocalPlaylistMetaUpdate } from 'types';

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

function objectToSetStatement(obj: object) {
  const keys = Object.keys(obj);
  return keys.reduce((t, c) => {
    return `${t} ${c} = @${c}`;
  }, 'SET');
}
const InsertNewPlaylistStatement = db.prepare<ILocalPlaylist>(
  'INSERT INTO playlists (id,title,cover,position) VALUES (@id,@title,@cover,@position)'
);
// const tInsertArtists = db.transaction((artists: ILocalArtist[]) => {});

// const tInsertTracks = db.transaction((artists: ILocalTrack[]) => {});

// const tInsertAlbums = db.transaction((albums: ILocalAlbum[]) => {});

const tCreatePlaylists: Database.Transaction<
  (playlists: ILocalPlaylist[]) => void
> = db.transaction((playlists: ILocalPlaylist[]) => {
  for (let i = 0; i < playlists.length; i++) {
    InsertNewPlaylistStatement.run(playlists[i]);
  }
});

const tUpdatePlaylistsMeta: Database.Transaction<
  (updates: ILocalPlaylistMetaUpdate[]) => void
> = db.transaction((updates: ILocalPlaylistMetaUpdate[]) => {
  for (let i = 0; i < updates.length; i++) {
    db.prepare<ILocalPlaylistMetaUpdate>(
      `UPDATE playlists ${objectToSetStatement(updates[i])} WHERE id=@id`
    ).run(updates[i]);
  }
});

export { tCreatePlaylists, tUpdatePlaylistsMeta };
// export { tInsertArtists, tInsertTracks, tInsertAlbums, tInsertPlaylists };
