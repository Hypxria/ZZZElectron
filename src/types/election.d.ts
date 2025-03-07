interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    listenForSpotifyCallback: () => Promise<string>;
    spotifyCallback: (code) => Promise<string>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {};
