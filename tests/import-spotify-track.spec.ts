import { test, _electron } from "@playwright/test";
import {  filterTrackList, getRandomAndExtract, getTestArguments, importIntoLibrary, navigateToLibrary } from "./utils";

const spotifyExtractionRegex =
  /https?:\/\/[a-z]+\.spotify\.com\/[a-z]+\/([a-zA-Z0-9]+)\??.*/;

test("App Imports Spotify Track", async () => {
  const app = await _electron.launch({ args: getTestArguments() });
  const window = await app.firstWindow();
  
  const [itemUrl,itemId] = getRandomAndExtract(
    [
      "https://open.spotify.com/track/3XWbhFghR6muICOJrm0doc?si=e4f18edb361a4e80",
      "https://open.spotify.com/track/2e3wKwNMrYIvMgAS484EXQ?si=538460875a254051",
      "https://open.spotify.com/track/5Fgs5BpJufdxh4qPmcnChV?si=81a4b57053fa4e05",
      "https://open.spotify.com/track/5YmmqeU1a7KsNzvbj4aCGS?si=e5ccb2cbc6184170"
    ],
    (a) => {
      const match = a.match(spotifyExtractionRegex);
      if (!match || !match[1]) {
        throw new Error(`[${a}] is not a valid spotify url`);
      }

      return [a,match[1]];
    }
  );

  await importIntoLibrary(window,itemUrl)
  await navigateToLibrary(window)

  await window.waitForSelector(
    `.album-item`
  ).then(a => a.click());

  await filterTrackList(window,`spotify-track-${itemId}`)

  await window.waitForSelector(
    `.track-item[data-id="spotify-track-${itemId}"]`
  );
  await app.close();
});
