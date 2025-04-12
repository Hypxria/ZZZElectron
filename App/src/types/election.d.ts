interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    spotifyLink: () => Promise<any>;
    restart: () => Promise<void>;
    window: {
        isFullScreen(): any;
        onFullScreen(handleFullscreenChange: () => void): unknown;
        removeFullScreenListener(): unknown;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        close: () => Promise<void>;
        fullscreen: () => Promise<void>;
    };
}

declare global {
    interface Window {
        electron: ElectronAPI;
        discord: {
            revokeAllTokens: () => Promise<void>; // Add this line
            connect: (id, secret) => Promise<{ success: boolean; error?: string }>;
            disconnect: () => Promise<void>;
            onNotification: (callback: (notification: any) => void) => void;
            removeNotificationListener: () => void;
        };
        lrc: {
            parseSyncedLyrics: (lyrics: string) => Promise<any>;
            searchLyrics: (params: any) => Promise<any>;
        };
        hoyoAPI: {
            login: (username: string, password: string) => Promise<any>;
            getSToken: (username: string, password: string) => Promise<string>;
            initialize: (cookies:any, uid:string) => Promise<void>;
            callMethod: ( className: string, methodName: string, ...args: any[] ) => Promise<any>;
        };
        saveDiscordTokens: (tokens: any) => void;
        loadDiscordTokens: () => any;
    }
}

export { };
