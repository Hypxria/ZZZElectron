import net from 'net';
import { EventEmitter } from 'events';
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



class DiscordRPC extends EventEmitter {
    private socket: net.Socket | null;
    private buffer: Buffer;
    private connectionAttempts: number = 0;
    private readonly maxRetries: number = 3;
    private readonly connectionTimeout: number = 10000; // 10 seconds
    private readonly CLIENT_ID: string
    private readonly CLIENT_SECRET: string
    private store: any;


    constructor(CLIENT_ID?: string, CLIENT_SECRET?: string) {
        super();
        this.socket = new net.Socket();
        this.buffer = Buffer.alloc(0);

        this.setupSocket();


        this.CLIENT_ID = CLIENT_ID || ''
        this.CLIENT_SECRET = CLIENT_SECRET || ''
        this.initializeStoreAndSetup();

    }

    private async initializeStoreAndSetup() {
        try {
            this.store = await initializeStore();
            console.log(this.store.get('unicorn'));
        } catch (error) {
            console.error('Failed to initialize store:', error);
        }
    }

    private generateNonce(): string {
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
                scopes: ['rpc', 'messages.read', 'rpc.notifications.read'],
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
            this.subscribeToNotifications();
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
            console.log('Received raw payload:', {
                opcode,
                length,
                payload
            });    
            console.log('Received payload:', JSON.stringify(payload, null, 2));
            this.handleMessage(opcode, payload);

            this.buffer = this.buffer.subarray(totalLength);
        }
    }

    private async handleMessage(opcode: number, data: any) {
        // amazonq-ignore-next-line
        switch (opcode) {
            case 1: // Event
                if (data.cmd === 'AUTHORIZE' && data.data.code) {
                    if (data.data && data.data.code) {
                        console.log('Emitting code:', data.data.code);
                        this.emit('codeReceived', data.data.code);
                    } else {
                        console.log('Authorization data received but no code:', data);
                    }
                } else if (data.evt == 'READY' && data.cmd == 'DISPATCH') {
                    this.emit('ready');
                } else if (data.evt === 'AUTHENTICATE') {
                    this.emit('authenticated');
                }
                else if (data.evt === 'NOTIFICATION_CREATE') {
                    this.emit('notification', data.data);
                } else if (data.cmd === 'AUTHENTICATE') {
                    console.log('Authenticated successfully');
                    this.emit('authenticated');
                    this.subscribeToNotifications();
                }
                break;
            case 2: // Error
                // Improved error handling with fallback
                console.log('error')
                const errorMessage = data.data?.message || data.message || 'Unknown RPC error';
                this.emit('error', new Error(errorMessage));
                break;
        }
    }

    subscribe() {
        this.subscribeToMessageDelete()
        this.subscribeToMessageUpdate()
        this.subscribeToNotifications()
    }


    // Subscription to various events that I may need sometime
    // I'll call this in a function that combines all these calls into one thingy
    private async subscribeToNotifications() {
        const payload = {
            op: 1, // Command opcode
            cmd: 'SUBSCRIBE',
            client_id: this.CLIENT_ID,
            evt: 'NOTIFICATION_CREATE',
            nonce: this.generateNonce(),
        };

        console.log('Sending subscription:', JSON.stringify(payload, null, 2));
        this.sendFrame(payload);
    }

    private async subscribeToMessageDelete() {
        const payload = {
            op: 1, // Command opcode
            cmd: 'SUBSCRIBE',
            client_id: this.CLIENT_ID,
            evt: 'MESSAGE_DELETE',
            nonce: this.generateNonce(),
        };

        console.log('Sending subscription:', JSON.stringify(payload, null, 2));
        this.sendFrame(payload);
    }

    private async subscribeToMessageUpdate() {
        const payload = {
            op: 1, // Command opcode
            cmd: 'SUBSCRIBE',
            client_id: this.CLIENT_ID,
            evt: 'MESSAGE_UPDATE',
            nonce: this.generateNonce()
        };

        console.log('Sending subscription:', JSON.stringify(payload, null, 2));
        this.sendFrame(payload);
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

// Usage

export default DiscordRPC;