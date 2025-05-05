// src/main.ts
import { app, BrowserWindow, session, ipcMain, screen } from 'electron';
import DiscordRPC from './services/discordServices/discordRPC.ts';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

import { setupIpcHandlers } from './ipc/index.ts';
import { cleanupSpotifyHandlers } from './ipc/handlers/spotify.ts'

import { saveWindowState, restoreWindowState } from './utils/windowState.ts';

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;

ipcMain.setMaxListeners(20); // Or whatever number is appropriate

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

const createWindow = async (x: number, y: number): Promise<void> => {
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

  // Create the browser window.
  mainWindow = new BrowserWindow({
    ...windowState.bounds,
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
      backgroundThrottling: true, // Add this to prevent throttling when in background
      enablePreferredSizeMode: true,
    },
    paintWhenInitiallyHidden: true,
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.webContents.send('loading:update', 0, 'Starting Iris...');
    mainWindow?.show();
    
    // Simulate loading process (replace with actual initialization tasks)
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += 10;
      mainWindow?.webContents.send('loading:update', progress, 
        progress < 30 ? 'Loading resources...' :
        progress < 60 ? 'Initializing services...' :
        progress < 90 ? 'Almost ready...' : 'Ready!'
      );
      
      if (progress >= 100) {
        clearInterval(loadingInterval);
      }
    }, 300);
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

ipcMain.on('console-error', (_, message) => {
  console.error(message); // This will print to terminal
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

