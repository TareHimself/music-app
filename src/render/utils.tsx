import AppConstants from "@root/data";
import {
  ICreateContextMenuEventData,
  INotificationInfo,
  KeyValuePair,
  Vector2,
} from "@types";
import ColorThief from "colorthief";
import { toast } from "@render/react-basic-toast";

export const imageColor = new ColorThief();

function pad(number: number) {
  return number < 10 ? `0${number.toFixed(0)}` : `${number.toFixed(0)}`;
}

export function TimeToInteger(date: Date) {
  return parseInt(
    `${date.getUTCFullYear()}${pad(date.getUTCMonth())}${pad(
      date.getUTCDate()
    )}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
      date.getUTCSeconds()
    )}`,
    10
  );
}

export function SqlIntegerToTime(number: number) {
  const string = number.toString();

  const newDate = new Date();
  newDate.setUTCSeconds(parseInt(string.slice(-2, string.length), 10));
  newDate.setUTCMinutes(parseInt(string.slice(-4, string.length - 2), 10));
  newDate.setUTCHours(parseInt(string.slice(-6, string.length - 4), 10));
  newDate.setUTCDate(parseInt(string.slice(-8, string.length - 6), 10));
  newDate.setUTCMonth(parseInt(string.slice(-10, string.length - 8), 10));
  newDate.setUTCFullYear(parseInt(string.slice(0, -10), 10));

  return newDate;
}

export function addNotification(noti: string) {
  document.dispatchEvent(
    new CustomEvent<INotificationInfo>("notification", {
      detail: {
        id: performance.now(),
        content: noti,
      },
    })
  );
}

export function generateContextMenu(data: ICreateContextMenuEventData) {
  document.dispatchEvent(
    new CustomEvent<ICreateContextMenuEventData>("make-context-menu", {
      detail: data,
    })
  );
}

export function getAudioPlayer() {
  return document.getElementById(
    AppConstants.AUDIO_PLAYER_ID
  ) as HTMLAudioElement | null;
}

export function toTimeString(timeNumber: number) {
  return `${pad(Math.floor(timeNumber / 1000 / 60))}:${pad(
    (timeNumber / 1000) % 60
  )}`;
}

export async function wait(timeout: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}

export async function ensureBridge(interval = 200) {
  while (!window?.bridge) {
    // eslint-disable-next-line no-await-in-loop
    await wait(interval);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayToIndex<T extends KeyValuePair<string, any>, K = T>(
  arr: T[],
  onItem: (item: T) => K,
  key: keyof T = "id"
) {
  return arr.reduce((t, a) => {
    t[a[key]] = onItem(a);
    return t;
  }, {} as KeyValuePair<string, K>);
}

export function getCoverUrl(cover?: string,useFallback = true){
  if (!cover && useFallback) {
    return AppConstants.DEFAULT_COVER_ART;
  }

  return `app:/covers/${cover}`;
}

const COVERS_GENERATED: Record<string, string> = {};

export function getCachedCover(playlistId: string) {
  console.log("Getting cover for id", playlistId);
  return COVERS_GENERATED[playlistId];
}

export async function generateNewCover(filename: string, covers: string[]): Promise<boolean> {
  if (covers.length < 4) {
    while (covers.length < 4) {
      covers.push(...covers.slice(0, 1));
    }
  }

  const canvas = document.createElement("canvas");
  const coverSize = 1024;
  canvas.width = coverSize;
  canvas.height = coverSize;
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) {
    canvas.remove();
    return false;
  }

  const canvasHalfWidth = canvas.width / 2;
  const canvasHalfHeight = canvas.height / 2;
  for (let i = 0; i < covers.length; i++) {
    const targetCover = covers[i];
    if (!targetCover) {
      canvas.remove();
      return false;
    }

    const imageToDraw = await new Promise<HTMLImageElement>((res) => {
      const pending = new Image();

      pending.addEventListener("load", () => {
        res(pending);
      });

      pending.src = getCoverUrl(targetCover);
    });

    const canvasDrawLocation: Vector2 = {
      x: canvasHalfWidth * ((i + 2) % 2),
      y: canvasHalfHeight * (i < 2 ? 0 : 1),
    };

    const imageWidth = imageToDraw.naturalWidth;
    const imageHeight = imageToDraw.naturalHeight;

    const imageMinDim = Math.min(imageHeight, imageWidth);

    const imageDrawDx =
      imageWidth === imageMinDim ? 0 : (imageWidth - imageMinDim) / 2;
    const imageDrawDy =
      imageHeight === imageMinDim ? 0 : (imageHeight - imageMinDim) / 2;

    canvasCtx.drawImage(
      imageToDraw,
      imageDrawDx,
      imageDrawDy,
      imageMinDim,
      imageMinDim,
      canvasDrawLocation.x,
      canvasDrawLocation.y,
      canvasHalfWidth,
      canvasHalfHeight
    );
  }

  await new Promise<number | undefined>((res) => {
    const data = canvas.toDataURL('png')
    fetch(`app://covers/${filename}`, {
          method: "PUT",
          body: data,
        })
          .then((a) => a.status)
          .then(res);
    // canvas.toDataURL((data) => {
    //   if (data) {
    //     const form = new FormData();
    //     form.append("cover", data, filename);
        
    //   } else {
    //     res(undefined);
    //   }
    // });
  });

  canvas.remove();

  return true
}
export async function generatePlaylistCover(
  playlistId: string
): Promise<boolean> {
  const covers = await window.bridge.getRandomPlaylistCovers(
    playlistId === "liked" ? undefined : playlistId
  );

  if (covers.length === 0) {
    return false;
  }

  return await toast.promise(generateNewCover(playlistId, covers), {
    pending: "Generating Cover",
    success: "Cover Generated",
    error: "Failed To Generate Cover",
  });
}



