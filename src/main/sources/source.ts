/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ESearchFilter,
  IResourceImport,
  ITrackResource,
  SearchReturnType,
  TrackStreamInfo,
} from "@types";

export interface IResourceImportFromSource extends IResourceImport {
  remaining: string[];
}

export default abstract class MusiczMediaSource {
  public get bSupportsSearch() {
    return false;
  }
  public get bSupportsStreaming() {
    return false;
  }
  public get bSupportsImports() {
    return false;
  }

  public get supportedSearchFilters(): ESearchFilter[] {
    if (this.bSupportsSearch) {
      throw new Error("Search supported but filters not specified");
    }
    return [];
  }

  public get id(): string {
    throw new Error("How have you done this");
  }

  toSourceId(id: string) {
    return `${this.id}-${id}`;
  }

  async load(): Promise<void> {}

  public canFetchStream(_resource: ITrackResource): boolean {
    throw new Error("Method not implemented");
  }

  
  public async fetchStream(
    _resource: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    throw new Error("Method not implemented");
  }

  public async search<T extends ESearchFilter>(
    _query: string,
    _type: T
  ): Promise<SearchReturnType<T>> {
    throw new Error("Method not implemented");
  }

  public async import(_items: string[]): Promise<IResourceImportFromSource> {
    throw new Error("Method not implemented");
  }
}

export class SourceManager {
  private sources: Map<string, MusiczMediaSource> = new Map();
  private searchSources: string[] = [];
  private streamSources: string[] = [];
  private importSources: string[] = [];
  constructor() {}

  public async useSource(source: MusiczMediaSource) {
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

  public getSource<T>(id: string) {
    return this.sources.get(id) as T | undefined;
  }

  public async getStream(
    resource: ITrackResource
  ): Promise<TrackStreamInfo | null> {
    try {
      for (let i = 0; i < this.streamSources.length; i++) {
        const sourceId = this.streamSources[i];
        if (!sourceId) continue;
        const item = this.sources.get(sourceId);
        if (!item) continue;

        if (item.canFetchStream(resource)) {
          const result = await item.fetchStream(resource);
          if (!result) {
            continue;
          }
          console.log("Used source",item.id,"to get stream for",resource)
          return result;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  }

  public async import(resources: string[]): Promise<IResourceImport> {
    console.log("Attempting to import",resources)
    const result: IResourceImport = {
      albums: {},
      artists: {},
      playlists: {},
    };

    let itemsNotImported = resources;
    for (const sourceId of this.importSources) {
      try {
        console.info(`Trying Source ${sourceId}`)
        const currentItem = this.sources.get(sourceId);

        if (!currentItem) continue;

        const { remaining, albums, artists, playlists } =
          await currentItem.import(itemsNotImported);

          
        result.albums = { ...result.albums, ...albums };
        result.artists = { ...result.artists, ...artists };
        result.playlists = { ...result.playlists, ...playlists };
        console.info(`Imported ${itemsNotImported.length - remaining.length} items using source ${currentItem.id} , ${remaining.length} Items remaining`)
        itemsNotImported = remaining;
        
        if (itemsNotImported.length === 0) {
          break;
        }
      } catch (e) {
        console.error(e);
        break;
      }
    }

    return result;
  }

  public async search(query: string, type: ESearchFilter, sourceId: string) {
    if (!this.searchSources.includes(sourceId)) {
      return [];
    }

    const source = this.sources.get(sourceId);
    if (!source) return undefined;
    
    return await source.search(query, type);
  }
}
