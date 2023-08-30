import {
  IAlbum,
  IArtist,
  IPlaylist,
  ITrack,
  ITrackResource,
  KeyValuePair,
  TrackStreamInfo,
} from "@types";
import MusiczMediaSource, { IResourceImportFromSource } from "./source";
import YTMusic from "ytmusic-api";
import { video_info} from "play-dl";
import {
  tCreateAlbums,
  tCreateArtists,
  tCreateTracks,
} from "../sqlite";

export interface IYoutubeImportCache {
  tracks: KeyValuePair<string, ITrack>;
  albums: KeyValuePair<string, IAlbum>;
  artists: KeyValuePair<string, IArtist>;
  playlists: KeyValuePair<string, IPlaylist>;
}

export default class YoutubeSource extends MusiczMediaSource {
  ytMusicApi: YTMusic = new YTMusic();
  static YOUTUBE_VIDEO_URI_REGEX =
    /https:\/\/(?:[a-z]+.)?youtube.[a-z]+\/watch\?v=([a-zA-Z0-9]+)/;

  static YOUTUBE_MUSIC_PLAYLIST_URI_REGEX = /(?:list=([^=&]+))/

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
    // console.log("Search result",await searchMusics('The Glory Days by Tia'))
  }

  override canFetchStream(resource: ITrackResource) {
    return YoutubeSource.YOUTUBE_VIDEO_URI_REGEX.test(resource.uri);
  }
  
  private async importVideo(videoId: string,importCache: IYoutubeImportCache){
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
      id: this.toSourceId(`album-single-${videoId}`),
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
  }

  // private async importPlaylist(playlistId: string,isYtMusic: boolean,importCache: IYoutubeImportCache){
  //   const playlistData = await this.ytMusicApi.getPlaylist(playlistId)
  //   const newPlaylist: IPlaylist = {
  //     id: this.toSourceId(`playlist-${playlistData.playlistId}`),
  //     tracks: [],
  //     title: playlistData.name,
  //     cover: "",
  //     position: -1
  //   }

  //   if(isYtMusic){
  //     const tracks = await this.ytMusicApi.getPlaylistVideos(playlistId)
  //     for(const track of tracks){
  //       const trackId = this.toSourceId(`track-${track.videoId}`)

  //       const albumId = this.toSourceId(`album-${track.}`)
  //       const newTrack: ITrack = {

  //       }
  //     }
  //   }
  //   else
  //   {

  //   }
  //   const result = await ;

  //   const artists: IArtist[] = result.artists.map((a) => {
  //     return {
  //       name: a.name,
  //       id: this.toSourceId(`artist-${a.artistId}`),
  //     };
  //   });

  //   const album: IAlbum = {
  //     title: result.name,
  //     cover: result.thumbnails[result.thumbnails.length - 1]?.url ?? "",
  //     released: -1,
  //     artists: artists.map((a) => a.id),
  //     genre: "",
  //     tracks: [this.toSourceId(`track-${videoId}`)],
  //     id: this.toSourceId(`unknown-${videoId}`),
  //   };

  //   const track: ITrack = {
  //     title: result.name,
  //     album: album.id,
  //     uri: `https://youtube.com/watch?v=${result.videoId}`,
  //     artists: artists.map((a) => a.id),
  //     duration: result.duration * 1000,
  //     position: 0,
  //     id: this.toSourceId(`track-${videoId}`),
  //   };

  //   importCache.tracks[track.id] = track;
  //   artists.forEach((a) => {
  //     importCache.artists[a.id] = a;
  //   });

  //   importCache.albums[album.id] = album;
  // }

  public override async import(
    items: string[]
  ): Promise<IResourceImportFromSource> {
    const remaining = [];

    const importCache: IYoutubeImportCache = {
      albums: {},
      artists: {},
      tracks: {},
      playlists: {}
    };

    for (const item of items) {
      try {
        if (YoutubeSource.YOUTUBE_VIDEO_URI_REGEX.test(item)) {
          const match = item.match(YoutubeSource.YOUTUBE_VIDEO_URI_REGEX);
          if (match) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, videoId] = match;
            if (!videoId)
              throw new Error(`Could not get video id from [${videoId}]`);
            await this.importVideo(videoId,importCache)
            continue;
          }
        }
        // else if(YoutubeSource.YOUTUBE_MUSIC_PLAYLIST_URI_REGEX.test(item)){
        //   const match = item.match(YoutubeSource.YOUTUBE_VIDEO_URI_REGEX);
        //   if (match) {
        //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //     const [_, videoId] = match;
        //     if (!videoId)
        //       throw new Error(`Could not get video id from [${videoId}]`);
        //     await this.importVideo(videoId,importCache)
        //     continue;
        //   }
        // }
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

    const uri = resource.uri;

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
