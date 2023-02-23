import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

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
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
    once(channel: string, func: (...args: unknown[]) => void) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
  },
});
