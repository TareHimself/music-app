Array.prototype.batch = function <T>(this: T[], size: number) {
  return this.reduce<T[][]>((batches, item, index) => {
    if (index % size === 0) {
      batches.push([]);
    }

    batches[batches.length - 1]?.push(item);
    return batches;
  }, []);
};

Array.prototype.lastIndex = function <T>(this: T[]) {
  return this.length - 1;
};

global.keys = {
  SPOTIFY_API_KEY: "",
};

import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { getLocalLibraryFilesPath } from "./utils";
const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {
  const libraryPath = getLocalLibraryFilesPath();

  if (!existsSync(libraryPath)) {
    mkdirSync(libraryPath, {
      recursive: true,
    });
  }

  require("./app");
} else {
  app.quit();
}
