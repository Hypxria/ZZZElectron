interface ElectronAPI {
    openExternal: (url: string) => Promise<void>;
    log: (message: any) => void;
    spotifyLink: () => Promise<any>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export {};
