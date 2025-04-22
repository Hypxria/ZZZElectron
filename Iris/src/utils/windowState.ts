import { BrowserWindow, Rectangle } from 'electron';

let store: any;
let Store: any;

interface WindowState {
  bounds: Rectangle;
  isMaximized: boolean;
  isFullScreen: boolean;
}

async function initializeStore() {
    if (!Store) {
        Store = (await import("electron-store")).default;
        store = new Store();
    }
    return store;
}

export function saveWindowState(window: BrowserWindow): void {
  const store = new Store();
  if (!window.isMinimized() && !window.isMaximized()) {
    store.set('windowState', {
      bounds: window.getBounds(),
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen()
    });
  }
}

export async function restoreWindowState(): Promise<WindowState> {
  const store = await initializeStore();
  const defaultState: WindowState = {
    bounds: {
      width: 800,
      height: 600,
      x: 0,
      y: 0
    },
    isMaximized: false,
    isFullScreen: false
  };

  try {
    return store.get('windowState', defaultState) as WindowState;
  } catch (err) {
    return defaultState;
  }
}
