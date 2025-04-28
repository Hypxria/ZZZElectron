import { BrowserWindow } from 'electron';
import { setupWindowHandlers } from './handlers/window.ts';
import { setupDiscordHandlers } from './handlers/discord.ts';
import { setupSpotifyHandlers } from './handlers/spotify.ts';
import { setupHoyoHandlers } from './handlers/hoyo.ts';
import { setupSpicetifyHandlers } from './handlers/spicetify.ts';
import { setupHoyoAuthHandlers } from './handlers/hoyoAuth.ts';
import DiscordRPC from '../services/discordServices/discordRPC.ts';

export function setupIpcHandlers(mainWindow: BrowserWindow, discordRPC: DiscordRPC | null) {
    setupWindowHandlers(mainWindow);
    setupDiscordHandlers(mainWindow, discordRPC);
    setupSpotifyHandlers();
    setupHoyoHandlers();
    setupSpicetifyHandlers();
    setupHoyoAuthHandlers();
}