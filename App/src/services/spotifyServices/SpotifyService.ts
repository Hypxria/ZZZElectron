import axios from 'axios';


/*
Do I really need to make comments for this... It's the spotify API.
*/


export enum RepeatState {
    OFF = 'off',
    CONTEXT = 'context', // Repeats the playlist/album
    TRACK = 'track'     // Repeats the current song
}

export interface Song {
    name: string;
    artist: string;
    album_cover: string | null;
    year?: string;
    is_playing?: boolean;
    progress_ms?: number;
    duration_ms?: number;
    repeat_state?: string;
    volume?: number;
    album?: string;
}

export interface LyricsResponse {
    lyrics: string;
    error?: string;
}

class SpotifyService {
    private baseUrl = 'https://api.spotify.com/v1';

    private ws: WebSocket | null = null;
    private readonly WS_URL = 'ws://localhost:5001';

    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;



    constructor() {
        console.log('SpotifyService constructed');
    }

    private connectWebSocket() {
        try {
            this.ws = new WebSocket(this.WS_URL);
            
            this.ws.onopen = () => {
                console.log('SpotifyService WebSocket connected');
                this.reconnectAttempts = 0; // Reset attempts on successful connection
            };

            this.ws.onclose = (event) => {
                console.log('SpotifyService WebSocket closed:', event);
                if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
                    console.log(`Attempting to reconnect in ${delay}ms...`);
                    setTimeout(() => this.connectWebSocket(), delay);
                }
            };

            this.ws.onerror = (error) => {
                console.error('SpotifyService WebSocket error:', error);
            };

            this.ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    console.log('Received message in SpotifyService:', response);
                    // Handle any responses from app.tsx here if needed
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            console.log('SpotifyService WebSocket created:', this.ws)
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }

    public async startLinkWs() {
        if (!window.electron) {
            console.error('Electron API is not available');
            return;
        }

        await window.electron.spotifyLink()
        await this.connectWebSocket()
    }

    private sendWsMessage(message: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
                throw error;
            }
        } else {
            console.error('WebSocket is not connected');
            throw new Error('WebSocket is not connected');
        }
    }

    async handleMessage(message: string) {
        try {
            const data = message;

            console.log(data)
            return data

        } catch (error) {
            console.error('Error in handleMessage:', error);
            return { error: 'Failed to process message' };
        }
    }


    // In SpotifyService.ts
    async getCurrentTrack(): Promise<Song> {
        try {
            console.log('getcurrenttrack run')
            // Send the request for current track info
            this.sendWsMessage({
                type: 'info',
                action: 'current'
            });
            console.log()
            // Create a promise that will resolve when we get the response
            return new Promise((resolve, reject) => {
                const messageHandler = (event: MessageEvent) => {
                    try {
                        console.log(`event: ${event.data}`)
                        const response = JSON.parse(event.data);

                        // Check if this is the response we're waiting for
                        if (response.type === 'response' && response.action === 'current') {
                            // Remove the message handler
                            this.ws?.removeEventListener('message', messageHandler);
                            console.log(`response: ${JSON.stringify(response, null, 10)}`)

                            // Format the data into Song interface
                            const song: Song = {
                                name: response.data.name,
                                artist: response.data.artist,
                                album_cover: response.data.album_cover || null,
                                year: response.data.year,
                                album: response.data.album,
                                duration_ms: response.data.duration_ms?.milliseconds,
                                progress_ms: response.data.progress_ms,
                                is_playing: response.data.is_playing // Since it's the current song
                            };
                            console.log(`song: ${JSON.stringify(song, null, 10)}`)

                            resolve(song);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };

                // Add temporary message handler
                this.ws?.addEventListener('message', messageHandler);

                // Add timeout to prevent hanging
                setTimeout(() => {
                    this.ws?.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout waiting for current track info'));
                }, 5000); // 5 second timeout
            });

        } catch (error) {
            console.error('Error fetching current track:', error);
            throw error;
        }
    }


    async getNextSong(): Promise<Song> {
        try {
            console.log('getnextsong run-----------------------------------------------------------------------------------------')
            // Send the request for next song info
            this.sendWsMessage({
                type: 'info',
                action: 'next'
            });

            // Create a promise that will resolve when we get the response
            return new Promise((resolve, reject) => {
                const messageHandler = (event: MessageEvent) => {
                    try {
                        const response = JSON.parse(event.data);

                        // Check if this is the response we're waiting for
                        if (response.type === 'response' && response.action === 'next') {
                            // Remove the message handler
                            this.ws?.removeEventListener('message', messageHandler);

                            // Format the data into Song interface
                            const song: Song = {
                                name: response.data.name,
                                artist: response.data.artist,
                                album_cover: response.data.album_cover || null,
                                year: response.data.year,
                                album: response.data.album,
                                duration_ms: response.data.duration,
                                is_playing: false // Since it's the next song
                            };

                            resolve(song);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };

                // Add temporary message handler
                this.ws?.addEventListener('message', messageHandler);

                // Add timeout to prevent hanging
                setTimeout(() => {
                    this.ws?.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout waiting for next song info'));
                }, 5000); // 5 second timeout
            });

        } catch (error) {
            console.error('Error fetching next song:', error);
            throw error;
        }
    }



    async playNextSong(): Promise<void> {
        try {
            this.sendWsMessage({
                type: 'playback',
                action: 'next'
            });
        } catch (error) {
            console.error('Error playing next song:', error);
            throw error;
        }
    }

    async playPreviousSong(): Promise<void> {
        try {
            this.sendWsMessage({
                type: 'playback',
                action: 'back'
            });
        } catch (error) {
            console.error('Error playing previous song:', error);
            throw error;
        }
    }

    async pausePlayback(): Promise<void> {
        try {
            // Send message through WebSocket
            this.sendWsMessage({
                type: 'playback',
                action: 'pause'
            });
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }


    async resumePlayback(): Promise<void> {
        try {
            // Send message through WebSocket
            this.sendWsMessage({
                type: 'playback',
                action: 'play'
            });
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }

    async setVolume(volume: number): Promise<void> {
        try {
            this.sendWsMessage({
                type: 'playback',
                action: 'volume',
                value: volume
            });
        } catch (error) {
            console.error('Error setting volume:', error);
            throw error;
        }
    }

    async seek(position: number): Promise<void> {
        try {
            this.sendWsMessage({
                type: 'playback',
                action: 'seek',
                value: position
            });
        } catch (error) {
            console.error('Error seeking position:', error);
            throw error;
        }
    }

    async toggleRepeatMode(): Promise<void> {
        try {
            // Send message through WebSocket
            this.sendWsMessage({
                type: 'playback',
                action: 'toggleRepeat'
            });
        } catch (error) {
            console.error('Error toggling repeat mode:', error);
            throw error;
        }
    }
    
    
    /**
     * Set a specific repeat mode
     */
    async setRepeatMode(mode: RepeatState): Promise<void> {
        try {
            this.sendWsMessage({
                type: 'playback',
                action: 'setRepeat',
                value: mode
            });
        } catch (error) {
            console.error('Error setting repeat mode:', error);
            throw error;
        }
    }
}

export const spotifyService = new SpotifyService();
export default spotifyService;