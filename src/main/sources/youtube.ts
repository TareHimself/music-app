import { ITrackResource, TrackStreamInfo } from "@types";
import MusiczMediaSource from "./source";
import YTMusic from "ytmusic-api";
import axios from "axios";
import { getInfo } from "ytdl-core";
import { startStopProfile } from "../../global-utils";

const MAX_URI_TRIES = 10;

export default class YoutubeSource extends MusiczMediaSource {
  ytMusicApi: YTMusic = new YTMusic();
  static YOUTUBE_URI_REGEX =
    /https:\/\/(?:[a-z]+.)?youtube.[a-z]+\/watch\?v=.*/;

  override get id() {
    return "youtube";
  }

  override get bSupportsStreaming() {
    return true;
  }

  override async load() {
    await this.ytMusicApi.initialize();
  }

  override canFetchStream(track: ITrackResource) {
    return (
      track.uri.length === 0 ||
      track.uri.match(YoutubeSource.YOUTUBE_URI_REGEX) !== null
    );
  }

  override async fetchStream(
    track: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    if (track.uri.length === 0) {
      console.log(track.uri);
      startStopProfile("video uri search");
      const searchTerm = `${track.title} ${track.artists.join(" ")}, ${
        track.album
      }`.trim();

      console.log(searchTerm);

      const results = await this.ytMusicApi.searchSongs(searchTerm);

      track.uri = `https://youtube.com/watch?v=${results[0]?.videoId || ""}`;

      console.info("Used", searchTerm, "To fetch", track.uri);

      startStopProfile("video uri search");
    }

    console.info("Using uri", track.uri);

    let tries = 0;
    startStopProfile("uri stream fetch");
    while (tries < MAX_URI_TRIES) {
      try {
        startStopProfile("uri stream info");
        const urlInfo = await getInfo(track.uri);
        startStopProfile("uri stream info");

        startStopProfile("uri stream verification");
        const possibleFormat = urlInfo.formats.filter(
          (a) => a.hasAudio && a.audioQuality === "AUDIO_QUALITY_MEDIUM"
        )[0];

        if (!possibleFormat?.url) {
          throw new Error("Try again my guy");
        }

        await axios.head(possibleFormat.url);
        startStopProfile("uri stream verification");
        startStopProfile("uri stream fetch");
        return {
          uri: possibleFormat.url,
          duration: parseInt(possibleFormat.approxDurationMs || "0", 10),
          from: track.uri,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.log(`Error fetching stream for ${track.uri}:\n`, error.message);
        console.log(
          `Attempting to fetch new stream url. [${
            tries + 1
          }/${MAX_URI_TRIES} Attempts]`
        );
        startStopProfile("uri stream verification");
        tries++;
      }
    }

    return null;
  }
}
