/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { IResourceImport } from "../../types";

export default abstract class SourceImporter {
  get id(): string {
    throw new Error("How have you done this?");
  }

  toSourceId(id: string) {
    return `${this.id}-${id}`;
  }

  async load(): Promise<void> {}

  async parse(
    _items: string[]
  ): Promise<IResourceImport & { remaining: string[] }> {
    throw new Error("Parse not overriden");
  }
}

export class SourceImporterManager {
  importers: Map<string, SourceImporter> = new Map();
  constructor() {}

  async useSource(source: SourceImporter) {
    this.importers.set(source.id, source);
    await source.load();
  }

  async parse(resources: string[]): Promise<IResourceImport> {
    const result: IResourceImport = {
      albums: {},
      artists: {},
      playlists: {},
    };

    const sourceItems = Array.from(this.importers.values());
    let itemsNotImported = resources;
    for (let i = 0; i < sourceItems.length; i++) {
      const currentItem = sourceItems[i];

      if (!currentItem) continue;

      const { remaining, albums, artists, playlists } = await currentItem.parse(
        itemsNotImported
      );

      result.albums = { ...result.albums, ...albums };
      result.artists = { ...result.artists, ...artists };
      result.playlists = { ...result.playlists, ...playlists };
      itemsNotImported = remaining;
      if (itemsNotImported.length === 0) {
        break;
      }
    }

    console.log("Import result", result);

    return result;
  }
}
