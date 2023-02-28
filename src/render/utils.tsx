import AppConstants from "../data";
import { INotificationInfo, KeyValuePair } from "../types";
import ColorThief from "colorthief";

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

export function getAudioPlayer() {
  return document.getElementById(
    AppConstants.AUDIO_PLAYER_ID
  ) as HTMLAudioElement | null;
}

export function toTimeString(timeNumber: number) {
  return `${pad(Math.floor(timeNumber / 60))}:${pad(timeNumber % 60)}`;
}

export async function wait(timeout: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}

export async function ensureBridge(interval = 200) {
  while (!window?.bridge) {
    console.log("Waiting for bridge");
    // eslint-disable-next-line no-await-in-loop
    await wait(interval);
  }
}

export function arrayToIndex<T extends { id: string }, K = T>(
  arr: T[],
  onItem: (item: T) => K
) {
  return arr.reduce((t, a) => {
    t[a.id] = onItem(a);
    return t;
  }, {} as KeyValuePair<string, K>);
}
