interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    restart: () => Promise<void>;
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
            onData: (callback: (notification: any) => void) => void;
            removeDataListener: () => void;
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
        spotify: {
            spotifyLink: () => Promise<any>;
            spicetify: {
                installExtension: () => Promise<{
                    success: boolean;
                    message: string;
                }>;
            };

        }
        saveDiscordTokens: (tokens: any) => void;
        loadDiscordTokens: () => any;
    }
}

export { };
