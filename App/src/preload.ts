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
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  log: (message: any) => ipcRenderer.send('console-log', message),
  spotifyLink: () => ipcRenderer.invoke('spotify-link'),
  onNotification: (callback: (notification: any) => void) => {
    ipcRenderer.on('discord-notification', (_, notification) => {
      callback(notification);
    });
  },
  saveDiscordTokens: (tokens: any) => {
    localStorage.setItem('discord-tokens', JSON.stringify(tokens));
  },
  loadDiscordTokens: () => {
    const tokens = localStorage.getItem('discord-tokens');
    return tokens ? JSON.parse(tokens) : null;
  },
});

contextBridge.exposeInMainWorld('discord', {
  connect: () => ipcRenderer.invoke('discord:connect'),
  disconnect: () => ipcRenderer.invoke('discord:disconnect'),
  onNotification: (callback: (notification: any) => void) => {
    ipcRenderer.on('discord:notification', (_, notification) => callback(notification));
  },
  removeNotificationListener: () => {
    ipcRenderer.removeAllListeners('discord:notification');
  }
});

// Handle IPC messages
ipcRenderer.on('save-discord-tokens', (_event, tokens) => {
  localStorage.setItem('discord-tokens', JSON.stringify(tokens));
});

// Handle IPC invocations
ipcRenderer.on('load-discord-tokens', () => {
  const tokens = localStorage.getItem('discord-tokens');
  return tokens ? JSON.parse(tokens) : null;
});