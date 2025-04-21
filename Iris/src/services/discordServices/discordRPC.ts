import net from 'net';
import { EventEmitter } from 'events';
import { VoiceChannelSelectType } from './types'
import { ThumbUpSharp } from '@mui/icons-material';
let Store: any;
let store: any;

async function initializeStore() {
    if (!Store) {
        Store = (await import("electron-store")).default;
        store = new Store();
    }
    return store;
}

interface RpcMessage {
    op: number;
    cmd?: string;
    evt?: string;
    data?: any;
}

interface MessageHandler {
    opcode: number;
    condition?: (data: any) => boolean;
    handler: (data: any) => void;
}

type SubscriptionArgs = Record<string, any> | any[];

interface SubscriptionConfig {
    event: string;
    args?: SubscriptionArgs;
    handler?: EventHandler;
}

type EventHandler = (data: any) => void;

class DiscordRPC extends EventEmitter {
    private socket: net.Socket | null;
    private buffer: Buffer;
    private readonly CLIENT_ID: string
    private readonly CLIENT_SECRET: string

    private store: any;
    public subscribedEvents: Set<string> = new Set();

    public voice: VoiceManager;

    constructor(CLIENT_ID: string, CLIENT_SECRET?: string) {
        super();
        this.socket = new net.Socket();
        this.buffer = Buffer.alloc(0);

        this.setupSocket();

        this.CLIENT_ID = CLIENT_ID || ''
        this.CLIENT_SECRET = CLIENT_SECRET || ''
        this.initializeStoreAndSetup();

        this.voice = new VoiceManager(this)

    }

    private async initializeStoreAndSetup() {
        try {
            this.store = await initializeStore();
            console.log(this.store.get('unicorn'));
        } catch (error) {
            console.error('Failed to initialize store:', error);
        }
    }

