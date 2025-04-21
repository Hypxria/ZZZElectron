import { BrowserWindow } from 'electron';
import { setupWindowHandlers } from './handlers/window';
import { setupDiscordHandlers } from './handlers/discord';
import { setupSpotifyHandlers } from './handlers/spotify';
import { setupHoyoHandlers } from './handlers/hoyo';
import { setupSpicetifyHandlers } from './handlers/spicetify';
import { setupHoyoAuthHandlers } from './handlers/hoyoAuth';
import DiscordRPC from '../services/discordServices/discordRPC';

export function setupIpcHandlers(mainWindow: BrowserWindow, discordRPC: DiscordRPC | null) {
    setupWindowHandlers(mainWindow);
    setupDiscordHandlers(mainWindow, discordRPC);
    setupSpotifyHandlers();
    setupHoyoHandlers();
    setupSpicetifyHandlers();
    setupHoyoAuthHandlers();
}