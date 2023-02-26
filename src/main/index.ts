import { app } from "electron";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { getLibraryPath } from "./utils";
const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {
  const libraryPath = getLibraryPath();

  if (!existsSync(libraryPath)) {
    mkdirSync(libraryPath, {
      recursive: true,
    });
  }

  require("./app");
} else {
  app.quit();
}
