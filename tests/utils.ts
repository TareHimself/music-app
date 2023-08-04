import { Page, TestInfo } from "@playwright/test";
import path from "path";
import { v4 as uuidv4 } from "uuid";
export function getTestArguments() {
  return [
    path.join(".webpack", "main", "index.js"),
    "--",
    `--testId=${uuidv4()}`,
  ];
}

export function getRandomAndExtract<T, K>(
  urls: T[],
  extractor: (item: T) => K
) {
  return extractor(urls[Math.round(Math.random() * (urls.length - 1))]);
}
export async function navigateToLibrary(window: Page) {
  await window.waitForSelector(".nav-items .nav-item");
  await window.$$(".nav-items .nav-item").then((a) => a[0].click());
}

export async function navigateToSettings(window: Page) {
  await window.waitForSelector(".nav-items .nav-item");
  await window.$$(".nav-items .nav-item").then((a) => a[1].click());
}

export async function filterTrackList(window: Page,query: string){
    await window.waitForSelector('.library-search.track-list input').then(a => a.type(query))
}

export async function filterLibraryList(window: Page,query: string){
    await window.waitForSelector('.library-search input').then(a => a.type(query))
}

export async function importIntoLibrary(window: Page,item: string){
    await navigateToSettings(window)
    await window.waitForSelector('.row-input-content input[type="text"]');
    await window
      .$('.row-input-content input[type="text"]')
      .then((a) => a?.type(item));
    await window
      .$(".row-input-content .row-input-confirm")
      .then((a) => a?.click());
  }

  
  export async function screenshotWindow(window: Page, testInfo: TestInfo,filename: string) {
    // Get a unique place for the screenshot.
   const screenshotPath = testInfo.outputPath(`${filename}.png`);
   // Add it to the report.
   testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
   // Take the screenshot itself.
   await window.screenshot({ path: screenshotPath, timeout: 5000 });
  }

  export async function screenshotOnError<T>(window: Page,testInfo: TestInfo,filename: string,exec: () => Promise<T>){
    try {
        
        return await exec()
    } catch (error) {
        await screenshotWindow(window,testInfo,filename)
        throw error
    }
  }
