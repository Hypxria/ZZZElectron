interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    listenForSpotifyCallback: () => Promise<string>;
    spotifyCallback: (code) => Promise<string>;
    log: (message: any) => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {};
