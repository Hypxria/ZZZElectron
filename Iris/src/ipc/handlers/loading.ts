import { ipcMain, BrowserWindow } from "electron";

export function setupLoadingHandlers(mainWindow: BrowserWindow) {
    ipcMain.handle('loading:show', (_, message = 'Loading...') => {
        mainWindow?.webContents.send('loading:update', 0, message);
        return true;
    });

    ipcMain.handle('loading:update', (_, progress, message) => {
        mainWindow?.webContents.send('loading:update', progress, message);
        return true;
    });

    ipcMain.handle('loading:hide', () => {
        mainWindow?.webContents.send('loading:update', 100, '');
        return true;
    });
}