    public generateNonce(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    private setupSocket() {
        this.socket!
            .on('ready', () => this.handleConnect())
            .on('data', (data) => this.handleData(data))
            .on('close', () => this.emit('close'))
            .on('error', (err) => this.emit('error', err));
    }

    async connect() {
        if (this.CLIENT_ID === '' || this.CLIENT_SECRET === '') return
        return new Promise((resolve, reject) => {
            const ipcPath = process.platform === 'win32'
                ? '\\\\?\\pipe\\discord-ipc-0'
                : '/tmp/discord-ipc-0';

            console.log('Attempting to connect to:', ipcPath);

            // Try multiple pipe numbers if the first one fails
            const tryConnect = (pipeNum: number) => {
                const currentPath = process.platform === 'win32'
                    ? `\\\\?\\pipe\\discord-ipc-${pipeNum}`
                    : `/tmp/discord-ipc-${pipeNum}`;

                console.log(`Trying pipe ${pipeNum}:`, currentPath);

                this.socket!.connect(currentPath);
            };

            let currentPipe = 0;
            const maxPipes = 10;

            this.socket!.on('error', (err) => {
                console.log(`Failed to connect to pipe ${currentPipe}:`, err.message);
                currentPipe++;
                if (currentPipe < maxPipes) {
                    tryConnect(currentPipe);
                } else {
                    reject(new Error('Failed to connect to Discord IPC'));
                }
            });

            this.socket!.once('connect', () => {
                console.log('Connected to Discord IPC pipe:', currentPipe);
                resolve(true);
            });

            tryConnect(currentPipe);
        });
    }



    private async handleConnect() {
        console.log('Connected to Discord IPC');
        await this.sendHandshake();
    }

    private async sendHandshake() {
        return new Promise((resolve, reject) => {
            const handshakePayload = {
                v: 1,
                client_id: this.CLIENT_ID,
                nonce: this.generateNonce(),
                op: 0
            };

            console.log('Sending handshake payload:', handshakePayload);
            this.sendFrame(handshakePayload);

            // Set up a timeout for handshake response

            // Wait for handshake response
            this.once('ready', () => {
                resolve(true);
                this.authorize();
            });
        });
    }

    public async revokeAllTokens() {
        const tokens = {
            access_token: this.store.get('access_token'),
            refresh_token: this.store.get('refresh_token'),
            expires_at: this.store.get('expires_at')
        }

        // Revoke acccess token
        await fetch("https://discord.com/api/v10/oauth2/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                token: tokens.access_token
            })
        });

        // Revoke Refresh Token =
        await fetch("https://discord.com/api/v10/oauth2/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                token: tokens.refresh_token
            })
        });

        await this.store.delete('access_token');
        await this.store.delete('refresh_token');
        await this.store.delete('expires_at');

        await window.electron.restart();
    }

    private async authorize() {
        const tokens = {
            access_token: this.store.get('access_token'),
            refresh_token: this.store.get('refresh_token'),
            expires_at: this.store.get('expires_at')
        }

        console.log(`access tokens: ${tokens.access_token}, ${tokens.refresh_token}, ${tokens.expires_at}`)

        if (tokens.access_token !== undefined && tokens.expires_at > Date.now() && tokens.refresh_token !== undefined) {
            console.log('skippy')
            this.authenticate(tokens.access_token);
            return;
        } else if (tokens.refresh_token !== undefined && tokens.expires_at < Date.now()) {
            console.log('refreshing')
            const response = await fetch("https://discord.com/api/v10//oauth2/token", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token,
                    client_id: this.CLIENT_ID,
                    client_secret: this.CLIENT_SECRET,
                })
            });
            const data = await response.json();
            this.store.delete('access_token')
            this.store.delete('refresh_token')
            this.store.delete('expires_at')

            this.store.set('access_token', data.access_token);
            this.store.set('refresh_token', data.refresh_token);
            this.store.set('expires_at', Date.now() + data.expires_in);

            this.authenticate(data.access_token);
            return;
        }

        // After handshake is successful, you'll receive a READY event
        // Then you should send IDENTIFY
        this.once('codeReceived', (code) => {
            console.log('getting token');
            this.getToken(code)
        });



        const identifyPayload = {
            op: 1, // FRAME opcode
            cmd: 'AUTHORIZE',
            nonce: this.generateNonce(),
            args: {
                client_id: this.CLIENT_ID,
                client_secret: this.CLIENT_SECRET,
                scopes: ['rpc', 'messages.read', 'rpc.notifications.read', 'rpc.voice.write', 'rpc.voice.read'],
                v: 1
            }
        };


        this.sendFrame(identifyPayload);
        // Handlemessage Takes it from here to get the code by codeReceived

    }

    private async getToken(code: string) {
        const response = await fetch("https://discord.com/api/oauth2/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.CLIENT_ID,
                client_secret: this.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'http://localhost',
                scope: 'identify'
            })
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2))
        /*
        {
        "token_type": "Bearer",
        "access_token": "---------------------------",
        "expires_in": 604800,
        "refresh_token": "-----------------------------",
        "scope": "messages.read rpc rpc.notifications.read"
        }
        */
        this.store.set('access_token', data.access_token);
        this.store.set('refresh_token', data.refresh_token);

        // I prefer doing this, because it just makes things easier in the long run
        this.store.set('expires_at', Date.now() + data.expires_in);
        data.access_token && this.authenticate(data.access_token);
    }


    private async authenticate(code: string) {

        this.once('authenticated', () => {
            console.log('subscribing')
            this.subscribe();
        });

        const authenticatePayload = {
            op: 1, // FRAME opcode
            cmd: 'AUTHENTICATE',
            nonce: this.generateNonce(),
            args: {
                access_token: code
            }
        };

        console.log('Sending authenticate payload')
        this.sendFrame(authenticatePayload);
    }

    private async sendFrame(message: RpcMessage) {
        const data = JSON.stringify(message);
        const header = Buffer.alloc(8);
        header.writeUInt32LE(message.op, 0);
        header.writeUInt32LE(data.length, 4);

        this.socket!.write(Buffer.concat([header, Buffer.from(data)]));
    }

    private async handleData(chunk: Buffer) {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        while (this.buffer.length >= 8) {
            const opcode = this.buffer.readUInt32LE(0);
            const length = this.buffer.readUInt32LE(4);
            const totalLength = 8 + length;

            if (this.buffer.length < totalLength) break;

            const payload = JSON.parse(this.buffer.subarray(8, totalLength).toString());

            console.log('Received payload:', JSON.stringify(payload, null, 2));
            this.handleMessage(opcode, payload);

            this.buffer = this.buffer.subarray(totalLength);
        }
    }

    private async handleMessage(opcode: number, data: any) {
        switch (opcode) {
            case 1: // Event
                return this.handleEvent(data);
            case 2: // Error
                return this.handleError(data);
            default:
                console.log('Unknown opcode:', opcode);
        }
    }

    private async handleEvent(data: RpcMessage) {
        // Handle command responses first
        if (data.cmd === 'AUTHORIZE' && data.data?.code) {
            this.emit('codeReceived', data.data.code);
            return;
        }

        if (data.cmd === 'AUTHENTICATE') {
            console.log('authenticated')
            this.emit('authenticated');
            return;
        }

        else if (data.cmd && data.evt == null) {
            this.emit('data', data);
        }

        // Handle dispatched events
        if (data.evt) {
            if (data.evt === 'READY' && data.cmd === 'DISPATCH') {
                this.emit('ready');
                return;
            }

            // Check if we're subscribed to this event
            else if (this.subscribedEvents.has(data.evt)) {
                this.emit('data', data);
            }
        }
    }

    public async sendCommand(command: any, args?: any) {
        const payload = {
            op: 1,
            cmd: command,
            nonce: this.generateNonce(),
            ...(args && { args }),  // Simply check if args exists
        }

        try {
            this.sendFrame(payload);
            console.log(payload)
            console.log(`Sent ${command}`);
        } catch (error) {
            console.error(`Failed to send ${command}:`, error);
        }
    }

    private handleError(data: any) {
        const errorMessage = data.data?.message || data.message || 'Unknown RPC error';
        this.emit('error', new Error(errorMessage));
    }

    private async subscribe() {
        // Now subscribe to events
        await Promise.all([
            this.subscribeToEvent('NOTIFICATION_CREATE'),
            this.voice.voiceCallEventWorkflow(),
        ]);

        this.emit('subscribed');
    }

    public async subscribeToEvent(event: string, args?: any) {
        if (this.subscribedEvents.has(event)) return;

        const payload = {
            op: 1,
            cmd: 'SUBSCRIBE',
            evt: event,
            ...(args && { args }),  // Simply check if args exists
            nonce: this.generateNonce(),
            client_id: this.CLIENT_ID
        };

        try {
            this.sendFrame(payload);
            console.log(payload)
            this.subscribedEvents.add(event);
            console.log(`Subscribed to ${event}`);
        } catch (error) {
            console.error(`Failed to subscribe to ${event}:`, error);
        }
    }

    public async unsubscribeFromEvent(event: string, args?: any) {
        if (!this.subscribedEvents.has(event)) return;

        const payload = {
            op: 1,
            cmd: 'UNSUBSCRIBE',
            ...(args && { args }),  // Simply check if args exists
            evt: event,
            nonce: this.generateNonce(),
            client_id: this.CLIENT_ID
        };

        try {
            this.sendFrame(payload);
            this.subscribedEvents.delete(event);
            console.log(`Unsubscribed from ${event}`);
        } catch (error) {
            console.error(`Failed to unsubscribe from ${event}:`, error);
        }
    }

    public async selectTextChannel(channel_id: string){ 
        const payload = {
            op: 1,
            cmd: 'SELECT_TEXT_CHANNEL',
            args: {
                channel_id: channel_id,
                timeout: 4000,
            },
            nonce: this.generateNonce(),
            client_id: this.CLIENT_ID
        };

        try {
            this.sendFrame(payload);
        } catch (error) {
            console.error(`Failed to send SELECT_TEXT_CHANNEL:`, error);
        }
    }

    async disconnect() {
        if (this.socket) {
            // Remove all listeners to prevent memory leaks
            this.socket.removeAllListeners();

            // End the socket connection gracefully
            this.socket.end();

            // Destroy the socket
            this.socket.destroy();

            // Clear the socket reference
            this.socket = null;
        }

        // Remove all EventEmitter listeners
        this.removeAllListeners();
    }
}

