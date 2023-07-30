import {
  IAlbum,
  IArtist,
  ITrack,
  ITrackResource,
  KeyValuePair,
  TrackStreamInfo,
} from "@types";
import MusiczMediaSource, { IResourceImportFromSource } from "./source";
import YTMusic from "ytmusic-api";
import { video_info } from "play-dl";
import {
  getTracks,
  tCreateAlbums,
  tCreateArtists,
  tCreateTracks,
} from "../sqlite";

export interface IYoutubeImportCache {
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  artists: KeyValuePair<string, IArtist>;
}

export default class YoutubeSource extends MusiczMediaSource {
  ytMusicApi: YTMusic = new YTMusic();
  static YOUTUBE_URI_REGEX =
    /https:\/\/(?:[a-z]+.)?youtube.[a-z]+\/watch\?v=([a-zA-Z0-9]+)/;

  override get id() {
    return "youtube";
  }

  override get bSupportsStreaming() {
    return true;
  }

  override get bSupportsImports() {
    return true;
  }

  override async load() {
    await this.ytMusicApi.initialize();
  }

  override canFetchStream(resource: ITrackResource) {
    return YoutubeSource.YOUTUBE_URI_REGEX.test(resource.uri);
  }

  public override async import(
    items: string[]
  ): Promise<IResourceImportFromSource> {
    const remaining = [];

    const importCache: IYoutubeImportCache = {
      albums: {},
      artists: {},
      tracks: {},
    };

    for (const item of items) {
      try {
        if (YoutubeSource.YOUTUBE_URI_REGEX.test(item)) {
          const match = item.match(YoutubeSource.YOUTUBE_URI_REGEX);
          if (match) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, videoId] = match;
            if (!videoId)
              throw new Error(`Could not get video id from [${videoId}]`);
            const result = await this.ytMusicApi.getSong(videoId);

            const artists: IArtist[] = result.artists.map((a) => {
              return {
                name: a.name,
                id: this.toSourceId(`artist-${a.artistId}`),
              };
            });

            const album: IAlbum = {
              title: result.name,
              cover: result.thumbnails[result.thumbnails.length - 1]?.url ?? "",
              released: -1,
              artists: artists.map((a) => a.id),
              genre: "",
              tracks: [this.toSourceId(`track-${videoId}`)],
              id: this.toSourceId(`unknown-${videoId}`),
            };

            const track: ITrack = {
              title: result.name,
              album: album.id,
              uri: `https://youtube.com/watch?v=${result.videoId}`,
              artists: artists.map((a) => a.id),
              duration: result.duration * 1000,
              position: 0,
              id: this.toSourceId(`track-${videoId}`),
            };

            importCache.tracks[track.id] = track;
            artists.forEach((a) => {
              importCache.artists[a.id] = a;
            });

            importCache.albums[album.id] = album;
            continue;
          }
        }
      } catch (error) {
        console.error(error);
      }

      remaining.push(item);
    }

    tCreateArtists(Object.values(importCache.artists));
    tCreateAlbums(Object.values(importCache.albums));
    tCreateTracks(Object.values(importCache.tracks));

    return { ...importCache, playlists: {}, remaining: remaining };
  }

  // private async fetchStreamInternal( resource: ITrackResource,maxTries: number,tries= 0): Promise<TrackStreamInfo | null> {

  //   if(tries === maxTries){
  //     return null
  //   }
  //   }
  override async fetchStream(
    resource: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    const trackInfo = getTracks([resource.id])[0];

    if (!trackInfo) return null;

    const uri = trackInfo?.uri;

    const i = await video_info(uri);

    const selected = i.format[i.format.length - 1];

    if (!(selected && selected.url && selected.approxDurationMs)) return null;

    return {
      uri: selected.url,
      duration: i.video_details.durationInSec * 1000,
      from: this.id,
    };
  }
}
