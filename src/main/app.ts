/* eslint-disable promise/always-return */
/* eslint-disable no-console */
/* eslint-disable global-require */
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  IApplicationSettings,
  ILoginData,
  IConvertedSystemFiles,
  IImageDownload,
  IAccountData,
  IDiscordData,
} from 'renderer/types';
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  safeStorage,
} from 'electron';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import macaddress from 'macaddress';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow | null = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

const loginDataPath = path.join(
  app.getPath('userData'),
  'loginData.wallpaperz'
);

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let devicePhysicalAddress = '';

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const SERVER_URL = isDevelopment
  ? 'http://localhost:3001'
  : 'https://wallpaperz-server.oyintare.dev';
// let currentToken = '';

let bHasIdentified = false;

const socket = io(SERVER_URL, {
  reconnectionDelayMax: 10000,
});

const pendingIdenfifyCallbacks: (() => void)[] = [];

function onIdentify(callback: () => void) {
  if (bHasIdentified) {
    callback();
  } else {
    pendingIdenfifyCallbacks.push(callback);
  }
}

function identify() {
  return new Promise<void>((resolve) => {
    socket.once('client-id', () => {
      bHasIdentified = true;
      pendingIdenfifyCallbacks.forEach((c) => c());
      resolve();
    });
    socket.emit('client-id', devicePhysicalAddress);
  });
}

socket.on('connect', () => {
  identify();
});
socket.on('disconnect', () => {
  bHasIdentified = false;
});

async function installExtensions() {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
}

async function createWindow() {
  devicePhysicalAddress = await macaddress.one();
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    /* if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } */
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
  } else {
    mainWindow.removeMenu();
  }

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

async function applySettings(settings: IApplicationSettings) {
  if (mainWindow) {
    mainWindow.setFullScreen(settings.bShouldUseFullscreen);
  }
}

// read selected images from disk
ipcMain.on(
  'upload-files',
  async (event, defaultUploadPath: string, pathsToUpload: string[]) => {
    if (pathsToUpload.length) {
      const readers: Promise<[string, number, string]>[] = [];

      // eslint-disable-next-line no-inner-declarations
      async function readFile(
        fileToLoad: string,
        index: number
      ): Promise<[string, number, string]> {
        return [
          (await fs.readFile(fileToLoad)).toString('base64'),
          index,
          path.parse(fileToLoad).name,
        ];
      }

      pathsToUpload.forEach((filePath: string, index: number) => {
        readers.push(readFile(filePath, index));
      });

      const filesLoaded = await Promise.all(readers);

      event.reply('upload-files', { result: true, files: filesLoaded });
    } else {
      dialog
        .showOpenDialog({
          title: 'Select the wallpapers to upload',
          properties: ['openFile', 'multiSelections'],
          defaultPath: defaultUploadPath,
          buttonLabel: 'Upload',
          filters: [
            {
              name: 'wallpapers',
              extensions: ['jpeg', 'png', 'jpg'],
            },
          ],
        })
        .then(async (result) => {
          if (result.canceled) {
            event.reply('upload-files', { result: false, files: [] });
          } else if (result.filePaths.length === 0) {
            event.reply('upload-files', { result: false, files: [] });
          } else {
            const readers: Promise<[string, number, string]>[] = [];

            // eslint-disable-next-line no-inner-declarations
            async function readFile(
              fileToLoad: string,
              index: number
            ): Promise<[string, number, string]> {
              return [
                (await fs.readFile(fileToLoad)).toString('base64'),
                index,
                path.parse(fileToLoad).name,
              ];
            }
            result.filePaths.forEach((filePath: string, index: number) => {
              readers.push(readFile(filePath, index));
            });

            const filesLoaded = await Promise.all(readers);

            event.reply('upload-files', { result: true, files: filesLoaded });
          }
        })
        .catch(console.log);
    }
  }
);

// read selected images from disk
ipcMain.on('save-settings', async (event, args: IApplicationSettings) => {
  applySettings(args);

  fs.writeFile(settingsPath, JSON.stringify(args, null, 3))
    .then(() => {
      event.reply('save-settings', true);
    })
    .catch(console.log);
});

