import { Client, Subscription, User } from 'discord-rpc';
import { EventEmitter } from 'events';
import { DiscordNotificationType } from './types';

// import dotenv from 'dotenv';
// dotenv.config();



class discordService extends EventEmitter {
    private readonly clientId = '';
    private readonly clientSecret = '';
    private readonly scopes = ['rpc', 'messages.read', 'rpc.notifications.read'];

    private client: Client;

    public test = ''

    constructor() {
        super();
        this.client = new Client({ transport: 'ipc' });
        console.log('DiscordService constructed');
    }


    private async subscribe() {
        this.client.subscribe('NOTIFICATION_CREATE', ({ data }: any) => {
            console.log('(sub)New Discord Notification:', data);
        });


    }

    private async listen() {
        this.client.on('NOTIFICATION_CREATE', ({ data, ...rest }: DiscordNotificationType) => {
            /*
            Response example
            (on)New Discord Notification: {
                channel_id: '1354222328267149373',
                message: {
                    id: '1354792738591346739',
                    content: 'o',
                    content_parsed: [ [Object] ],
                    nick: 'Eleuthia',
                    timestamp: '2025-03-27T12:22:39.712000+00:00',
                    tts: false,
                    mentions: [],
                    mention_roles: [],
                    embeds: [],
                    attachments: [],
                    author: {
                    id: '1250111229582643232',
                    username: 'femboyeleuthia',
                    discriminator: '0',
                    global_name: 'Eleuthia',
                    avatar: '8ff6e5631d4588748ba11b1611d84223',
                    avatar_decoration_data: null,
                    bot: false,
                    flags: 0,
                    premium_type: 0
                    },
                    pinned: false,
                    type: 0
                },
                icon_url: 'https://cdn.discordapp.com/avatars/1250111229582643232/8ff6e5631d4588748ba11b1611d84223.webp?size=240',
                title: 'Eleuthia',
                body: 'o'
                }
            */
            console.log('(on)New Discord Notification:', rest);
            this.emit('notification', {
                type: 'NOTIFICATION_CREATE',
                rest
            });
        });
    }

    private async login(clientId: string, clientSecret: string) {
        await this.client.login({ clientId,
            clientSecret, 
            scopes: this.scopes,
            redirectUri: 'http://localhost' });
    }

    public async start() {
        console.log('Starting DiscordService...');
        await this.client.on('ready', () => {
            console.log('Logged in as', this.client?.application?.name);
            console.log('Authed for user', this.client?.user?.username);
            this.subscribe()
            this.listen()
        });

        this.client.on('error', (error) => {
            console.error('Discord Client Error:', error);
        });


        this.login(this.clientId, this.clientSecret)
    }
}

const discord = new discordService();

discord.start()

export default discordService;