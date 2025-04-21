// src/main.ts
import { app, BrowserWindow, session, ipcMain, screen } from 'electron';
import DiscordRPC from './services/discordServices/discordRPC';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

import { setupIpcHandlers } from './ipc';
import { cleanupSpotifyHandlers } from './ipc/handlers/spotify'

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;

ipcMain.setMaxListeners(20); // Or whatever number is appropriate

const cspDirectives = {
  'font-src': ["'self'"],
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'connect-src': [
    "'self'",
    'https://lrclib.net',
    'http://localhost:8080',
    'https://accounts.spotify.com',
    'https://account.hoyoverse.com/',
    'https://sg-public-api.hoyoverse.com',
    'https://sg-public-api.hoyolab.com',
    'ws://127.0.0.1:5000',
    'ws://127.0.0.1:5001',
    'ws://localhost:5000',
    'ws://localhost:5001',
  ],
  'img-src': ["'self'", 'data:', 'https:']
};

const buildCsp = (directives: Record<string, string[]>) => {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')};`)
    .join(' ');
};

const createWindow = async (x: number, y: number): Promise<void> => {
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');

  // Adding these lines to handle display-related issues
  app.commandLine.appendSwitch('disable-gpu-vsync');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    title: 'Iris', // Add this line
    frame: false, // This removes the default window frame
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
      webgl: true,
      offscreen: false,
    },
  });

  mainWindow.setTitle('Iris');

  setupIpcHandlers(mainWindow, discordRPC);

  mainWindow?.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change');
  });

  mainWindow?.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change');
  });

  screen.on('display-metrics-changed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('display-metrics-changed');
    }
  });

  mainWindow.webContents.setFrameRate(60); // Set desired frame rate

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [buildCsp(cspDirectives)]
      }
    });
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

ipcMain.on('console-log', (_, message) => {
  console.log(message); // This will print to terminal
});


app.whenReady().then(async () => {
  app.on('gpu-info-update', () => {
    const gpuInfo = app.getGPUInfo('basic');
    console.log('GPU Info:', gpuInfo);
  });

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  displays.sort((a, b) => {
    // Sort first by x position, then by y position
    if (a.bounds.x !== b.bounds.x) {
      return a.bounds.x - b.bounds.x;
    }
    return a.bounds.y - b.bounds.y;
  });

  const x = primaryDisplay.bounds.x + (primaryDisplay.bounds.width - 800) / 2;
  const y = primaryDisplay.bounds.y + (primaryDisplay.bounds.height - 600) / 2;


  createWindow(x, y);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(x, y);
  });
});

app.on('before-quit', async () => {
  await cleanupSpotifyHandlers();
  if (discordRPC) {
    await discordRPC.disconnect();
    discordRPC = null;
  }
});

// Add this to handle development hot reloads
if (process.env.NODE_ENV === 'development') {
  app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
      await cleanupSpotifyHandlers();

      if (discordRPC) {
        await discordRPC.disconnect();
        discordRPC = null;
      }
      // Force kill any remaining connections
      setTimeout(() => {
        app.quit();
      }, 100);
    }
  });
}

