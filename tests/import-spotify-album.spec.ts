import {
  filterLibraryList,
  getRandomAndExtract,
  importIntoLibrary,
  navigateToLibrary,
  testAppInstance,
} from "./utils";
import { test } from "@playwright/test";

const spotifyExtractionRegex =
  /https?:\/\/[a-z]+\.spotify\.com\/[a-z]+\/([a-zA-Z0-9]+)\??.*/;

// eslint-disable-next-line no-empty-pattern
test("App Imports Spotify Album", async ({}, info) => {
  await testAppInstance(info, async (window) => {
    const [itemUrl, itemId] = getRandomAndExtract(
      [
        "https://open.spotify.com/album/7yMkS4NCpG0FH6NoaH3F0a?si=7899c9af27df497c",
        "https://open.spotify.com/album/7ayBZIe1FHkNv0T5xFCX6F?si=1d90c03566574e27",
        "https://open.spotify.com/album/6vIxDmZrN7tYrp3BtgyRGl?si=d72521e92c854007",
        "https://open.spotify.com/album/68enXe5XcJdciSDAZr0Alr?si=7e1be576cfaf42f0",
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
    await navigateToLibrary(window);

    await filterLibraryList(window, `spotify-album-${itemId}`);

    await window.waitForSelector(
      `.album-item[data-id="spotify-album-${itemId}"]`,
      {
        timeout: 20 * 1000,
      }
    );
  });
});
