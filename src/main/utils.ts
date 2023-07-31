import { app } from "electron";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { xxh64 } from "@node-rs/xxhash";

export function isDev() {
  return !app.isPackaged;
}

export const importDynamic = new Function(
  "modulePath",
  "return import(modulePath)"
);

export function getLibraryDataPath() {
  return path.resolve(isDev()
  ? path.join("./", "debug", "data")
  : path.join(app.getPath("music"), "musicz", "data"))
}

export function getCoversPath() {
  return path.join(getLibraryDataPath(), "covers");
}

export function getLocalLibraryFilesPath() {
  return path.join(getLibraryDataPath(), "library");
}

export function getDatabasePath() {
  return path.join(getLibraryDataPath(), "db");
}

const HASH_CACHE = new Map<string, string>();

export function hash(data: string) {
  const existing = HASH_CACHE.get(data);

  if (existing) {
    return existing;
  }

  const newHash = xxh64(data).toString();

  HASH_CACHE.set(data, newHash);

  return newHash;
}

if (!existsSync(getLocalLibraryFilesPath())) {
  mkdirSync(getLocalLibraryFilesPath(), { recursive: true });
}

if (!existsSync(getCoversPath())) {
  mkdirSync(getCoversPath(), { recursive: true });
}
