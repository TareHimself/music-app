import { app } from "electron";
import path from "path";
import { existsSync, mkdirSync } from "fs";

export function isDev() {
  return !app.isPackaged;
}

export function getLibraryDataPath() {
  return path.join(app.getPath("music"), "musicz", isDev() ? "debug" : "data");
}

export function getLocalLibraryFilesPath() {
  return path.join(getLibraryDataPath(), "library");
}

export function getDatabasePath() {
  return path.join(getLibraryDataPath(), "db");
}

if (!existsSync(getLocalLibraryFilesPath())) {
  mkdirSync(getLocalLibraryFilesPath(), { recursive: true });
}