class VoiceManager {
    private rpc: DiscordRPC;
    private channel_id: string = '';
    private guild_id: string | null | void = '';


    constructor(rpc: DiscordRPC) {
        this.rpc = rpc;
    }

    public async voiceCallEventWorkflow() {
        this.rpc.on('data', (data: VoiceChannelSelectType) => {
            if (data.evt === 'VOICE_CHANNEL_SELECT') {
                if (data.data.channel_id == null) {
                    console.log('leaving call')
                    this.unsubscribeFromVoiceEvents(this.channel_id)
                } else {
                    console.log(`joined ${data.data.channel_id}`)
                    this.channel_id = data.data.channel_id
                    this.subscribeToVoiceEvents(this.channel_id)
                    this.rpc.sendCommand('GET_VOICE_SETTINGS')
                }
            }
        })
        this.rpc.subscribeToEvent('VOICE_CHANNEL_SELECT');
    }

    private async subscribeToVoiceEvents(channel_id: string, guild_id?: string) {

        const args = {
            channel_id: channel_id,
        }

        await Promise.all([
            // These are events to see if a user is muted or such
            this.rpc.subscribeToEvent('VOICE_STATE_UPDATE', args),
            this.rpc.subscribeToEvent('VOICE_STATE_CREATE', args),
            this.rpc.subscribeToEvent('VOICE_STATE_DELETE', args),

            // If user is speaking
            this.rpc.subscribeToEvent('SPEAKING_START', args),
            this.rpc.subscribeToEvent('SPEAKING_STOP', args),

            // Current user voice state
            this.rpc.subscribeToEvent('VOICE_SETTINGS_UPDATE')
        ]);
    }

