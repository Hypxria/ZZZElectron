import { Client, GatewayIntentBits } from 'discord.js';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';



// Create Discord client with necessary intents
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ] 
});

dotenv.config();
const wss = new WebSocket.Server({ port: 8080 });

// Check if bot token exists
if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('No bot token found in environment variables!');
    process.exit(1);
}

// Login the bot
client.login(process.env.DISCORD_BOT_TOKEN);

// Track when bot is ready
client.once('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${client.user.tag}`);
});

// Error handling
client.on('error', error => {
    console.error('Discord WebSocket Error:', error);
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    let userId = process.env.UID;
    // Send initial status
    client.guilds.cache.forEach(guild => {
        // Try to fetch the member
        guild.members.fetch(userId)
            .then(member => {
                const status = member.presence?.status || 'offline';
                console.log("First status:", status);
                ws.send(JSON.stringify({ 
                    status: status,
                    activity: member.presence?.activities || null
                }));
            }
        )
    })
    // PRESENCE EXAMPLE
    /* 
    Presence {
        userId: '328275328373882880',
        guild: <ref *1> Guild {
            id: '1279838076633354391',
            name: "hyperiya :3's server",
            icon: null,
            features: [],
            commands: GuildApplicationCommandManager {
            permissions: [ApplicationCommandPermissionsManager],
            guild: [Circular *1]
            },
            members: GuildMemberManager { guild: [Circular *1] },
            channels: GuildChannelManager { guild: [Circular *1] },
            bans: GuildBanManager { guild: [Circular *1] },
            roles: RoleManager { guild: [Circular *1] },
            presences: PresenceManager {},
            voiceStates: VoiceStateManager { guild: [Circular *1] },
            stageInstances: StageInstanceManager { guild: [Circular *1] },
            invites: GuildInviteManager { guild: [Circular *1] },
            scheduledEvents: GuildScheduledEventManager { guild: [Circular *1] },
            autoModerationRules: AutoModerationRuleManager { guild: [Circular *1] },
            available: true,
            shardId: 0,
            splash: null,
            banner: null,
            description: null,
            verificationLevel: 0,
            vanityURLCode: null,
            nsfwLevel: 0,
            premiumSubscriptionCount: 0,
            discoverySplash: null,
            memberCount: 4,
            large: false,
            premiumProgressBarEnabled: false,
            applicationId: null,
            afkTimeout: 300,
            afkChannelId: null,
            systemChannelId: '1279838078340562986',
            premiumTier: 0,
            widgetEnabled: null,
            widgetChannelId: null,
            explicitContentFilter: 0,
            mfaLevel: 0,
            joinedTimestamp: 1738879776749,
            defaultMessageNotifications: 0,
            systemChannelFlags: SystemChannelFlagsBitField { bitfield: 0 },
            maximumMembers: 500000,
            maximumPresences: null,
            maxVideoChannelUsers: 25,
            maxStageVideoChannelUsers: 50,
            approximateMemberCount: null,
            approximatePresenceCount: null,
            vanityURLUses: null,
            rulesChannelId: null,
            publicUpdatesChannelId: null,
            preferredLocale: 'en-US',
            safetyAlertsChannelId: null,
            ownerId: '328275328373882880',
            emojis: GuildEmojiManager { guild: [Circular *1] },
            stickers: GuildStickerManager { guild: [Circular *1] }
        },
        status: 'dnd',
        activities: [],
        clientStatus: { desktop: 'dnd' }
        }
     */
    // Update WebSocket clients when presence changes
    client.on('presenceUpdate', (oldPresence, newPresence) => {
        const MY_USER_ID = process.env.UID;
        if (newPresence?.user?.id === MY_USER_ID) {
            if (oldPresence?.status !== newPresence?.status) {
                console.log(newPresence)
                ws.send(JSON.stringify({ 
                    status: newPresence.status || 'offline',
                    activity: newPresence.activities[0]?.state || null
                }));
            }
        }
    });
});

