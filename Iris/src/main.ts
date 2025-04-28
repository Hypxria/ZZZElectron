// src/main.ts
import { app, BrowserWindow, session, ipcMain, screen } from 'electron';
import DiscordRPC from './services/discordServices/discordRPC.ts';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

import { setupIpcHandlers } from './ipc/index.ts';
import { cleanupSpotifyHandlers } from './ipc/handlers/spotify.ts'

import { saveWindowState, restoreWindowState } from './utils/windowState.ts';

let store: any;
let Store: any;

async function initializeStore() {
  if (!Store) {
      Store = (await import("electron-store")).default;
      store = new Store();
  }
  return store;
}

store = initializeStore()

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;

ipcMain.setMaxListeners(20); // Or whatever number is appropriate

type WindowEventType = 'resize' | 'move' | 'close';
const events: WindowEventType[] = ['resize', 'move', 'close'];


const cspDirectives = {
  'font-src': ["'self'"],
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'connect-src': [
    "'self'",
    'https://lrclib.net',
    'http://localhost:8080',
    'https://accounts.spotify.com',
    'https://account.hoyoverse.com/',
    'https://sg-public-api.hoyoverse.com',
    'https://sg-public-api.hoyolab.com',
    'https://huggingface.co',
    'https://cdn-lfs.hf.co',
    'https://cdn.jsdelivr.net',
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
  const windowState = await restoreWindowState();

  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-accelerated-compositing');
  app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');

  // Adding these lines to handle display-related issues
  app.commandLine.appendSwitch('disable-gpu-vsync');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');

  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...windowState.bounds,
    height: 600,
    width: 800,
    minWidth: 500,
    minHeight: 390,
    title: 'Iris', // Add this line
    frame: false, // This removes the default window frame
    titleBarStyle: 'hidden',
    icon: './assets/icons/Iris.png',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
      webgl: true,
      offscreen: false,
      backgroundThrottling: false // Add this to prevent throttling when in background
    },
  });

  mainWindow.setTitle('Iris');

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  if (windowState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }

  if (mainWindow) {
    mainWindow.on('resize', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });
  
    mainWindow.on('move', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });
  
    mainWindow.on('close', () => {
      if (mainWindow) saveWindowState(mainWindow);
    });
  }
  
  

  setupIpcHandlers(mainWindow, discordRPC);

  mainWindow.on('maximize', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('enter-full-screen', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

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

  const ensureWindowVisible = () => {
    if (!mainWindow) return;
    
    const displays = screen.getAllDisplays();
    const { bounds } = windowState;
    
    // Check if window is visible on any display
    const isVisible = displays.some(display => {
      return bounds.x >= display.bounds.x &&
             bounds.y >= display.bounds.y &&
             bounds.x + bounds.width <= display.bounds.x + display.bounds.width &&
             bounds.y + bounds.height <= display.bounds.y + display.bounds.height;
    });

    // If not visible, center on primary display
    if (!isVisible) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const x = Math.floor(primaryDisplay.bounds.x + (primaryDisplay.bounds.width - bounds.width) / 2);
      const y = Math.floor(primaryDisplay.bounds.y + (primaryDisplay.bounds.height - bounds.height) / 2);
      mainWindow.setPosition(x, y);
    }
  };

  ensureWindowVisible();

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    // mainWindow.webContents.openDevTools();
  }
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.


ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

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

