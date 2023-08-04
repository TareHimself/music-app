import { test, _electron } from "@playwright/test";
import {
  copyLogOnError,
  getRandomAndExtract,
  getTestArguments,
  importIntoLibrary,
  screenshotOnError,
} from "./utils";

const spotifyExtractionRegex =
  /https?:\/\/[a-z]+\.spotify\.com\/[a-z]+\/([a-zA-Z0-9]+)\??.*/;

test.setTimeout(0);
// eslint-disable-next-line no-empty-pattern
test("App Imports Spotify Playlist", async ({}, testInfo) => {
  const { testId, args } = getTestArguments();
  const app = await _electron.launch({ args: args });
  const window = await app.firstWindow();

  const [itemUrl, itemId] = getRandomAndExtract(
    [
      "https://open.spotify.com/playlist/5AAcdVSf1m3eNMd0hwS51G",
      "https://open.spotify.com/playlist/5wTJTZkGb30JuYYfz7vbDL",
      "https://open.spotify.com/playlist/2xzz28TOx3ZHQrnuKUYoKV?si=db9dd5eb858f4c36",
      "https://open.spotify.com/playlist/37i9dQZF1EVHGWrwldPRtj?si=f587146bceae4b7a",
    ],
    (a) => {
      const match = a.match(spotifyExtractionRegex);
      if (!match || !match[1]) {
        throw new Error(`[${a}] is not a valid spotify url`);
      }

      return [a, match[1]];
    }
  );

  await importIntoLibrary(window, itemUrl);

  await screenshotOnError(window, testInfo, "failure", async () => {
    await copyLogOnError(testInfo, testId, async () => {
      await window.waitForSelector(
        `.nav-item[data-target="/playlist/spotify-playlist-${itemId}"]`,
        {
          timeout: 50 * 1000,
        }
      );
    });
  });

  await app.close();
});
