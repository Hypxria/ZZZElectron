interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    listenForSpotifyCallback: () => Promise<string>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {};
