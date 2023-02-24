/* eslint-disable promise/always-return */
/* eslint-disable no-console */
/* eslint-disable global-require */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import * as play from 'play-dl';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import './sqlite';

let mainWindow: BrowserWindow | null = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// let currentToken = '';

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

async function uriToStream(uri: string): Promise<string> {
  console.log('Fetching stream for uri', uri);
  const stream = await play.stream(uri);
  console.log('Stream found');
  return (stream as typeof stream & { url: string }).url;
}

ipcMain.on('searchForStream', async (ev, search) => {
  console.log(ev.target);
  console.log('Searching for stream for term', search);
  const result = await play.search(search, {
    source: {
      youtube: 'video',
    },
    limit: 1,
  });

  if (result.length) {
    console.log('Stream found, fetching url');
    ev.sender.send('searchForStream', await uriToStream(result[0].url));
    return;
  }

  console.log('Stream not found');
  ev.sender.send('searchForStream', '');
});

ipcMain.on('toStreamUrl', async (ev, uri) => {
  ev.reply(await uriToStream(uri));
});

ipcMain.on('windowMaximize', () => {
  console.log(mainWindow?.isMaximizable(), mainWindow?.isMaximized());
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('windowMinimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('windowClose', () => {
  mainWindow?.close();
});
