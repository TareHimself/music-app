import { INotificationInfo } from './types';

function pad(number: number) {
  return number < 10 ? `0${number}` : `${number}`;
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
    new CustomEvent<INotificationInfo>('notification', {
      detail: {
        id: performance.now(),
        content: noti,
      },
    })
  );
}

export async function getServerUrl() {
  if (window.electron && (await window.electron.ipcRenderer?.isDev())) {
    return 'http://localhost:3001';
  }
  return 'https://wallpaperz-server.oyintare.dev';
}

export async function getDatabaseUrl() {
  return 'https://wallpaperz-database.oyintare.dev';
  if (window.electron && (await window.electron.ipcRenderer?.isDev())) {
    return 'http://localhost:3002';
  }
  return 'https://wallpaperz-database.oyintare.dev';
}
