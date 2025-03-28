import net from 'net';
import { EventEmitter } from 'events';

const CLIENT_ID = ''; // Replace with your Discord application ID
const CLIENT_SECRET = '';

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
    

    constructor() {
        super();
        this.socket = new net.Socket();
        this.buffer = Buffer.alloc(0);

        this.setupSocket();

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
        return new Promise((resolve, reject) => {
            const ipcPath = process.platform === 'win32'
                ? '\\\\?\\pipe\\discord-ipc-0'
                : '/tmp/discord-ipc-0';

            // Add connection timeout
            const timeout = setTimeout(() => {
                this.socket?.destroy();
                reject(new Error('Connection timeout'));
            }, this.connectionTimeout);

            console.log('Connecting attempt:', this.connectionAttempts + 1);

            this.socket!.connect(ipcPath);

            this.socket!.once('ready', () => {
                clearTimeout(timeout);
                this.connectionAttempts = 0;
                resolve(true);
            });

            this.socket!.once('error', (err) => {
                clearTimeout(timeout);
                if (this.connectionAttempts < this.maxRetries) {
                    this.connectionAttempts++;
                    console.log('Retrying connection...');
                    this.socket = new net.Socket();
                    this.setupSocket();
                    this.connect().then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            });
        });
    }

    private async handleConnect() {
        console.log('Connected to Discord IPC');
        await this.sendHandshake();
    }

    private async sendHandshake() {
        // First send the handshake
        const handshakePayload = {
            v: 1,
            client_id: CLIENT_ID,
            op: 0 // HANDSHAKE opcode
        };

        console.log('Sending initial handshake');
        this.sendFrame(handshakePayload);

        this.authorize()
    }

    private async authorize() {
        // After handshake is successful, you'll receive a READY event
        // Then you should send IDENTIFY
        this.once('codeReceived', (code) => {
            this.getToken(code)
        });

        const identifyPayload = {
            op: 1, // FRAME opcode
            cmd: 'AUTHORIZE',
            nonce: this.generateNonce(),
            args: {
                client_id: CLIENT_ID,
                scopes: ['rpc', 'messages.read', 'rpc.notifications.read'],
                v: 1
            }
        };

        console.log('Sending identify payload');
        this.sendFrame(identifyPayload);
        // Handlemessage Takes it from here to get the code

    }

    private async getToken(code: string) {
        const response = await fetch("https://discord.com/api/oauth2/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
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
        data.access_token && this.authenticate(data.access_token);
    }


    private async authenticate(code: string) {
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
        this.emit('authenticated');

        this.subscribeToNotifications()

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
            console.log('Received payload:', payload);
            this.handleMessage(opcode, payload);

            this.buffer = this.buffer.subarray(totalLength);
        }
    }

    private async handleMessage(opcode: number, data: any) {
        switch (opcode) {
            case 1: // Event
                console.log(data)
                if (data.cmd === 'AUTHORIZE' && data.data.code) {
                    if (data.data && data.data.code) {
                        console.log('Emitting code:', data.data.code);
                        this.emit('codeReceived', data.data.code);
                    } else {
                        console.log('Authorization data received but no code:', data);
                    }
                } else if (data.evt === 'NOTIFICATION_CREATE') {
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
            client_id: CLIENT_ID,
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
            client_id: CLIENT_ID,
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
            client_id: CLIENT_ID,
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