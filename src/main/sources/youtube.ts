import { ITrackResource } from "../../types";
import MusiczMediaSource from "./source";
import YTMusic from "ytmusic-api";
import * as play from "play-dl";
import axios from "axios";

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

  override async parse(track: ITrackResource) {
    if (!track.uri) {
      const artist = track.artists.reduce(
        (all, current) => `${all} ${current}`,
        ""
      );
      const searchTerm = `${track.album} - ${track.title} - ${artist} - Audio`;

      const results = await this.ytMusicApi.searchSongs(searchTerm);

      track.uri = `https://youtube.com/watch?v=${results[0].videoId}`;
    }

    let tries = 0;
    while (tries < MAX_URI_TRIES) {
      try {
        const urlInfo = await play.video_info(track.uri);

        const possibleFormat = urlInfo.format.filter(
          (a) => a.audioQuality === "AUDIO_QUALITY_MEDIUM"
        )[0];

        await axios.head(possibleFormat.url);

        return {
          uri: possibleFormat.url,
          duration: parseInt(possibleFormat.approxDurationMs || "0", 10),
          from: track.uri,
        };
      } catch (error) {
        console.log(`Error fetching stream for ${track.uri}:\n`, error.message);
        console.log(
          `Attempting to fetch new stream url. [${
            tries + 1
          }/${MAX_URI_TRIES} Attempts]`
        );
        tries++;
      }
    }

    return null;
  }
}
