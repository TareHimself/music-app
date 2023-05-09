import { toast } from "react-hot-toast";
import { ITrackResource, TrackStreamInfo } from "@types";
const EXPIRE_AT_REGEX = /expire=([0-9]+)/;
class StreamManagerClass {
  cache: Map<string, TrackStreamInfo> = new Map();
  player: HTMLAudioElement = new Audio();
  streamsBeingFetched: Set<string> = new Set();
  constructor() {
    this.player.volume = 0.1;
  }

  async getStreamInfo(track: ITrackResource, forceNew = false) {
    this.streamsBeingFetched.add(track.id);
    if (!forceNew && this.cache.has(track.id)) {
      this.streamsBeingFetched.delete(track.id);
      return this.cache.get(track.id);
    }
    const toastId = toast.loading(`Fetching Stream`);
    const streamInfo = await window.bridge.getTrackStreamInfo(track);

    if (!streamInfo) {
      toast.error("Failed To Fetch Stream", {
        id: toastId,
      });
      this.streamsBeingFetched.delete(track.id);
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

      this.streamsBeingFetched.delete(track.id);
      toast.success("Fetched Stream", {
        id: toastId,
      });
      return streamInfo;
    }

    toast.error("Failed To Fetch Stream", {
      id: toastId,
    });

    return undefined;
  }

  has(trackId: string) {
    return this.cache.has(trackId);
  }

  fetching(trackId: string) {
    return this.streamsBeingFetched.has(trackId);
  }

  remove(trackId: string) {
    this.cache.delete(trackId);
    this.streamsBeingFetched.delete(trackId);
    if (this.player.getAttribute("track") === trackId) {
      this.player.src = "";
    }
  }

  play(trackId: string): boolean {
    if (!this.has(trackId)) {
      return false;
    }

    this.player.setAttribute("track", trackId);
    this.player.src = this.cache.get(trackId)?.uri || "";
    this.player.play();
    return true;
  }
}

export const StreamManager = new StreamManagerClass();
