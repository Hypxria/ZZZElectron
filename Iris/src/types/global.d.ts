// src/types/global.d.ts

interface Window {
  electron: {
    restart: () => Promise<void>;
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    getAppPath: () => Promise<string>;
    deviceName: () => Promise<string>;
    onNotification: (callback: (notification: any) => void) => void;
    window: {
      windowTitle: (title: string) => Promise<void>;
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      unmaximize: () => Promise<void>;
      close: () => Promise<void>;
      isFullScreen: () => Promise<boolean>;
      onFullScreen: (callback: () => void) => void;
      removeFullScreenListener: () => void;
      fullscreen: () => Promise<void>;
    };
  };
  
  snapshot: {
    create: () => Promise<boolean>;
    delete: () => Promise<boolean>;
    getStatus: () => Promise<{
      exists: boolean;
      info: {
        version: string;
        timestamp: number;
        modules: string[];
      } | null;
    }>;
  };
  
  spotify: {
    spicetify: {
      installExtension: () => Promise<void>;
    };
    spotifyLink: () => Promise<void>;
  };
  
  discord: {
    connect: (id: string, secret: string) => Promise<void>;
    disconnect: () => Promise<void>;
    onData: (callback: (data: any) => void) => void;
    removeDataListener: () => void;
    subscribe: (event: string, args?: any) => Promise<void>;
    unsubscribe: (event: string, args?: any) => Promise<void>;
    revokeAllTokens: () => Promise<void>;
    selectTextChannel: (channel_id: string) => Promise<void>;
    voice: {
      mute: () => Promise<void>;
      unmute: () => Promise<void>;
      deafen: () => Promise<void>;
      undeafen: () => Promise<void>;
      leave: () => Promise<void>;
      join: (channel_id: string) => Promise<void>;
      getVoiceChannel: () => Promise<void>;
      getVoiceSettings: () => Promise<void>;
    };
  };
  
  hoyoAPI: {
    login: (username: string, password: string) => Promise<any>;
    getSToken: (username: string, password: string) => Promise<any>;
    callMethod: (className: string, methodName: string, ...args: any[]) => Promise<any>;
    initialize: (cookie: string, user_id: string) => Promise<any>;
  };
  
  lrc: {
    parseSyncedLyrics: (lyrics: string) => Promise<any>;
    searchLyrics: (params: any) => Promise<any>;
  };
  
  loading: {
    showLoading: (message?: string) => Promise<void>;
    updateLoading: (progress: number, message?: string) => Promise<void>;
    hideLoading: () => Promise<void>;
    onLoadingUpdate: (callback: (progress: number, message: string) => void) => () => void;
  };
  
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
  };
}