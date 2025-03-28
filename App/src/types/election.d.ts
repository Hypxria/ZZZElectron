interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    spotifyLink: () => Promise<any>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
        discord: {
            connect: (id, secret) => Promise<{ success: boolean; error?: string }>;
            disconnect: () => Promise<void>;
            onNotification: (callback: (notification: any) => void) => void;
            removeNotificationListener: () => void;
        }
        saveDiscordTokens: (tokens: any) => void;
        loadDiscordTokens: () => any;
    }
}

export { };
