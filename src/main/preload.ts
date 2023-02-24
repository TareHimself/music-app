import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { MusicAppIpcEvents } from 'types';

const validChannels: (keyof MusicAppIpcEvents)[] = [
  'windowClose',
  'windowMaximize',
  'windowMinimize',
];

contextBridge.exposeInMainWorld('electron', {
  bridge: {
    windowMinimize() {
      ipcRenderer.send('windowMinimize');
    },
    windowMaximize() {
      ipcRenderer.send('windowMaximize');
    },
    windowClose() {
      ipcRenderer.send('windowClose');
    },
    searchForStream(search) {
      return new Promise<string>((resolve) => {
        ipcRenderer.once('searchForStream', (_e, d) => {
          resolve(d);
        });
        ipcRenderer.send('searchForStream', search);
      });
    },
    toStreamUrl(uri) {
      return new Promise<string>((resolve) => {
        ipcRenderer.once('toStreamUrl', (_e, d) => {
          resolve(d);
        });
        ipcRenderer.send('toStreamUrl', uri);
      });
    },
    // eslint-disable-next-line no-unused-vars
    on(channel, func) {
      if (validChannels.includes(channel)) {
        const subscription = (
          _event: IpcRendererEvent,
          ...args: Parameters<MusicAppIpcEvents[typeof channel]>
        ) => func(...args);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      }

      // eslint-disable-next-line no-console
      console.error('Blocked Event From Channel', channel);

      return undefined;
    },
    // eslint-disable-next-line no-unused-vars
    once(channel, func) {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
        return;
      }

      // eslint-disable-next-line no-console
      console.error('Blocked Event From Channel', channel);
    },
  },
} as { bridge: typeof window.electron.bridge });
