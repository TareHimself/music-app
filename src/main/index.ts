import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { getLibraryPath } from "./utils";
const gotTheLock = app.requestSingleInstanceLock();

if (gotTheLock) {

  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');

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
