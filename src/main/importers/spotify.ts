import { SpotifyApi } from "../../api";
import {
  IAlbum,
  IArtist,
  IArtistRaw,
  IPlaylist,
  IPlaylistTrack,
  ISpotifyAlbumsResponse,
  ISpotifyPlaylistResponse,
  ISpotifyTracksResponse,
  ITrack,
  ITrackRaw,
  KeyValuePair,
} from "../../types";
import {
  tCreateAlbums,
  tCreateArtists,
  tCreatePlaylists,
  tCreateTracks,
} from "../sqlite";
import { v4 as uuidv4 } from "uuid";
import SourceImporter from "./importer";

const SPOTIFY_URI_REGEX = /open.spotify.com\/([a-z]+)\/([a-zA-Z0-9]+)/;
const SPOTIFY_URI_REGEX_2 =
  /(?:spotify-)?(track|album|playlist)-([a-zA-Z0-9]+)/;

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
    const batches = items.batch(40);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;

      const data = (
        await SpotifyApi.get<ISpotifyTracksResponse>(
          `tracks?ids=${batch.join(",")}`
        )
      ).data;

      data.tracks.forEach((track) => {
        if (!track) return;
        const trackId = this.toSourceId(`track-${track.id}`);
        if (cache.tracks[trackId]) return;

        const albumId = this.toSourceId(`album-${track.album.id}`);

        if (!cache.albums[albumId]) {
          cache.albums[albumId] = {
            id: albumId,
            title: track.album.name,
            cover: track.album.images[0]?.url || "",
            released: parseInt(
              track.album.release_date.split("-")[0] || "2000"
            ),
            tracks: [trackId],
            artists: Array.from(
              new Set(
                track.album.artists
                  .filter((a) => a.type === "artist")
                  .map((a) => {
                    const newArtist: IArtistRaw = {
                      id: this.toSourceId(`artist-${a.id}`),
                      name: a.name,
                    };

                    if (!cache.artists[newArtist.id]) {
                      cache.artists[newArtist.id] = newArtist;
                    }

                    return newArtist.id;
                  })
              )
            ),

            genre: "",
          };
        } else {
          cache.albums[albumId]?.tracks.push(trackId);
          cache.albums[albumId]?.tracks.sort(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (a, b) =>
              (cache.tracks[a]?.position || 0) -
              (cache.tracks[b]?.position || 0)
          );
        }

        const trackArtists = Array.from(
          new Set(
            track.artists
              .filter((artist) => artist.type === "artist")
              .map((artist) => {
                const newArtist: IArtistRaw = {
                  id: this.toSourceId(`artist-${artist.id}`),
                  name: artist.name,
                };

                if (!cache.artists[newArtist.id]) {
                  cache.artists[newArtist.id] = newArtist;
                }

                return newArtist.id;
              })
          )
        );

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
    const batches = items.batch(20);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) return;
      const data = (
        await SpotifyApi.get<ISpotifyAlbumsResponse>(
          `albums?ids=${batch.join(",")}`
        )
      ).data;

      data.albums.forEach((album) => {
        if (!album) return;
        const albumId = this.toSourceId(`album-${album.id}`);
        if (cache.albums[albumId]) return;

        const newAlbum: IAlbum = {
          id: albumId,
          title: album.name,
          cover: album.images[0]?.url || "",
          released: parseInt(album.release_date.split("-")[0] || "2000"),
          artists: Array.from(
            new Set(
              album.artists
                .filter((a) => a.type === "artist")
                .map((a) => {
                  const newArtist: IArtistRaw = {
                    id: this.toSourceId(`artist-${a.id}`),
                    name: a.name,
                  };
                  if (!cache.artists[newArtist.id]) {
                    cache.artists[newArtist.id] = newArtist;
                  }

                  return newArtist.id;
                })
            )
          ),

          genre: album.genres.join("|"),

          tracks: album.tracks.items
            .sort((a, b) => a.track_number - b.track_number)
            .map((track) => {
              const trackId = this.toSourceId(`track-${track.id}`);
              const newTrack: ITrackRaw = {
                id: trackId,
                title: track.name,
                album: albumId,
                uri: "",
                artists: Array.from(
                  new Set(
                    track.artists
                      .filter((a) => a.type === "artist")
                      .map((a) => {
                        const newArtist: IArtistRaw = {
                          id: this.toSourceId(`artist-${a.id}`),
                          name: a.name,
                        };

                        if (!cache.artists[newArtist.id]) {
                          cache.artists[newArtist.id] = newArtist;
                        }

                        return newArtist.id;
                      })
                  )
                ),
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

  async importPlaylists(cache: ISpotifyImportCache, items: string[]) {
    items = Array.from(new Set(items));

    for (let i = 0; i < items.length; i++) {
      const currentPlaylistId = items[0];
      const newPlaylistId = this.toSourceId(
        `playlist-${uuidv4().replaceAll("-", "")}`
      );
      if (!cache.playlists[newPlaylistId]) {
        try {
          const response = await SpotifyApi.get<ISpotifyPlaylistResponse>(
            `playlists/${currentPlaylistId}`,
            {
              params: {
                fields:
                  "tracks.items(added_at,track(album(artists,id,images,name,release_date,total_tracks),artists,id,name,track_number,disc_number)),name,id",
              },
            }
          );
          console.log(response.config.headers, response.data);
          if (response.data) {
            const spotifyData = response.data;

            const newPlaylist: IPlaylist = {
              tracks: spotifyData.tracks.items.map((item) => {
                const track = item.track;

                const trackId = this.toSourceId(`track-${track.id}`);

                const newPlaylistTrack: IPlaylistTrack = {
                  track: trackId,
                  timestamp: Math.round(Date.parse(item.added_at) / 1000),
                };

                if (!cache.tracks[trackId]) {
                  const albumId = this.toSourceId(`album-${track.album.id}`);

                  if (!cache.albums[albumId]) {
                    cache.albums[albumId] = {
                      id: albumId,
                      title: track.album.name,
                      cover: track.album.images[0]?.url || "",
                      released: parseInt(
                        track.album.release_date.split("-")[0] || "2000"
                      ),
                      tracks: [trackId],
                      artists: Array.from(
                        new Set(
                          track.album.artists
                            .filter((a) => a.type === "artist")
                            .map((a) => {
                              const newArtist: IArtistRaw = {
                                id: this.toSourceId(`artist-${a.id}`),
                                name: a.name,
                              };

                              if (!cache.artists[newArtist.id]) {
                                cache.artists[newArtist.id] = newArtist;
                              }

                              return newArtist.id;
                            })
                        )
                      ),

                      genre: "",
                    };
                  } else {
                    cache.albums[albumId]?.tracks.push(trackId);
                    cache.albums[albumId]?.tracks.sort(
                      (a, b) =>
                        (cache.tracks[a]?.position || 0) -
                        (cache.tracks[b]?.position || 0)
                    );
                  }

                  const trackArtists = Array.from(
                    new Set(
                      track.artists
                        .filter((artist) => artist.type === "artist")
                        .map((artist) => {
                          const newArtist: IArtistRaw = {
                            id: this.toSourceId(`artist-${artist.id}`),
                            name: artist.name,
                          };

                          if (!cache.artists[newArtist.id]) {
                            cache.artists[newArtist.id] = newArtist;
                          }

                          return newArtist.id;
                        })
                    )
                  );

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
                }

                return newPlaylistTrack;
              }),
              id: newPlaylistId,
              title: spotifyData.name,
              cover: "",
              position: -1,
            };

            cache.playlists[newPlaylistId] = newPlaylist;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  }

  async parse(items: string[]) {
    const remaining = [...items];
    const albumsToImport: string[] = [];
    const tracksToImport: string[] = [];
    const playlistsToImport: string[] = [];

    const cache: ISpotifyImportCache = {
      tracks: {},
      albums: {},
      artists: {},
      playlists: {},
    };

    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      if (!currentItem) continue;
      const match =
        currentItem.match(SPOTIFY_URI_REGEX) ||
        currentItem.match(SPOTIFY_URI_REGEX_2);
      if (match) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, category, spotify_id] = match;
        if (!spotify_id) continue;

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
    await this.importPlaylists(cache, playlistsToImport);
    //https://open.spotify.com/album/5p0RmmR4QuGvGLqc8Ow4ba?si=ebeac79a7d76484d,https://open.spotify.com/album/6KT8x5oqZJl9CcnM66hddo?si=c2dc102670df4888,https://open.spotify.com/album/7Hc9zEVvu3wOJXI5YVhXe2?si=e92371eab47b4912,https://open.spotify.com/album/2rBHhp9tNShxTb529Hi5AS?si=f4e3f71d63984a9e,https://open.spotify.com/album/6t5D6LEgHxqUVOxJItkzfb?si=eed322fbddeb4158,https://open.spotify.com/album/3ciEcHv8axaPC5YHTJ72Bg?si=0b9587a50ed44629

    tCreateArtists(Object.values(cache.artists));
    tCreateAlbums(Object.values(cache.albums));
    tCreateTracks(Object.values(cache.tracks));
    tCreatePlaylists(Object.values(cache.playlists));

    return { ...cache, remaining: remaining };
  }
}
