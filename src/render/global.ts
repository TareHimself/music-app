import { toast } from "react-hot-toast";
import { ITrackResource, TrackStreamInfo } from "../types";
const EXPIRE_AT_REGEX = /expire=([0-9]+)/;
class StreamManagerClass {
  cache: Map<string, TrackStreamInfo> = new Map();
  player: HTMLAudioElement = new Audio();

  constructor() {
    this.player.volume = 0.1;
  }

  async getStreamInfo(track: ITrackResource, forceNew = false) {
    console.log("Fetching resource for ", track);
    if (!forceNew && this.cache.has(track.id)) {
      console.log("Fetching track from cache");
      console.log("Got", this.cache.get(track.id));
      return this.cache.get(track.id);
    }

    const streamInfo = await toast.promise(
      window.bridge.getTrackStreamInfo(track),
      {
        loading: "Fetching Stream",
        error: "Failed To Fetch Stream",
        success: "Stream Fetched",
      }
    );

    console.log("Got", streamInfo);
    if (!streamInfo) {
      toast.error("Failed To Fetch Stream");
      return undefined;
    }

    const expireAtStr = (streamInfo.uri.match(EXPIRE_AT_REGEX) || [])[1];
    if (expireAtStr) {
      const expire_in =
        parseInt(expireAtStr) * 1000 - Date.now() - streamInfo.duration * -2;
      this.cache.set(track.id, streamInfo);

      setTimeout(
        (cache: Map<string, TrackStreamInfo>) => {
          cache.delete(track.id);
        },
        expire_in,
        this.cache
      );
    }

    console.log("Gotten stream info for track", track.title);

    return streamInfo;
  }

  has(trackId: string) {
    return this.cache.has(trackId);
  }
}

export const StreamManager = new StreamManagerClass();
