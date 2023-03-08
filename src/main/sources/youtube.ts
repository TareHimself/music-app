import { ITrackResource, TrackStreamInfo } from "../../types";
import MusiczMediaSource from "./source";
import YTMusic from "ytmusic-api";
import * as play from "play-dl";
import axios from "axios";
import { getInfo } from "ytdl-core";

const MAX_URI_TRIES = 10;

export default class YoutubeSource extends MusiczMediaSource {
  ytMusicApi: YTMusic = new YTMusic();

  override get id() {
    return "youtube";
  }

  override async load() {
    await this.ytMusicApi.initialize();
  }

  override canParse(track: ITrackResource) {
    return track.uri.length === 0;
  }

  override async parse(track: ITrackResource): Promise<TrackStreamInfo | null> {
    if (!track.uri) {
      console.time("video search");
      const artist = track.artists.reduce(
        (all, current) => `${all} ${current}`,
        "by"
      );
      const searchTerm = `${track.album} - ${track.title} ${artist} - Explicit`;

      console.log(searchTerm);

      const results = await this.ytMusicApi.searchSongs(searchTerm);

      track.uri = `https://youtube.com/watch?v=${results[0]?.videoId || ""}`;
      console.timeEnd("video search");
    }

    let tries = 0;
    console.time("stream fetch");
    while (tries < MAX_URI_TRIES) {
      try {
        console.time("Literal stream fetch");
        const urlInfo = await getInfo(track.uri);
        console.timeEnd("Literal stream fetch");

        console.time("stream verification");
        const possibleFormat = urlInfo.formats.filter(
          (a) => a.hasAudio && a.audioQuality === "AUDIO_QUALITY_MEDIUM"
        )[0];

        if (!possibleFormat?.url) {
          throw new Error("Try again my guy");
        }

        await axios.head(possibleFormat.url);
        console.timeEnd("stream verification");
        console.timeEnd("stream fetch");
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
        console.timeEnd("stream verification");
        tries++;
      }
    }

    return null;
  }
}
