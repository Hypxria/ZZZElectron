// src/main.ts
import { app, BrowserWindow, session, ipcMain, shell } from 'electron';
import fs from 'fs'
import * as http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import SpotifyService from './services/spotifyServices/SpotifyService';
import { HoyolabAuth } from './services/hoyoServices/auth';
import { HoyoManager } from './services/hoyoServices/hoyoManager';
import { LrcLibApi } from './services/spotifyServices/LrcLibService';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const clients = new Set<WebSocket>();
let isServerRunning = false;
let wss: WebSocketServer | null = null;

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;


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

const createWindow = async (): Promise<void> => {
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');

  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
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
  
  mainWindow?.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change');
  });
  
  mainWindow?.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-change');
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

function createWebSocketServer() {
  if (wss) {
    console.log('WebSocket server already running');
    return;
  }

  wss = new WebSocketServer({ port: 5001 });

  wss.on('listening', () => {
    console.log('WebSocket server is listening on port 5001');
  });

  const handleSpicetifyMessage = (message: string): Promise<any> => {
    return new Promise((resolve) => {
      // You can route different message types here
      SpotifyService.handleMessage(message)
        .then(result => resolve(result))
        .catch(error => resolve({ error: error.message }));
    });
  };

  wss.on('connection', async (ws: WebSocket) => {
    await clients.add(ws);
    console.log('New Spicetify client connected');

    ws.on('message', async (message) => {
      try {
        const messageString = message.toString();
        const messageStr = message.toString();

        clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
          }
        });

        const response = await handleSpicetifyMessage(messageString);

        // Echo back the message
        // ws.send(`Server received: ${messageString}`);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);

    });

    // Send initial connection confirmation
    ws.send('Connected to Electron WebSocket Server');
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  healthServer.listen(5001, '127.0.0.1', () => {
    console.log('Health check server listening on port 5001');
  });
}

// Utility IPC (just in case)

ipcMain.handle('open-external', async (_, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Failed to open external URL:', error);
    throw error;
  }
});

// Service IPCs


// Creating Spicetify websocket server
ipcMain.handle('spotify-link', async () => {
  await createWebSocketServer()
})

ipcMain.handle('spotify:start-link', async () => {
  try {
    await SpotifyService.startLinkWs();
    return true;
  } catch (error) {
    console.error('Failed to start Spotify link:', error);
    throw error;
  }
})

ipcMain.handle('lrc:search', async (_, params: { artist: string, track: string, album: string }) => {
  try {
    const lrcLibApi = new LrcLibApi();
    const response = await lrcLibApi.searchLyrics({
      artist: params.artist,
      track: params.track,
      album: params.album
    });
    return response;
  } catch (error) {
    console.error('Error searching lyrics:', error);
    throw error;
  }
})

ipcMain.handle('lrc:parse-lyrics', async (_, syncedLyrics: string) => {
  try {
    const lrcLibApi = new LrcLibApi();
    const response = await lrcLibApi.parseSyncedLyrics(syncedLyrics);
    return response;
  } catch (error) {
    console.error('Error parsing lyrics:', error);
    throw error;
  }
})


import DiscordRPC from './services/discordServices/discordRPC';
import { exec } from 'child_process';
import path from 'path';

