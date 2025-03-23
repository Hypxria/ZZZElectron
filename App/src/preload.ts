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
  listenForSpotifyCallback: () => ipcRenderer.invoke('LISTEN_FOR_SPOTIFY_CALLBACK'),
  log: (message: any) => ipcRenderer.send('console-log', message),
  spotifyLink: () => ipcRenderer.invoke('spotify-link'),
});

