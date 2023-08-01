import { BrowserWindow, app } from "electron";
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

export async function searchForTrackUsingBrowserWindow(term: string){

  //https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
  const waitForElementScript = `function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}`

  const browserWindow = await new Promise<BrowserWindow>((res)=>{
    const isDebug = false
    const browser = new BrowserWindow({
      show: isDebug
    })

    browser.webContents.once('did-navigate',()=>{
      res(browser)
    })

    browser.webContents.setAudioMuted(!isDebug)
    browser.loadURL(`https://music.youtube.com/search?q=${term}`)
  })


  const nextPageUrl: string = await browserWindow.webContents.executeJavaScript(`${waitForElementScript}\nwaitForElm('.metadata-container.style-scope.ytmusic-card-shelf-renderer a').then(a => a.href)`)
  if(nextPageUrl.includes('v=')){
    browserWindow.close()
    return nextPageUrl.split('v=')[1]?.split('&')[0]
  }
  

  await new Promise<void>((res)=>{
    browserWindow.webContents.once('did-navigate',()=>{
      res()
    })

    browserWindow.loadURL(nextPageUrl)
  })

  const videoId = await browserWindow.webContents.executeJavaScript(`${waitForElementScript}\nwaitForElm('ytmusic-responsive-list-item-renderer .yt-simple-endpoint.style-scope.yt-formatted-string').then(a => a.href.split('v=')[1].split('&')[0])`)

  browserWindow.close()

  return videoId
}

if (!existsSync(getLocalLibraryFilesPath())) {
  mkdirSync(getLocalLibraryFilesPath(), { recursive: true });
}

if (!existsSync(getCoversPath())) {
  mkdirSync(getCoversPath(), { recursive: true });
}
