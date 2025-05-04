import { BrowserWindow, Rectangle } from 'electron';
import Store from 'electron-store';

let saveTimeout: NodeJS.Timeout | null = null;

interface WindowState {
  bounds: Rectangle;
  isMaximized: boolean;
  isFullScreen: boolean;
}


export function saveWindowState(window: BrowserWindow): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    const store = new Store();
    if (!window.isMinimized() && !window.isMaximized()) {
      store.set('windowState', {
        bounds: window.getBounds(),
        isMaximized: window.isMaximized(),
        isFullScreen: window.isFullScreen()
      });
    }
    saveTimeout = null;
  }, 1000);
}

export async function restoreWindowState(): Promise<WindowState> {
  const store = new Store();
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
