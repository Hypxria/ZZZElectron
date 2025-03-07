// src/main.ts
import { app, BrowserWindow, session, ipcMain } from 'electron';
import * as path from 'path';
import * as http from 'http';
import { URL } from 'url';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { spotifyService } from './services/SpotifyService';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
let callbackServer: http.Server | null = null;
let dev = true
let isServerRunning = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async (): Promise<void> => {
  // Create the browser window.

  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      webSecurity: true,
    },
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "font-src 'self' https://fonts.gstatic.com;",
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';", // Make sure this line is present
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "connect-src 'self' http://localhost:8080 https://accounts.spotify.com http://127.0.0.1:8080 https://api.spotify.com;",
          "img-src 'self' data: http://localhost:8080 http://127.0.0.1:8080 https:;"
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

async function createCallbackServer(): Promise<string> {
  return new Promise((resolve, reject) => {
      // If server is already running, reject
      if (isServerRunning) {
          console.log('Server already running, skipping creation');
          return;
      }

      console.log('Creating new callback server');
      isServerRunning = true;

      // Close any existing server
      if (callbackServer) {
          callbackServer.close();
      }

      callbackServer = http.createServer((req, res) => {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const code = url.searchParams.get('code');
          
          if (code) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('Authentication successful! You can close this window.');
              resolve(code);
              
              // Close and clear the server reference
              callbackServer?.close();
              callbackServer = null;
              isServerRunning = false;
          } else {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end('Authentication failed! Please try again.');
              reject(new Error('No code received'));
              
              callbackServer?.close();
              callbackServer = null;
              isServerRunning = false;
          }
      });

      const timeout = setTimeout(() => {
          callbackServer?.close();
          callbackServer = null;
          isServerRunning = false;
          reject(new Error('Authorization timeout after 5 minutes'));
      }, 5 * 60 * 1000);

      callbackServer.on('error', (error) => {
          clearTimeout(timeout);
          callbackServer?.close();
          callbackServer = null;
          isServerRunning = false;
          reject(error);
      });

      callbackServer.listen(8080, '127.0.0.1', () => {
          console.log('Callback server listening on port 8080');
      });
  });
}




// In your main process
ipcMain.handle('LISTEN_FOR_SPOTIFY_CALLBACK', async () => {
  try {
      const code = await createCallbackServer();
      return code;
  } catch (error) {
      console.error('Error in callback server:', error);
      throw error;
  }
});



const installExtensions = async () => {
  try {
    const name = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Added Extension: ${name.name}`); // Access the name property
    } catch (err) {
    console.log('An error occurred: ', err);
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    installExtensions()
    
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (callbackServer) {
      console.log('Closing callback server...');
      callbackServer.close();
      callbackServer = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
