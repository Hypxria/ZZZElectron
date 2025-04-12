// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// src/preload.ts
import { contextBridge, shell, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('electron', {
  restart: () => ipcRenderer.invoke('restart-app'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  log: (message: any) => ipcRenderer.send('console-log', message),
  spotifyLink: () => ipcRenderer.invoke('spotify-link'),
  onNotification: (callback: (notification: any) => void) => {
    ipcRenderer.on('discord-notification', (_, notification) => {
      callback(notification);
    });
  },
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isFullScreen: () => ipcRenderer.invoke('window-is-fullscreen'),
    onFullScreen: (callback: () => void) => ipcRenderer.on('fullscreen-change', callback),
    removeFullScreenListener: () => ipcRenderer.removeAllListeners('fullscreen-change'),
    fullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),

  },
});

contextBridge.exposeInMainWorld('discord', {
  connect: (id:string, secret:string) => ipcRenderer.invoke('discord:connect', id, secret),
  disconnect: () => ipcRenderer.invoke('discord:disconnect'),
  onNotification: (callback: (notification: any) => void) => {
      ipcRenderer.on('discord:notification', (_, notification) => callback(notification));
  },
  removeNotificationListener: () => {
      ipcRenderer.removeAllListeners('discord:notification');
  },
  revokeAllTokens: () => ipcRenderer.invoke('discord:revoke')
});


contextBridge.exposeInMainWorld('hoyoAPI', {
  login: async (username: string, password: string) => {
      return await ipcRenderer.invoke('hoyo:login', username, password);
  },
  getSToken: async (username: string, password: string) => {
      return await ipcRenderer.invoke('hoyo:getSToken', username, password);
  },
  callMethod: async (className: string, methodName: string, ...args: any[]) => {
    return await ipcRenderer.invoke('hoyo:callMethod', className, methodName, ...args);
  },
  initialize: async (cookie: string, user_id: string) => {
    return await ipcRenderer.invoke('hoyo:initialize', cookie, user_id);
  },
});
// In preload.ts



contextBridge.exposeInMainWorld('lrc', {
  parseSyncedLyrics: (lyrics: string) => ipcRenderer.invoke('lrc:parse-lyrics', lyrics),
  searchLyrics: (params: any) => ipcRenderer.invoke('lrc:search', params)
})

