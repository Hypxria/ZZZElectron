// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// src/preload.ts
import { subscribe, unsubscribe } from 'diagnostics_channel';
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

contextBridge.exposeInMainWorld('spotify', {
  spicetify: {
    installExtension: () => ipcRenderer.invoke('install-spicetify-extension')
  },
  spotifyLink: () => ipcRenderer.invoke('spotify-link'),
});

contextBridge.exposeInMainWorld('discord', {
  connect: (id: string, secret: string) => ipcRenderer.invoke('discord:connect', id, secret),
  disconnect: () => ipcRenderer.invoke('discord:disconnect'),
  onData: (callback: (notification: any) => void) => {
    ipcRenderer.on('discord:data', (_, notification) => callback(notification));
  },
  removeDataListener: () => {
    ipcRenderer.removeAllListeners('discord:data');
  },
  subscribe: (event: string, args?: any) => ipcRenderer.invoke('discord:subscribe', event, args),
  unsubscribe: (event: string, args?: any) => ipcRenderer.invoke('discord:unsubscribe', event, args),
  revokeAllTokens: () => ipcRenderer.invoke('discord:revoke'),
  selectTextChannel: (channel_id:string) => ipcRenderer.invoke('discord:text', { action: 'selectTextChannel'}, { channel_id } ),
  voice: {
    mute: () => ipcRenderer.invoke('discord:voice', { action: 'mute' }),
    unmute: () => ipcRenderer.invoke('discord:voice', { action: 'unmute' }),
    deafen: () => ipcRenderer.invoke('discord:voice', { action: 'deafen' }),
    undeafen: () => ipcRenderer.invoke('discord:voice', { action: 'undeafen' }),
    leave: () => ipcRenderer.invoke('discord:voice', { action: 'leave' }),
    join: (channel_id: string) => ipcRenderer.invoke('discord:voice',
      { action: 'join' },
      { channel_id }
    ),
    getVoiceChannel: () => ipcRenderer.invoke('discord:voice', { action: 'getVoiceChannel' }),
    getVoiceSettings: () => ipcRenderer.invoke('discord:voice', { action: 'getVoiceSettings' }),
  }
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

contextBridge.exposeInMainWorld('lrc', {
  parseSyncedLyrics: (lyrics: string) => ipcRenderer.invoke('lrc:parse-lyrics', lyrics),
  searchLyrics: (params: any) => ipcRenderer.invoke('lrc:search', params)
})

