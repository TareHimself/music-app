import { ITrack, TrackStreamInfo } from "../types";
const EXPIRE_AT_REGEX = /expire=([0-9]+)/;
class StreamManagerClass {
  cache: Map<string, TrackStreamInfo> = new Map();
  player: HTMLAudioElement = new Audio();

  constructor() {
    this.player.volume = 0.1;
  }

  async getStreamInfo(track: ITrack, forceNew = false) {
    if (!forceNew && this.cache.has(track.id)) {
      return this.cache.get(track.id);
    }

    const streamInfo = await window.bridge.getTrackStreamInfo(track);
    const expire_in =
      parseInt(streamInfo.uri.match(EXPIRE_AT_REGEX)[1]) * 1000 -
      Date.now() -
      streamInfo.duration * -2;
    this.cache.set(track.id, streamInfo);

    setTimeout(
      (cache: typeof this.cache) => {
        cache.delete(track.id);
      },
      expire_in,
      this.cache
    );

    return streamInfo;
  }
}

export const StreamManager = new StreamManagerClass();
