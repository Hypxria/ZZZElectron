interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    restart: () => Promise<void>;
    getAppPath: () => Promise<string>;
    deviceName: () => Promise<string>;
    platform: {
        isWindows: () => Promise<boolean>;
    };
    path: {
        getAppDataPath: () => Promise<string>;
    };
    fs: {
        exists: (path: string) => Promise<boolean>;
        mkdir: (path: string) => Promise<void>;
        copyFile: (src: string, dest: string) => Promise<void>;
    };
    exec: (command: string) => Promise<string>;
    window: {
        windowTitle: (title: string) => Promise<void>;
        isFullScreen(): any;
        onFullScreen(handleFullscreenChange: () => void): unknown;
        removeFullScreenListener(): unknown;
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        toggleClickThrough: (newState) => Promise<any>;

        close: () => Promise<void>;
        fullscreen: () => Promise<void>;
    };
}

interface DiscordAPI {
    revokeAllTokens: () => Promise<void>; // Add this line
    connect: (id: string, secret: string) => Promise<{ success: boolean; error?: string }>;
    subscribe: (event: string, args?: any) => Promise<any>;
    unsubscribe: (event: string, args?: any) => Promise<void>;
    disconnect: () => Promise<void>;
    onData: (callback: (notification: any) => void) => void;
    removeDataListener: () => void;
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
    }
}

interface SpotifyAPI {
    spotifyLink: () => Promise<any>;
    spicetify: {
        installExtension: () => Promise<{
            success: boolean;
            message: string;
        }>;
    };
}


declare global {
    interface Window {
        electron: ElectronAPI;
        discord: DiscordAPI;
        loading: {
            showLoading: (message?: string) => Promise<boolean>;
            updateLoading: (progress: number, message?: string) => Promise<boolean>;
            hideLoading: () => Promise<boolean>;
            onLoadingUpdate: (callback: (progress: number, message: string) => void) => (() => void) | undefined;
        };
        lrc: {
            parseSyncedLyrics: (lyrics: string) => Promise<any>;
            searchLyrics: (params: any) => Promise<any>;
        };
        hoyoAPI: {
            login: (username: string, password: string) => Promise<any>;
            getSToken: (username: string, password: string) => Promise<string>;
            initialize: (cookies: any, uid: string) => Promise<void>;
            callMethod: (className: string, methodName: string, ...args: any[]) => Promise<any>;
        };
        spotify: SpotifyAPI
        saveDiscordTokens: (tokens: any) => void;
        loadDiscordTokens: () => any;
    }
}

export { };
