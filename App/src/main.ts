// src/main.ts
import { app, BrowserWindow, session, ipcMain, shell } from 'electron';
import * as http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import SpotifyService from './services/spotifyServices/SpotifyService';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const clients = new Set<WebSocket>();
let callbackServer: http.Server | null = null;
let isServerRunning = false;
let wss: WebSocketServer | null = null;

let mainWindow: BrowserWindow | null = null;
let discordRPC: DiscordRPC | null = null;

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
    },
  });

  

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "font-src 'self';",
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';", // Make sure this line is present
          "style-src 'self' 'unsafe-inline';",
          "connect-src 'self' https://lrclib.net http://localhost:8080 https://accounts.spotify.com ws://127.0.0.1:5000 ws://127.0.0.1:5001 ws://localhost:5000 ws://localhost:5001;",
          "img-src 'self' data: https:;"
        ].join(' ')
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

ipcMain.handle('spotify-link', async () => {
  await createWebSocketServer()
})

ipcMain.handle('open-external', async (_, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Failed to open external URL:', error);
    throw error;
  }
});

import DiscordRPC from './services/discordServices/discordRPC';


ipcMain.handle('discord:connect', async (_, id, secret) => {
  try {
      const client_id = id
      const client_secret = secret
      console.log(client_id, client_secret)
      discordRPC = new DiscordRPC(String(client_id), String(client_secret));
      await discordRPC.connect();
      
      // Forward notifications to renderer
      discordRPC.on('notification', (notification) => {
          console.log('Notification received:', notification);
          mainWindow?.webContents.send('discord:notification', notification);
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
  if (callbackServer) {
    console.log('Closing callback server...');
    callbackServer.close();
    callbackServer = null;
  }
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




ipcMain.on('console-log', (_, message) => {
  console.log(message); // This will print to terminal
});


app.whenReady().then(async () => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', async () => {
  if (callbackServer) {
    console.log('Closing callback server...');
    callbackServer.close();
    callbackServer = null;
  }
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

