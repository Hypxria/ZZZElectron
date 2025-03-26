import { Client, Subscription, User } from 'discord-rpc';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
dotenv.config();

interface DiscordNotification {
    type: 'NOTIFICATION_CREATE' | 'MESSAGE_DELETE' | 'MESSAGE_UPDATE';
    data: any;
}

class discordService extends EventEmitter {
    private readonly clientId = process.env.CLIENTID ?? '';
    private readonly clientSecret = process.env.CLIENTSECRET ?? '';
    private readonly scopes = ['rpc', 'messages.read', 'rpc.notifications.read'];

    private client = new Client({ transport: 'ipc' });

    constructor() {
        super();
    }


    private async subscribe() {
        this.client.subscribe('NOTIFICATION_CREATE', ({ data }: any) => {
            console.log('(sub)New Discord Notification:', data);
        });

        this.client.subscribe('MESSAGE_DELETE', ({ data }: any) => {
            console.log('(sub)Message Deleted:', data);
        });

        this.client.subscribe('MESSAGE_UPDATE', ({ data }: any) => {
            console.log('(sub)Message Updated:', data);
        });
    } 

    private async listen() {
        this.client.on('NOTIFICATION_CREATE', ({ data, ...rest }: any) => {
            console.log('(on)New Discord Notification:', rest);
            this.emit('notification', {
                type: 'NOTIFICATION_CREATE',
                rest
            });
        });
        
        this.client.on('MESSAGE_DELETE', ({ data, ...rest }: any) => {
            console.log('(on)Message Deleted:', rest);
            this.emit('notification', {
                type: 'MESSAGE_DELETE',
                rest
            });
        });
        
        this.client.on('MESSAGE_UPDATE', ({ data, ...rest }: any) => {
            console.log('(on)Message Updated:', rest);
            this.emit('notification', {
                type: 'MESSAGE_UPDATE',
                rest
            });
        });
    }

    private async login(clientId:string, clientSecret:string) {
        let scopes=this.scopes
        this.client.login({ clientId, clientSecret, scopes, redirectUri: 'http://localhost' });
    }

    public async start() {
        this.subscribe();
        this.listen();
        this.login(this.clientId, this.clientSecret);
    }
}

export default discordService;