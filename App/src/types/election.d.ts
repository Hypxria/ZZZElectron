interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    spotifyLink: () => Promise<any>;
    restart: () => Promise<void>;
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
        }
        saveDiscordTokens: (tokens: any) => void;
        loadDiscordTokens: () => any;
    }
}

export { };
