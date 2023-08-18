// import { toast } from "react-toastify";
import { toast } from '@render/react-basic-toast'
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
  // https://stackoverflow.com/a/29589128
  noTrackSrc =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=";
  constructor() {
    this.player.volume = 0.1;
    this.player.crossOrigin = "anonymous";
    this.player.src = this.noTrackSrc;
    this.context = new AudioContext();
    this.context
      .createMediaElementSource(this.player)
      .connect(this.context.destination);
    this.player.addEventListener("error", (err) => {
      console.log(err.message);
      window.utils.skipCurrentTrack();
    });
  }

  get deviceId() {
    return this.context.sinkId;
  }

  stopPlayer() {
    this.player.pause();
    this.player.currentTime = 0;

    this.player.src = this.noTrackSrc;
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
    if (!forceNew && this.cache.has(track.id)) {
      this.notifyStreamFetched(track.id,this.cache.get(track.id))
      return this.cache.get(track.id);
    }

    return await toast.promise(
      new Promise<undefined | TrackStreamInfo>((res) => {
        this.streamsBeingFetched.add(track.id);

        window.bridge.getTrackStreamInfo(track).then((streamInfo) => {
          if (!streamInfo) {
            this.streamsBeingFetched.delete(track.id);
            this.notifyStreamFetched(track.id, undefined);
            res(undefined);
            return;
          }

          const expireAtStr = (streamInfo.uri.match(EXPIRE_AT_REGEX) || [])[1];
          if (expireAtStr) {
            const expire_in =
              parseInt(expireAtStr) * 1000 -
              Date.now() -
              streamInfo.duration * -2;
            this.cache.set(track.id, streamInfo);

            setTimeout(
              (cache: Map<string, TrackStreamInfo>) => {
                cache.delete(track.id);
              },
              expire_in,
              this.cache
            );

            this.streamsBeingFetched.delete(track.id);
          }

          this.notifyStreamFetched(track.id, streamInfo);
          res(streamInfo);
        });
      }),
      {
        pending: "Fetching Stream",
        success:(props) => {
          if (!props.data) {
            return "Failed To Fetch Stream";
          }

          return `Fetched Stream`;
        },
        error: () => "Error Fetching Stream",
      }
    );
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
    const toPlay = this.cache.get(trackId)?.uri || "";

    if (toPlay.trim().length <= 0) {
      return false;
    }

    this.player.src = toPlay;

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
