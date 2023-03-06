/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ITrackResource, TrackStreamInfo } from "../../types";

export default abstract class MusiczMediaSource {
  get id(): string {
    throw new Error("How have you done this");
  }

  async load(): Promise<void> {}

  canParse(_resource: ITrackResource): boolean {
    throw new Error("canParse not overriden");
    return false;
  }

  async parse(_resource: ITrackResource): Promise<TrackStreamInfo | null> {
    throw new Error("Parse not overriden");
  }
}

export class SourceManager {
  sources: Map<string, MusiczMediaSource> = new Map();
  constructor() {}

  async useSource(source: MusiczMediaSource) {
    this.sources.set(source.id, source);
    await source.load();
  }

  async parse(resource: ITrackResource): Promise<TrackStreamInfo | null> {
    const sourceItems = Array.from(this.sources.values());

    for (let i = 0; i < sourceItems.length; i++) {
      if (sourceItems[i].canParse(resource)) {
        const result = await sourceItems[i].parse(resource);
        if (!result) {
          continue;
        }
        return result;
      }
    }

    return null;
  }
}