ipcMain.on('load-settings', async (event) => {
  if (fsSync.existsSync(settingsPath)) {
    fs.readFile(settingsPath, 'utf8')
      .then((file: string) => {
        const settingsAsJson = JSON.parse(file) as IApplicationSettings;

        if (
          !settingsAsJson.downloadPath ||
          !fsSync.existsSync(settingsAsJson.downloadPath)
        )
          settingsAsJson.downloadPath = app.getPath('downloads');

        applySettings(settingsAsJson);
        event.reply('load-settings', settingsAsJson);
      })
      .catch(console.log);
  } else {
    const defaultSettings: IApplicationSettings = {
      downloadPath: '',
      maxItemsPerPage: 12,
      bShouldUseFullscreen: true,
      bIsLoggedIn: false,
    };

    applySettings(defaultSettings);

    fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 3))
      .then(() => {
        event.reply('load-settings', defaultSettings);
      })
      .catch(console.log);
  }
});

ipcMain.on('open-login', async (event) => {
  const params = new URLSearchParams({
    client_id: '967602114350174348',
    redirect_uri: `${SERVER_URL}/auth`,
    response_type: 'code',
    scope: 'identify',
    state: `${devicePhysicalAddress}`,
  }).toString();

  const url = `https://discord.com/api/oauth2/authorize?${params}`;

  socket.on('open-login', async (response: ILoginData) => {
    const encryptedData = safeStorage.encryptString(JSON.stringify(response));

    fs.writeFile(loginDataPath, encryptedData)
      .then(() => {
        console.log(response);
        event.reply('open-login', response);
      })
      .catch(console.log);
  });

  require('electron').shell.openExternal(url);
});

ipcMain.on('get-login', async (event) => {
  if (fsSync.existsSync(loginDataPath)) {
    const encryptedLoginData = await fs.readFile(loginDataPath);
    const decryptedLoginData = safeStorage.decryptString(encryptedLoginData);

    const loginData = JSON.parse(decryptedLoginData) as ILoginData;
    onIdentify(async () => {
      const loginFromServer = await Promise.race([
        new Promise((resolve) => {
          socket.once(
            'verify-discord',
            async (
              payload: { account: IAccountData; discord: IDiscordData } | null
            ) => {
              if (!payload) {
                if (fsSync.existsSync(loginDataPath)) {
                  await fs.unlink(loginDataPath);
                }
                resolve(undefined);
              }

              resolve(payload);
            }
          );
          socket.emit('verify-discord', loginData.discord);
        }),
        new Promise((resolve) => {
          setTimeout(resolve, 8000, undefined);
        }),
      ]);

      event.reply('get-login', loginFromServer);
    });
  } else {
    event.reply('get-login', undefined);
  }
});

ipcMain.on('update-login', async (event, newLoginData) => {
  if (newLoginData === undefined) {
    if (fsSync.existsSync(loginDataPath)) {
      await fs.unlink(loginDataPath);
    }
    event.reply('update-login');
    return;
  }
  const encryptedData = safeStorage.encryptString(JSON.stringify(newLoginData));
  await fs.writeFile(loginDataPath, encryptedData);
  event.reply('update-login');
});

ipcMain.on('logout', async (event) => {
  if (fsSync.existsSync(loginDataPath)) {
    await fs.unlink(loginDataPath);
  }
  event.reply('logout');
});

ipcMain.on(
  'upload-images',
  async (event, images: IConvertedSystemFiles[], uploader_id) => {
    const params = new URLSearchParams({
      user: devicePhysicalAddress,
      uploader: uploader_id,
    });

    const response = await axios
      .put(`${SERVER_URL}/wallpapers?${params.toString()}`, images, {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
      .catch((error) => console.log(error.message));

    if (response?.data) {
      event.reply('upload-images', response?.data);
    } else {
      event.reply('upload-images', []);
    }
  }
);

ipcMain.on('set-download-path', async (event, currentPath) => {
  const data = await dialog.showOpenDialog({
    defaultPath: currentPath,
    properties: ['openDirectory'],
  });

  if (data.canceled) {
    event.reply('set-download-path', currentPath);
    return;
  }

  event.reply('set-download-path', data.filePaths[0]);
});

ipcMain.on('download-image', async (event, image: IImageDownload) => {
  const downloadPath = path.join(
    image.dir || app.getPath('downloads'),
    `${image.id}.jpg`
  );

  fs.writeFile(downloadPath, Buffer.from(image.data))
    .then(() => {
      event.reply('download-image', true);
    })
    .catch((error: Error) => {
      event.reply('download-image', false);
      console.log(error);
    });
});

ipcMain.on('quit-app', async () => {
  try {
    app.quit();
  } catch (error) {
    console.log(error);
  }
});

ipcMain.on('is-dev', (event) => {
  event.reply('is-dev', isDevelopment);
});

ipcMain.on('get-token', (event) => {
  event.reply('get-token', 'test');
});

ipcMain.on('window-max', () => {
  console.log(mainWindow?.isMaximizable(), mainWindow?.isMaximized());
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-min', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});
