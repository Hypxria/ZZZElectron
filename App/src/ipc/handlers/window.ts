import { BrowserWindow, ipcMain } from 'electron';

export function setupWindowHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('window-title', (_, newTitle: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle(newTitle);
    }
  });
  
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
}