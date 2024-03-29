import { Page, TestInfo, _electron} from "@playwright/test";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
export function getTestArguments() {
  const testId = uuidv4().replace(/-/g,'');
  return {
    testId,
    args: [
      path.join(".webpack", "main", "index.js"),
      "--",
      `--testId=${testId}`,
    ],
  };
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

export async function filterTrackList(window: Page, query: string) {
  await window
    .waitForSelector(".library-search.track-list input")
    .then((a) => a.type(query));
}

export async function filterLibraryList(window: Page, query: string) {
  await window
    .waitForSelector(".library-search input")
    .then((a) => a.type(query));
}

export async function importIntoLibrary(window: Page, item: string) {
  await navigateToSettings(window);
  await window.waitForSelector('.row-input-content input[type="text"]');
  await window
    .$('.row-input-content input[type="text"]')
    .then((a) => a?.type(item));
  await window
    .$(".row-input-content .row-input-confirm")
    .then((a) => a?.click());
}

export async function screenshotWindow(
  window: Page,
  testInfo: TestInfo,
  filename: string
) {
  // Get a unique place for the screenshot.
  const screenshotPath = testInfo.outputPath(`${filename}.png`);
  // Add it to the report.

  // Take the screenshot itself.
  await window.screenshot({ path: screenshotPath, timeout: 5000 });

  testInfo.attachments.push({
    name: "screenshot",
    path: screenshotPath,
    contentType: "image/png",
  });
}

export async function screenshotOnError<T>(
  window: Page,
  testInfo: TestInfo,
  filename: string,
  exec: () => Promise<T>
) {
  try {
    return await exec();
  } catch (error) {
    await screenshotWindow(window, testInfo, filename);
    throw error;
  }
}

export async function copyLogOnError<T>(
  testInfo: TestInfo,
  testId: string,
  exec: () => Promise<T>
) {
  try {
    return await exec();
  } catch (error) {
    const logPath = testInfo.outputPath(`main.log`);
    // Add it to the report.

    await fs.promises.copyFile(
      path.resolve(path.join("./testing", testId, "logs", "main.log")),
      logPath
    );

    testInfo.attachments.push({
      name: "main log",
      path: logPath,
      contentType: "text",
    });
    throw error;
  }
}


async function cleanupTest(testId: string){
  try{
    await fs.promises.rm(path.resolve(path.join("./testing", testId)),{
      recursive: true
    })
  }catch(e){ /* empty */ console.log("Cleanup error",e)}
}
export async function testAppInstance(
  testInfo: TestInfo,
  doTest: (app: Page) => Promise<void>,
  timeout = 60 * 1000
) {
  testInfo.setTimeout(timeout);

    const { testId, args: launchArgs } = getTestArguments();
    const app = await _electron.launch({ args: launchArgs });
    const window = await app.firstWindow();

    try {
      await screenshotOnError(window, testInfo, "error", async () => {
        await copyLogOnError(testInfo, testId, async () => {
          await doTest(window);
          await app.close();
          await cleanupTest(testId)
        });
      });
    } catch (error) {
      await app.close();
      await cleanupTest(testId)
      throw error;
    }
}
