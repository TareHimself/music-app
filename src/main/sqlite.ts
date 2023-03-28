/* eslint-disable @typescript-eslint/no-unused-vars */
import Database from "better-sqlite3";
import {
  IAlbum,
  IAlbumRaw,
  IArtist,
  IArtistRaw,
  ILikedTrack,
  IPlaylist,
  IPlaylistRaw,
  IPlaylistUpdate,
  IPlaylistTrack,
  ITrack,
  ITrackRaw,
  ITrackUpdate,
} from "../types";
import { getDatabasePath } from "./utils";

const DATABASE_DIR = getDatabasePath();

export const SQLITE_ARRAY_SEPERATOR = ",";

const db = Database(DATABASE_DIR);
console.log("Using Database At:", DATABASE_DIR);
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
        artist REFERENCES artists(id),
        UNIQUE(album, artist)
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
        artist REFERENCES artists(id),
        UNIQUE(track, artist)
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
        playlist REFERENCES playlists(id),
        track REFERENCES tracks(id),
        timestamp INTEGER NOT NULL,
        UNIQUE(track, playlist)
    )`,
  `
    CREATE TABLE IF NOT EXISTS liked_tracks(
        track REFERENCES tracks(id),
        timestamp INTEGER NOT NULL,
        UNIQUE(track)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function objectToSetStatement(obj: any) {
  const objTemp = { ...obj };

  if (objTemp["id"]) delete objTemp["id"];

  const keys = Object.keys(objTemp);
  return keys.reduce((t, c, idx, arr) => {
    return `${t} ${c} = @${c}${idx === arr.length - 1 ? "" : ","}`;
  }, "SET");
}

const InsertNewPlaylistStatement = db.prepare<IPlaylistRaw>(
  "REPLACE INTO playlists (id,title,cover,position) VALUES (@id,@title,@cover,@position)"
);

const InsertNewPlaylistTrackStatement = db.prepare<{
  playlist: string;
  track: string;
  timestamp: number;
}>(
  "REPLACE INTO playlist_tracks (playlist,track,timestamp) VALUES (@playlist,@track,@timestamp)"
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

const GetPlaylistsStatement = db.prepare(
  "SELECT * FROM playlists ORDER BY position ASC"
);

const GetPlaylistsTracksStatement = db.prepare<{ id: string }>(
  "SELECT track, timestamp FROM playlist_tracks WHERE playlist=@id ORDER BY timestamp DESC"
);

const GetArtistsStatement = db.prepare("SELECT * FROM artists");

const GetAlbumsStatement = db.prepare("SELECT * FROM albums");

const GetAlbumArtistsStatement = db.prepare<{ album: string }>(
  "SELECT artist FROM album_artist WHERE album=@album"
);

const GetAlbumTrackIdsStatement = db.prepare<{ id: string }>(
  "SELECT id FROM tracks WHERE album=@id ORDER BY position ASC"
);

const GetAlbumTracksStatement = db.prepare<{ id: string }>(
  "SELECT * FROM tracks WHERE album=@id ORDER BY position ASC"
);

const GetTracksStatement = db.prepare("SELECT * FROM tracks");

const GetTrackArtistsStatement = db.prepare<{ track: string }>(
  "SELECT artist FROM track_artist WHERE track=@track"
);

const GetLikedTracksStatement = db.prepare(
  "SELECT * FROM liked_tracks ORDER BY timestamp DESC"
);

const InsertLikedTrackStatement = db.prepare<ILikedTrack>(
  "REPLACE INTO liked_tracks (track,timestamp) VALUES (@track,@timestamp)"
);

const RemoveLikedTrackStatement = db.prepare<{ track: string }>(
  "DELETE FROM liked_tracks WHERE track=@track"
);

const RemovePlaylistTracksStatement = db.prepare<{
  id: string;
}>("DELETE FROM playlist_tracks WHERE playlist=@id");

const RemovePlaylistStatement = db.prepare<{
  id: string;
}>("DELETE FROM playlists WHERE id=@id");

const RemoveAlbumTracksInPlaylistsStatement = db.prepare<{
  id: string;
}>(
  "DELETE FROM playlist_tracks WHERE track in (SELECT id from tracks WHERE album=@id)"
);

const RemoveAlbumTracksArtistsLinksStatement = db.prepare<{
  id: string;
}>(
  "DELETE FROM track_artist WHERE track in (SELECT id from tracks WHERE album=@id)"
);

const RemoveAlbumLikedTracksStatement = db.prepare<{
  id: string;
}>(
  "DELETE FROM liked_tracks WHERE track in (SELECT id from tracks WHERE album=@id)"
);

const RemoveAlbumTracksStatement = db.prepare<{
  id: string;
}>("DELETE FROM tracks WHERE album=@id");

const RemoveAlbumArtistsLinksStatement = db.prepare<{
  id: string;
}>("DELETE FROM album_artist WHERE album=@id");

const RemoveAlbumStatement = db.prepare<{
  id: string;
}>("DELETE FROM albums WHERE id=@id");

// const tInsertArtists = db.transaction((artists: ILocalArtist[]) => {});

// const tInsertTracks = db.transaction((artists: ILocalTrack[]) => {});

// const tInsertAlbums = db.transaction((albums: ILocalAlbum[]) => {});

export const tCreatePlaylists: Database.Transaction<
  (playlists: IPlaylist[]) => void
> = db.transaction((playlists) => {
  for (let i = 0; i < playlists.length; i++) {
    const current = playlists[i];
    if (current) {
      InsertNewPlaylistStatement.run(current);
      current.tracks.forEach((t) => {
        InsertNewPlaylistTrackStatement.run({
          playlist: current.id,
          track: t.track,
          timestamp: t.timestamp,
        });
      });
    }
  }
});

export const tCreateAlbums: Database.Transaction<(data: IAlbum[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      if (!current) continue;
      InsertNewAlbumStatement.run(current);
      current.artists.forEach((a) => {
        InsertNewAlbumArtistLinkStatement.run({ artist: a, album: current.id });
      });
    }
  });

export const tCreateTracks: Database.Transaction<(data: ITrack[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      if (!current) continue;
      InsertNewTrackStatement.run(current);
      current.artists.forEach((a) => {
        InsertNewTrackArtistLinkStatement.run({ artist: a, track: current.id });
      });
    }
  });

