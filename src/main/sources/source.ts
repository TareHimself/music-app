/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ESearchFilter,
  IResourceImport,
  ITrackResource,
  SearchReturnType,
  TrackStreamInfo,
} from "@types";

export default abstract class MusiczMediaSource {
  bSupportsSearch: boolean = false;
  bSupportsStreaming: boolean = false;
  bSupportsImports: boolean = false;

  get supportedSearchFilters(): ESearchFilter[] {
    if (this.bSupportsSearch) {
      throw new Error("Search supported but filters not specified");
    }
    return [];
  }

  constructor(
    bSupportsSearch: boolean,
    bSupportsStreaming: boolean,
    bSupportsImports: boolean
  ) {
    this.bSupportsSearch = bSupportsSearch;
    this.bSupportsStreaming = bSupportsStreaming;
    this.bSupportsImports = bSupportsImports;
  }
  get id(): string {
    throw new Error("How have you done this");
  }

  toSourceId(id: string) {
    return `${this.id}-${id}`;
  }

  async load(): Promise<void> {}

  canFetchStream(_resource: ITrackResource): boolean {
    throw new Error("Method not implemented");
  }

  async fetchStream(
    _resource: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    throw new Error("Method not implemented");
  }

  async search<T extends ESearchFilter>(
    _query: string,
    _type: T
  ): Promise<SearchReturnType<T>> {
    throw new Error("Method not implemented");
  }

  async import(
    _items: string[]
  ): Promise<IResourceImport & { remaining: string[] }> {
    throw new Error("Method not implemented");
  }
}

export class SourceManager {
  private sources: Map<string, MusiczMediaSource> = new Map();
  private searchSources: string[] = [];
  private streamSources: string[] = [];
  private importSources: string[] = [];
  constructor() {}

  async useSource(source: MusiczMediaSource) {
    await source.load();
    if (source.bSupportsSearch) {
      this.searchSources.push(source.id);
    }

    if (source.bSupportsStreaming) {
      this.streamSources.push(source.id);
    }

    if (source.bSupportsImports) {
      this.importSources.push(source.id);
    }
    this.sources.set(source.id, source);
  }

  async getStream(resource: ITrackResource): Promise<TrackStreamInfo | null> {
    try {
      for (let i = 0; i < this.streamSources.length; i++) {
        const item = this.sources.get(this.streamSources[i]!);
        if (!item) continue;

        if (item.canFetchStream(resource)) {
          const result = await item.fetchStream(resource);
          if (!result) {
            continue;
          }
          return result;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  async import(resources: string[]): Promise<IResourceImport> {
    const result: IResourceImport = {
      albums: {},
      artists: {},
      playlists: {},
    };

    let itemsNotImported = resources;
    for (let i = 0; i < this.importSources.length; i++) {
      const currentItem = this.sources.get(this.importSources[i]!)!;

      if (!currentItem) continue;

      const { remaining, albums, artists, playlists } =
        await currentItem.import(itemsNotImported);

      result.albums = { ...result.albums, ...albums };
      result.artists = { ...result.artists, ...artists };
      result.playlists = { ...result.playlists, ...playlists };
      itemsNotImported = remaining;
      if (itemsNotImported.length === 0) {
        break;
      }
    }

    return result;
  }

  async search(query: string, type: ESearchFilter, sourceId: string) {
    if (!this.searchSources.includes(sourceId)) {
      return [];
    }

    return await this.sources.get(sourceId)!.search(query, type);
  }
}
