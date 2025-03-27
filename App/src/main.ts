// src/main.ts
import { app, BrowserWindow, session, ipcMain, shell } from 'electron';
import * as http from 'http';
import { URL } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import SpotifyService from './services/spotifyServices/SpotifyService';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const clients = new Set<WebSocket>();
let callbackServer: http.Server | null = null;
let isServerRunning = false;
let wss: WebSocketServer | null = null;

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

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
    },
  });

  const discordWindow = new BrowserWindow({
    show: false, // Hide if not needed
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true, // Allow Node.js APIs
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




ipcMain.on('console-log', (_, message) => {
  console.log(message); // This will print to terminal
});


app.whenReady().then(async () => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