export const tCreateArtists: Database.Transaction<(data: IArtist[]) => void> =
  db.transaction((data) => {
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      if (!current) continue;
      InsertNewArtistStatement.run(current);
    }
  });

export const tUpdateTracks: Database.Transaction<
  (updates: ITrackUpdate[]) => void
> = db.transaction((updates: ITrackUpdate[]) => {
  for (let i = 0; i < updates.length; i++) {
    const current = updates[i];
    if (!current) continue;
    db.prepare<ITrackUpdate>(
      `UPDATE tracks ${objectToSetStatement(current)} WHERE id=@id`
    ).run(current);
  }
});

export const tUpdatePlaylists: Database.Transaction<
  (updates: IPlaylistUpdate[]) => void
> = db.transaction((updates: IPlaylistUpdate[]) => {
  for (let i = 0; i < updates.length; i++) {
    const current = updates[i];
    if (!current) continue;
    db.prepare<IPlaylistUpdate>(
      `UPDATE playlists ${objectToSetStatement(current)} WHERE id=@id`
    ).run(current);
  }
});

export const tAddLikedTracks: Database.Transaction<
  (track: ILikedTrack[]) => void
> = db.transaction((tracks: ILikedTrack[]) => {
  for (let i = 0; i < tracks.length; i++) {
    const current = tracks[i];
    if (!current) continue;
    InsertLikedTrackStatement.run(current);
  }
});

export const tRemoveLikedTracks: Database.Transaction<
  (track: string[]) => void
> = db.transaction((tracks: string[]) => {
  for (let i = 0; i < tracks.length; i++) {
    const current = tracks[i];
    if (!current) continue;
    RemoveLikedTrackStatement.run({ track: current });
  }
});

export const tRemovePlaylists: Database.Transaction<(items: string[]) => void> =
  db.transaction((items: string[]) => {
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      if (!current) continue;
      RemovePlaylistTracksStatement.run({
        id: current,
      });

      RemovePlaylistStatement.run({
        id: current,
      });
    }
  });

export const tRemoveAlbums: Database.Transaction<(items: string[]) => void> =
  db.transaction((items: string[]) => {
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      if (!current) continue;
      RemoveAlbumTracksInPlaylistsStatement.run({
        id: current,
      });

      RemoveAlbumLikedTracksStatement.run({
        id: current,
      });

      RemoveAlbumTracksArtistsLinksStatement.run({
        id: current,
      });

      RemoveAlbumTracksStatement.run({
        id: current,
      });

      RemoveAlbumArtistsLinksStatement.run({
        id: current,
      });

      RemoveAlbumStatement.run({
        id: current,
      });
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
    artists = db
      .prepare(
        `SELECT * FROM artists WHERE id IN (${ids
          .map((a) => `'${a}'`)
          .join(",")})`
      )
      .all();
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

export function getAlbums(ids: string[] = []): IAlbum[] {
  let albums: IAlbumRaw[] = [];

  if (ids.length) {
    albums = db
      .prepare(
        `SELECT * FROM albums WHERE id IN (${ids
          .map((a) => `'${a}'`)
          .join(",")})`
      )
      .all();
  } else {
    albums = GetAlbumsStatement.all();
  }

  return albums.map((p) => {
    return {
      ...p,
      tracks: getAlbumTracksIds(p.id),
      artists: GetAlbumArtistsStatement.all({ album: p.id }).map(
        (a) => a.artist
      ),
    };
  });
}

export function getAlbumTracks(album: string): ITrack[] {
  return (GetAlbumTracksStatement.all({ id: album }) as ITrackRaw[]).map(
    (a) => ({
      ...a,
      artists: GetTrackArtistsStatement.all({ track: a.id }).map(
        (a) => a.artist
      ),
    })
  );
}

export function getTracks(ids: string[] = []): ITrack[] {
  let tracks: ITrackRaw[] = [];

  if (ids.length) {
    tracks = ids.batch(30).reduce<ITrack[]>((all, cur) => {
      all.push(
        ...db
          .prepare(
            `SELECT * FROM tracks WHERE id IN (${cur
              .map((a) => `'${a}'`)
              .join(",")})`
          )
          .all()
      );

      return all;
    }, []);
  } else {
    tracks = GetTracksStatement.all();
  }

  return tracks.map((p) => {
    return {
      ...p,
      artists: GetTrackArtistsStatement.all({ track: p.id }).map(
        (a) => a.artist
      ),
    };
  });
}

export function getLikedTracks(): ILikedTrack[] {
  return GetLikedTracksStatement.all() as ILikedTrack[];
}
