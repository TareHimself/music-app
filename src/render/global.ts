import { toast } from "react-hot-toast";
import { ITrackResource, TrackStreamInfo } from "@types";
const EXPIRE_AT_REGEX = /expire=([0-9]+)/;
type StreamFetchCallback = (success: TrackStreamInfo | undefined) => void;

declare global {
  interface AudioContext {
    sinkId: string;
    setSinkId: (id: string) => Promise<undefined>;
  }
}

class StreamManagerClass {
  cache: Map<string, TrackStreamInfo> = new Map();
  player: HTMLAudioElement = new Audio();
  streamsBeingFetched: Set<string> = new Set();
  streamFetchCallbacks: Map<string, StreamFetchCallback[]> = new Map();
  context: AudioContext;

  constructor() {
    this.player.volume = 0.1;
    this.context = new AudioContext();
    this.context
      .createMediaElementSource(this.player)
      .connect(this.context.destination);
  }

  get deviceId() {
    return this.context.sinkId;
  }

  setMediaDevice(deviceId: string) {
    try {
      this.context.setSinkId(deviceId);
      return true;
    } catch (error) {
      return false;
    }
  }

  addOnStreamFetched(trackId: string, callback: StreamFetchCallback) {
    if (this.has(trackId)) {
      callback(this.cache.get(trackId));
      return;
    }

    if (!this.streamFetchCallbacks.has(trackId)) {
      this.streamFetchCallbacks.set(trackId, [callback]);
    } else {
      this.streamFetchCallbacks.get(trackId)?.push(callback);
    }
  }

  notifyStreamFetched(trackId: string, result: TrackStreamInfo | undefined) {
    this.streamFetchCallbacks.get(trackId)?.forEach((a) => a(result));
    this.streamFetchCallbacks.delete(trackId);
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
      this.notifyStreamFetched(track.id, undefined);
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
      this.notifyStreamFetched(track.id, streamInfo);
      return streamInfo;
    }

    toast.error("Failed To Fetch Stream", {
      id: toastId,
    });

    this.notifyStreamFetched(track.id, undefined);
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
      window.utils.skipCurrentTrack();
    }
  }

  async play(trackId: string): Promise<boolean> {
    if (!this.has(trackId)) {
      return false;
    }

    this.player.setAttribute("track", trackId);
    this.player.src = this.cache.get(trackId)?.uri || "";

    try {
      await this.player.play();
    } catch (e) {
      console.error(trackId, e);
    }

    return true;
  }
}

export const StreamManager = new StreamManagerClass();

declare global {
  // eslint-disable-next-line no-var
  var streamManager: StreamManagerClass;
}

globalThis.streamManager = StreamManager;
