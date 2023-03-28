Array.prototype.batch = function <T>(this: T[], size: number) {
  return this.reduce<T[][]>((batches, item, index) => {
    if (index % size === 0) {
      batches.push([]);
    }

    batches[batches.length - 1]?.push(item);
    return batches;
  }, []);
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