    private async unsubscribeFromVoiceEvents(channel_id: string) {

        const args = {
            channel_id: channel_id,
        }

        await Promise.all([
            this.rpc.unsubscribeFromEvent('VOICE_STATE_UPDATE', args),
            this.rpc.unsubscribeFromEvent('VOICE_STATE_CREATE', args),
            this.rpc.unsubscribeFromEvent('VOICE_STATE_DELETE', args),

            this.rpc.unsubscribeFromEvent('SPEAKING_START', args),
            this.rpc.unsubscribeFromEvent('SPEAKING_STOP', args),

            this.rpc.unsubscribeFromEvent('VOICE_SETTINGS_UPDATE'),
        ]);
    }

    public async mute() {
        const args = {
            mute: true
        }
        this.rpc.sendCommand('SET_VOICE_SETTINGS', args)
    }

    public async unmute() {
        const args = {
            mute: false
        }
        this.rpc.sendCommand('SET_VOICE_SETTINGS', args)
    }

    public async deafen() {
        const args = {
            deaf: true
        }
        this.rpc.sendCommand('SET_VOICE_SETTINGS', args)
    }

    public async undeafen() {
        const args = {
            deaf: false
        }
        this.rpc.sendCommand('SET_VOICE_SETTINGS', args)
    }

    public async leaveCall() {
        const args = {
            channel_id: null
        }
        this.rpc.sendCommand('SELECT_VOICE_CHANNEL', args)
    }

    public async joinCall(channel_id: string) {
        const args = {
            channel_id: channel_id,
            force: true
        }
        this.rpc.sendCommand('SELECT_VOICE_CHANNEL', args)
    }

    public async getVoiceSettings() {
        this.rpc.sendCommand('GET_VOICE_SETTINGS')
    }

    public async getVoiceChannel() {
        this.rpc.sendCommand('GET_SELECTED_VOICE_CHANNEL')
    }
}


// Usage

export default DiscordRPC;