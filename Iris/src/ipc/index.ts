import { BrowserWindow } from 'electron';
import { setupWindowHandlers } from './handlers/window.ts';
import { setupDiscordHandlers } from './handlers/discord.ts';
import { setupSpotifyHandlers } from './handlers/spotify.ts';
import { setupHoyoHandlers } from './handlers/hoyo.ts';
import { setupSpicetifyHandlers } from './handlers/spicetify.ts';
import { setupHoyoAuthHandlers } from './handlers/hoyoAuth.ts';
import { setupLoadingHandlers } from './handlers/loading.ts';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
    setupWindowHandlers(mainWindow);
    setupDiscordHandlers(mainWindow);
    setupSpotifyHandlers();
    setupHoyoHandlers();
    setupSpicetifyHandlers();
    setupHoyoAuthHandlers();
    setupLoadingHandlers(mainWindow);
}