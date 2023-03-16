import { app } from "electron";
import path from "path";

export function isDev() {
  return !app.isPackaged;
}

export function getLibraryDataPath() {
  return path.join(app.getPath("music"), "musicz");
}

export function getLocalLibraryFilesPath() {
  return path.join(getLibraryDataPath(), "library");
}

export function getDatabasePath() {
  return path.join(getLibraryDataPath(), isDev() ? "dev-library" : "library");
}
