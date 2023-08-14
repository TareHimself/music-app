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

import "./logging";
import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { getLocalLibraryFilesPath, getTestId } from "./utils";

function runApp() {
  const libraryPath = getLocalLibraryFilesPath();

  if (!existsSync(libraryPath)) {
    mkdirSync(libraryPath, {
      recursive: true,
    });
  }

  require("./app");
}

function quitApp() {
  app.quit();
}
const testId = getTestId();

if (testId !== undefined) {
  runApp();
} else {
  const gotTheLock = app.requestSingleInstanceLock();

  if (gotTheLock) {
    runApp();
  } else {
    quitApp();
  }
}
