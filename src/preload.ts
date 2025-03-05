// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';


contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('electronAPI', {
  saveToStore: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  getFromStore: (key: string) => ipcRenderer.invoke('store-get', key),
  deleteFromStore: (key: string) => ipcRenderer.invoke('store-delete', key),
});