ipcMain.handle('discord:connect', async (_, id, secret) => {
  try {
    const client_id = id
    const client_secret = secret
    console.log(client_id, client_secret)
    discordRPC = new DiscordRPC(String(client_id), String(client_secret));
    await discordRPC.connect();

    // Forward notifications to renderer
    discordRPC.on('data', (data) => {
      mainWindow?.webContents.send('discord:notification', data);
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to connect to Discord:', error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('discord:disconnect', async () => {
  try {
    if (discordRPC) {
      // Assuming your DiscordRPC class has these methods
      discordRPC.removeAllListeners('notification');
      await discordRPC.disconnect();
      discordRPC = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect from Discord:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('discord:revoke', async () => {
  try {
    if (discordRPC) {
      await discordRPC.revokeAllTokens();
      return { success: true };
    } else {
      return { success: false, error: 'DiscordRPC instance not initialized' };
    }
  } catch (error) {
    console.error('Failed to revoke tokens:', error);
    return { success: false, error: error.message };
  }
})

ipcMain.handle('restart-app', async () => {
  // Perform cleanup
  if (wss) {
    console.log('Closing WebSocket server...');
    wss.close(() => {
      console.log('WebSocket server closed');
      wss = null;
    });
  }
  if (discordRPC) {
    await discordRPC.disconnect();
    discordRPC = null;
  }

  // Then restart
  app.relaunch();
  app.exit(0);
});

// Hoyo IPC
ipcMain.handle('hoyo:login', async (event, username, password) => {
  try {
    const auth = new HoyolabAuth();
    const result = await auth.login(username, password);
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
});

ipcMain.handle('hoyo:getSToken', async (event, username, password) => {
  try {
    const auth = new HoyolabAuth();
    const result = await auth.getSToken(username, password);
    return result;
  } catch (error) {
    console.error('getSToken error:', error);
    throw error;
  }
});

let hoyoManager: HoyoManager | null = null;

let cookieString: string
let uid: string

ipcMain.handle('hoyo:initialize', async (_, cookie, user_id) => {
  cookieString = cookie
  uid = user_id
  hoyoManager = new HoyoManager(cookieString, uid);
  await hoyoManager.initialize();
  return true;
});

ipcMain.handle('hoyo:callMethod', async (_, className: string, methodName: string, ...args: any[]) => {
  try {
    if (!hoyoManager) {
      // Initialize if not exists
      console.log('Init first please')
      return;
    }

    // Handle nested class calls (like starrail.getInfo())
    if (className.includes('.')) {
      const [parentClass, childMethod] = className.split('.');
      return await hoyoManager[parentClass][childMethod](...args);
    }


    // Direct method calls
    console.log(`${className}.${methodName}, args`)
    return await hoyoManager[methodName](...args);
  } catch (error) {
    console.error('Error calling HoyoManager method:', error);
    throw error;
  }
});

// Custom Titlebar handlers
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-unmaximize', () => {
  mainWindow?.unmaximize();
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
        const isFullScreen = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFullScreen);
        return !isFullScreen;
    }
    return false;
});

ipcMain.handle('window-is-fullscreen', () => {
  return mainWindow?.isFullScreen();
});

const getAssetPath = () => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(app.getAppPath(), 'src', 'assets', 'extension', 'zzz-electron-link.js');
  }
  // In production, assets are typically in a different location
  return path.join(process.resourcesPath, 'assets', 'extension', 'zzz-electron-link.js');
};

// Spicetify Extention Installer
ipcMain.handle('install-spicetify-extension', async () => {
  try {
    if (process.platform !== 'win32') {
      throw new Error('This feature is only available on Windows');
    }

    const appDataPath = app.getPath('appData');
    const extensionsPath = path.join(appDataPath, 'spicetify', 'Extensions');
    const extensionFile = 'zzz-electron-link.js';
    const extensionDestPath = path.join(extensionsPath, extensionFile);
    
    // Get the source path from our assets
    const sourcePath = getAssetPath();

    console.log('Source path:', sourcePath);
    console.log('Destination path:', extensionDestPath);

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Extension file not found at: ${sourcePath}`);
    }

    // Create Extensions directory if it doesn't exist
    if (!fs.existsSync(extensionsPath)) {
      await fs.promises.mkdir(extensionsPath, { recursive: true });
    }

    // Copy the extension file
    await fs.promises.copyFile(sourcePath, extensionDestPath);

    // Run spicetify apply
    await new Promise((resolve, reject) => {
      exec('spicetify apply', (error, stdout, stderr) => {
        if (error) {
          console.error('Error running spicetify apply:', error);
          reject(error);
        } else {
          console.log('Spicetify apply output:', stdout);
          resolve(stdout);
        }
      });
    });

    return { success: true, message: 'Extension installed successfully!' };
  } catch (error) {
    console.error('Installation error:', error);
    return { 
      success: false, 
      message: `Installation failed: ${error.message}` 
    };
  }
});


ipcMain.on('console-log', (_, message) => {
  console.log(message); // This will print to terminal
});


app.whenReady().then(async () => {
  app.on('gpu-info-update', () => {
    const gpuInfo = app.getGPUInfo('basic');
    console.log('GPU Info:', gpuInfo);
  });
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async () => {
  if (wss) {
    console.log('Closing WebSocket server...');
    wss.close(() => {
      console.log('WebSocket server closed');
      wss = null;
    });
  }
  if (discordRPC) {
    await discordRPC.disconnect();
    discordRPC = null;
  }
});

// Add this to handle development hot reloads
if (process.env.NODE_ENV === 'development') {
  app.on('window-all-closed', async () => {
    if (process.platform !== 'darwin') {
      if (wss) {
        wss.clients.forEach(client => {
          client.terminate();
        });
        wss.close();
        wss = null;
      }
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

