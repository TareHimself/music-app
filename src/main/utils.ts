import { app } from "electron";
import path from "path";

export function getDatabasePath() {
  return path.join(app.getPath("music"), "musicz", "library.db");
}

export function getLibraryPath() {
  return path.join(app.getPath("music"), "musicz", "library");
}
