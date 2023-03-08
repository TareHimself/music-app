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
    await source.load();
    this.sources.set(source.id, source);
  }

  async parse(resource: ITrackResource): Promise<TrackStreamInfo | null> {
    const sourceItems = Array.from(this.sources.values());

    for (let i = 0; i < sourceItems.length; i++) {
      const item = sourceItems[i];
      if (!item) continue;

      if (item.canParse(resource)) {
        const result = await item.parse(resource);
        if (!result) {
          continue;
        }
        return result;
      }
    }

    return null;
  }
}
