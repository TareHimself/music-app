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
