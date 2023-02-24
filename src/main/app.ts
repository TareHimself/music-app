import { app, BrowserWindow, ipcMain } from 'electron';
import * as play from 'play-dl';
import { ILocalPlaylist } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { tCreatePlaylists, getPlaylists } from './sqlite'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            nodeIntegration: true,
            webSecurity: false
        },

    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('getPreloadPath', (e) => {
    e.returnValue = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;
});

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

ipcMain.on('getLocalAlbums', () => {
    console.log("Not Implemented")
});

ipcMain.on('getLocalPlaylists', (ev) => {
    console.log("Getting local playlists")
    ev.sender.send('getLocalPlaylists', getPlaylists())
});

ipcMain.on('createPlaylist', (ev, name, position) => {
    const newPlaylist: ILocalPlaylist = {
        id: `local:${uuidv4().toString().replaceAll('-', '')}`,
        title: name,
        cover: 'https://i.scdn.co/image/ab67616d0000b273684d81c9356531f2a456b1c1',
        position: position
    }

    tCreatePlaylists.deferred([newPlaylist]);

    ev.sender.send('createPlaylist', newPlaylist)
});

ipcMain.on('getLocalTracks', () => {
    console.log("Not Implemented")
});