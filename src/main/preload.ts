import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ISystemFilesResult,
  IApplicationSettings,
  ILoginData,
  IConvertedSystemFiles,
  IWallpaperData,
  IImageDownload,
} from 'renderer/types';

const validChannels = [
  'ipc-example',
  'upload-files',
  'load-settings',
  'save-settings',
  'open-login',
  'get-login',
  'update-login',
  'logout',
  'upload-images',
  'clear-cache',
  'download-image',
  'window-min',
  'window-max',
  'window-close',
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    uploadFiles(lastUploadPath: string, paths: string[] = []) {
      ipcRenderer.send('upload-files', lastUploadPath, paths);

      return new Promise<ISystemFilesResult>((resolve) => {
        ipcRenderer.once(
          'upload-files',
          (_event, response: ISystemFilesResult) => {
            response.files = response.files.map(([file, index, fileName]) => [
              file,
              index,
              fileName,
            ]);
            resolve(response);
          }
        );
      });
    },
    loadSettings() {
      ipcRenderer.send('load-settings', '');

      return new Promise<IApplicationSettings>((resolve) => {
        ipcRenderer.once('load-settings', (_event, response) => {
          resolve(response);
        });
      });
    },
    saveSettings(settings: IApplicationSettings) {
      ipcRenderer.send('save-settings', settings);

      return new Promise<boolean>((resolve) => {
        ipcRenderer.once('save-settings', (_event, response) => {
          resolve(response);
        });
      });
    },
    openLogin() {
      ipcRenderer.send('open-login', '');
      return new Promise<ILoginData>((resolve) => {
        ipcRenderer.once('open-login', (_event, response) => {
          resolve(response);
        });
      });
    },
    getLogin() {
      ipcRenderer.send('get-login', '');
      return new Promise<ILoginData | undefined>((resolve) => {
        ipcRenderer.once('get-login', (_event, response) => {
          resolve(response);
        });
      });
    },
    updateLogin(data: ILoginData | undefined) {
      ipcRenderer.send('update-login', data);
      return new Promise<void>((resolve) => {
        ipcRenderer.once('update-login', (_event, response) => {
          resolve(response);
        });
      });
    },
    logout() {
      ipcRenderer.send('logout', '');
      return new Promise<void>((resolve) => {
        ipcRenderer.once('logout', (_event, response) => {
          resolve(response);
        });
      });
    },
    uploadImages(images: IConvertedSystemFiles[], uploader_id: string) {
      ipcRenderer.send('upload-images', images, uploader_id);
      return new Promise<IWallpaperData[]>((resolve) => {
        ipcRenderer.once('upload-images', (_event, response) => {
          resolve(response);
        });
      });
    },
    downloadImage(image: IImageDownload) {
      ipcRenderer.send('download-image', image);
      return new Promise<boolean>((resolve) => {
        ipcRenderer.once('download-image', (_event, response) => {
          resolve(response);
        });
      });
    },
    quitApp() {
      ipcRenderer.send('quit-app');
    },
    isDev() {
      ipcRenderer.send('is-dev');
      return new Promise<boolean>((resolve) => {
        ipcRenderer.once('is-dev', (_event, result) => {
          resolve(result);
        });
      });
    },
    getToken() {
      ipcRenderer.send('get-token');
      return new Promise<string>((resolve) => {
        ipcRenderer.once('get-token', (_event, result) => {
          resolve(result);
        });
      });
    },
    windowMinimize() {
      ipcRenderer.send('window-min');
    },
    windowMaximize() {
      ipcRenderer.send('window-max');
    },
    windowClose() {
      ipcRenderer.send('window-close');
    },
    setDownloadPath(currentPath: string) {
      ipcRenderer.send('set-download-path', currentPath);
      return new Promise<string>((resolve) => {
        ipcRenderer.once('set-download-path', (_event, result) => {
          resolve(result);
        });
      });
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      if (validChannels.includes(channel)) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
          func(...args);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      }

      return undefined;
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
  },
});
