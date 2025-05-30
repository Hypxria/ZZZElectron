// src/main.ts
import path from 'path'
import { app, BrowserWindow, session, ipcMain, screen, nativeImage } from 'electron';
import DiscordRPC from './services/discordServices/discordRPC.ts';
import { SnapshotManager } from './utils/snapshotUtil.ts';
import { fileURLToPath } from 'url';
import fs from 'fs'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_PRELOAD_VITE_ENTRY: string;
declare const MAIN_WINDOW_VITE_NAME: string;

import { setupIpcHandlers } from './ipc/index.ts';
import { cleanupSpotifyHandlers } from './ipc/handlers/spotify.ts'

import { saveWindowState, restoreWindowState } from './utils/windowState.ts';

import Iris from './assets/icons/Iris.png'

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;
let snapshotManager: SnapshotManager | null = null;

ipcMain.setMaxListeners(20); // Or whatever number is appropriate

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up error logging to file
const logPath = path.join(app.getPath('userData'), 'iris-error.log');
console.log(`Logging to: ${logPath}`);

// Log unhandled exceptions
process.on('uncaughtException', (error) => {
  const errorMsg = `Uncaught Exception: ${error.message}\n${error.stack}\n`;
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${errorMsg}`);
  console.error(errorMsg);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const errorMsg = `Unhandled Rejection at: ${promise}, reason: ${reason}\n`;
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${errorMsg}`);
  console.error(errorMsg);
});

const cspDirectives = {
  'font-src': ["'self'"],
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:'],
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

const createWindow = async (): Promise<void> => {
  const windowState = await restoreWindowState();

  // Optimizations - keep only what's necessary for smooth operation
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-hardware-overlays');
  app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('enable-accelerated-video-decode');

  // Add these power-saving switches
  app.commandLine.appendSwitch('enable-gpu-memory-buffer-compositor-resources');
  app.commandLine.appendSwitch('enable-oop-rasterization');
  app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');

  // Keep these for WebGL support
  app.commandLine.appendSwitch('enable-webgl');
  app.commandLine.appendSwitch('enable-webgl2');

  console.log(app.getGPUFeatureStatus())

  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...windowState.bounds,
    minWidth: 500,
    minHeight: 390,
    title: 'Iris', // Add this line
    frame: false, // This removes the default window frame
    titleBarStyle: 'hidden',
    // icon: nativeImage.createFromDataURL(Iris), // Convert data URL to native image

    useContentSize: true,
    autoHideMenuBar: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, '..', 'preload', 'preload.js')
        : path.join(__dirname, '..', 'preload', 'preload.js'),
      sandbox: true,
      webgl: true,
      offscreen: false,
      backgroundThrottling: true, // Add this to prevent throttling when in background
      enablePreferredSizeMode: true,
      spellcheck: false, // Disable if you don't need it
    },
    paintWhenInitiallyHidden: true,
    show: false,
  });

  // Add this after creating the mainWindow and before loading the URL
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Check for Ctrl+W keyboard shortcut
    if (input.control && input.key.toLowerCase() === 'w') {
      console.log('Prevented Ctrl+W from closing the window');
      event.preventDefault();
    }
  });

  // Initialize snapshot manager early
  snapshotManager = new SnapshotManager();

  mainWindow.once('ready-to-show', () => {
    mainWindow?.webContents.send('loading:update', 0, 'Starting Iris...');
    mainWindow?.show();

    // Start loading process
    startLoadingProcess();
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

  setupIpcHandlers(mainWindow);

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
  console.log(__dirname)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/index.html`));
  };
  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    // mainWindow.webContents.openDevTools();
  }
};

// Function to handle the loading process with snapshot support
const startLoadingProcess = () => {
  if (!mainWindow) return;

  // Initialize snapshot manager if not already done
  if (!snapshotManager) {
    snapshotManager = new SnapshotManager();
  }

  // Try to load from snapshot first
  const snapshotLoaded = snapshotManager.loadSnapshot();
  let startProgress = snapshotLoaded ? 30 : 0; // Start at 30% if snapshot was loaded

  let progress = startProgress;
  const loadingInterval = setInterval(() => {
    // Faster progress if snapshot was loaded
    const increment = snapshotLoaded ? 15 : 10;
    progress += increment;

    mainWindow?.webContents.send('loading:update', progress,
      progress < 30 ? 'Loading resources...' :
        progress < 60 ? 'Initializing services...' :
          progress < 90 ? 'Almost ready...' : 'Ready!'
    );

    if (progress >= 100) {
      clearInterval(loadingInterval);

      // Create a new snapshot if one wasn't loaded or is outdated
      if (!snapshotLoaded) {
        // In a real implementation, you'd collect the loaded modules
        const loadedModules = ['main', 'renderer', 'preload']; // Example
        snapshotManager?.createSnapshot(loadedModules);
      }
    }
  }, snapshotLoaded ? 200 : 300); // Faster interval if snapshot was loaded
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.on('console-log', (_, message) => {
  console.log(message); // This will print to terminal
});

ipcMain.on('console-error', (_, message) => {
  console.error(message); // This will print to terminal
});

// Add IPC handlers for snapshot management
ipcMain.handle('snapshot:create', () => {
  if (snapshotManager) {
    const loadedModules = ['main', 'renderer', 'preload']; // Example
    snapshotManager.createSnapshot(loadedModules);
    return true;
  }
  return false;
});

ipcMain.handle('snapshot:delete', () => {
  if (snapshotManager) {
    snapshotManager.deleteSnapshot();
    return true;
  }
  return false;
});

ipcMain.handle('snapshot:status', () => {
  if (snapshotManager) {
    return {
      exists: snapshotManager.hasValidSnapshot(),
      info: snapshotManager.getSnapshotInfo ? snapshotManager.getSnapshotInfo() : null
    };
  }
  return { exists: false, info: null };
});

ipcMain.handle('toggle-click-through', (_, enable) => {
  if (!mainWindow) return false;
  
  if (enable) {
    // Enable click-through mode
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setFocusable(false);
  } else {
    // Disable click-through mode
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setFocusable(true);
  }
  
  return true;
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

  await createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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