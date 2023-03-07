import { SpotifyApi } from "../../api";
import { batchArray } from "../../global-utils";
import {
  IAlbum,
  IArtist,
  IArtistRaw,
  IPlaylist,
  ISpotifyAlbumsResponse,
  ISpotifyTracksResponse,
  ITrack,
  ITrackRaw,
  KeyValuePair,
} from "../../types";
import { tCreateAlbums, tCreateArtists, tCreateTracks } from "../sqlite";
import SourceImporter from "./importer";

const SPOTIFY_URI_REGEX = /open.spotify.com\/([a-z]+)\/([a-zA-Z0-9]+)/;

export interface ISpotifyImportCache {
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  artists: KeyValuePair<string, IArtist>;
  playlists: KeyValuePair<string, IPlaylist>;
}

export default class SpotifyImporter extends SourceImporter {
  get id(): string {
    return "spotify";
  }

  async importTracks(cache: ISpotifyImportCache, items: string[]) {
    const batches = batchArray(items, 40);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const data = (
        await SpotifyApi.get<ISpotifyTracksResponse>(
          `tracks?ids=${batch.join(",")}`
        )
      ).data;

      data.tracks.forEach((track) => {
        const trackId = this.toSourceId(track.id);
        if (cache.tracks[trackId]) return;

        const albumId = this.toSourceId(track.album.id);

        if (!cache.albums[albumId]) {
          cache.albums[albumId] = {
            id: this.toSourceId(track.id),
            title: track.name,
            cover: track.album.images[0].url,
            released: parseInt(track.album.release_date.split("-")[0]),
            tracks: [trackId],
            artists: track.album.artists
              .filter((a) => a.type === "artist")
              .map((a) => {
                const newArtist: IArtistRaw = {
                  id: this.toSourceId(a.id),
                  name: a.name,
                };

                if (!cache.artists[newArtist.id]) {
                  cache.artists[newArtist.id] = newArtist;
                }

                return newArtist.id;
              }),

            genre: "",
          };
        } else {
          cache.albums[albumId].tracks.push(trackId);
          cache.albums[albumId].tracks.sort(
            (a, b) => cache.tracks[a].position - cache.tracks[b].position
          );
        }

        const trackArtists = track.artists
          .filter((artist) => artist.type === "artist")
          .map((artist) => {
            const newArtist: IArtistRaw = {
              id: this.toSourceId(artist.id),
              name: artist.name,
            };

            if (!cache.artists[newArtist.id]) {
              cache.artists[newArtist.id] = newArtist;
            }

            return newArtist.id;
          });

        const newTrack: ITrackRaw = {
          id: trackId,
          title: track.name,
          album: albumId,
          uri: "",
          artists: trackArtists,
          duration: 0,
          position: track.track_number,
        };

        cache.tracks[trackId] = newTrack;
      });
    }
  }

  async importAlbums(cache: ISpotifyImportCache, items: string[]) {
    const batches = batchArray(items, 20);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const data = (
        await SpotifyApi.get<ISpotifyAlbumsResponse>(
          `albums?ids=${batch.join(",")}`
        )
      ).data;

      data.albums.forEach((album) => {
        const albumId = this.toSourceId(album.id);
        if (cache.albums[albumId]) return;

        const newAlbum: IAlbum = {
          id: albumId,
          title: album.name,
          cover: album.images[0].url,
          released: parseInt(album.release_date.split("-")[0]),
          artists: album.artists
            .filter((a) => a.type === "artist")
            .map((a) => {
              const newArtist: IArtistRaw = {
                id: this.toSourceId(a.id),
                name: a.name,
              };
              if (!cache.artists[newArtist.id]) {
                cache.artists[newArtist.id] = newArtist;
              }

              return newArtist.id;
            }),

          genre: album.genres.join("|"),

          tracks: album.tracks.items
            .sort((a, b) => a.track_number - b.track_number)
            .map((track) => {
              const trackId = this.toSourceId(track.id);
              const newTrack: ITrackRaw = {
                id: trackId,
                title: track.name,
                album: albumId,
                uri: "",
                artists: track.artists
                  .filter((a) => a.type === "artist")
                  .map((a) => {
                    const newArtist: IArtistRaw = {
                      id: this.toSourceId(a.id),
                      name: a.name,
                    };

                    if (!cache.artists[newArtist.id]) {
                      cache.artists[newArtist.id] = newArtist;
                    }

                    return newArtist.id;
                  }),
                duration: 0,
                position: track.track_number,
              };

              if (!cache.tracks[trackId]) {
                cache.tracks[trackId] = newTrack;
              }

              return newTrack.id;
            }),
        };

        cache.albums[albumId] = newAlbum;
      });
    }
  }

  // async importPlaylists(cache: ISpotifyImportCache, items: string[]) {}

  async parse(items: string[]) {
    const remaining = [...items];
    const albumsToImport = [];
    const tracksToImport = [];
    const playlistsToImport = [];

    const cache: ISpotifyImportCache = {
      tracks: {},
      albums: {},
      artists: {},
      playlists: {},
    };

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      const match = currentItem.match(SPOTIFY_URI_REGEX);
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, category, spotify_id] = match;
        if (category === "album") {
          albumsToImport.push(spotify_id);
          remaining.splice(remaining.indexOf(currentItem, 1));
        } else if (category === "track") {
          tracksToImport.push(spotify_id);
          remaining.splice(remaining.indexOf(currentItem, 1));
        } else if (category === "playlist") {
          playlistsToImport.push(spotify_id);
          remaining.splice(remaining.indexOf(currentItem, 1));
        }
      }
    }

    await this.importAlbums(cache, albumsToImport);
    await this.importTracks(cache, tracksToImport);
    //https://open.spotify.com/album/5p0RmmR4QuGvGLqc8Ow4ba?si=ebeac79a7d76484d,https://open.spotify.com/album/6KT8x5oqZJl9CcnM66hddo?si=c2dc102670df4888,https://open.spotify.com/album/7Hc9zEVvu3wOJXI5YVhXe2?si=e92371eab47b4912,https://open.spotify.com/album/2rBHhp9tNShxTb529Hi5AS?si=f4e3f71d63984a9e,https://open.spotify.com/album/6t5D6LEgHxqUVOxJItkzfb?si=eed322fbddeb4158,https://open.spotify.com/album/3ciEcHv8axaPC5YHTJ72Bg?si=0b9587a50ed44629

    // must happen in this order to avoid foreign key contraints
    tCreateArtists(Object.values(cache.artists));
    tCreateAlbums(Object.values(cache.albums));
    tCreateTracks(Object.values(cache.tracks));

    return { ...cache, remaining: remaining };
  }
}
