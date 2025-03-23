interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    listenForSpotifyCallback: () => Promise<string>;
    spotifyCallback: (code) => Promise<string>;
    log: (message: any) => void;
    spotifyLink: () => Promise<any>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {};
