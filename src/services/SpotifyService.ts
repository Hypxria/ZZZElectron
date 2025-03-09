import axios from 'axios';
import qs from 'qs';

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
    repeat_state?: RepeatState;
}

export interface LyricsResponse {
    lyrics: string;
    error?: string;
}

class SpotifyService {
    private baseUrl = 'https://api.spotify.com/v1';
    private authUrl = 'https://accounts.spotify.com/authorize';
    private tokenUrl = 'https://accounts.spotify.com/api/token'
    private accessToken: string = '';
    private refreshToken: string = '';
    private tokenExpirationTime: number = 0;
    private clientId: string = localStorage.getItem("spotify_client_id") || '';
    private clientSecret: string = localStorage.getItem("spotify_client_secret") || '';
    private redirectUri = 'http://127.0.0.1:8080/callback'; // Make sure this matches your Spotify App settings

    private isAuthInProgress: boolean = false;
    private authPromise: Promise<string> | null = null;

    public updateCredentials(newClientId: string, newClientSecret: string) {
        this.clientId = newClientId;
        this.clientSecret = newClientSecret;
        
        // Optionally re-authorize with new credentials
        this.authorize();
    }
    
    constructor() {
        console.log('SpotifyService constructed');
    }

    async initiateLogin(): Promise<void> {
        console.log('initiateLogin method called');
        const state = crypto.getRandomValues(new Uint8Array(16)).join('');
        
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            state: state,
            scope: [
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-currently-playing',
                'user-read-private',
                'user-read-email',
                'streaming',
                'app-remote-control'
            ].join(' ')
        });
    
        const authUrl = `${this.authUrl}?${params}`;
        if (!window.electron) {
            console.error('Electron API is not available');
            return;
        }
        if (window.electron) {
            await window.electron.openExternal(authUrl);
        }
    }

    async authorize() {
        const storedToken = localStorage.getItem('spotify_access_token');
        const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
        const storedExpiration = localStorage.getItem('spotify_token_expiration');

        if (storedToken && storedRefreshToken && storedExpiration) {
            this.accessToken = storedToken;
            this.refreshToken = storedRefreshToken;
            this.tokenExpirationTime = parseInt(storedExpiration);
    
            // If token is not expired, use it
    
            // If token is expired but we have refresh token, try to refresh
            try {
                await this.refreshAccessToken();
                return this.accessToken;
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        }
    

        if (this.isAuthInProgress && this.authPromise) {
            return this.authPromise;
        }

        this.isAuthInProgress = true;
        
        this.authPromise = new Promise(async (resolve, reject) => {
            try {
                const codePromise = window.electron.listenForSpotifyCallback();
                await this.initiateLogin();
                const authCode = await codePromise;
                console.log('Got auth code:', authCode); // Debug log
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: authCode,
                        redirect_uri: this.redirectUri,
                    })
                });             
                const data = await response.json();
                console.log('Token response:', data);
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);

                localStorage.setItem('spotify_access_token', this.accessToken);
                localStorage.setItem('spotify_refresh_token', this.refreshToken);
                localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());
                
                console.log('Stored token:', this.accessToken); // Debug log
                this.isAuthInProgress = false;
                resolve(this.accessToken);

            } catch (error) {
                this.isAuthInProgress = false;
                this.authPromise = null;
                reject(error);
            }
        });

        return this.authPromise;
    }    

    private async refreshAccessToken() {
        try {
            const data = {
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret
            };

            const response = await axios.post(
                this.tokenUrl,
                qs.stringify(data),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
            
            if (response.data.refresh_token) {
                this.refreshToken = response.data.refresh_token;
            }
            localStorage.setItem('spotify_access_token', this.accessToken);
            localStorage.setItem('spotify_refresh_token', this.refreshToken);
            localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());


            return this.accessToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }



    private async getHeaders() {
        console.log('Using token in headers:', this.accessToken); // Debug log
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };
    }

    async getCurrentTrack(): Promise<Song> {
        try {

            const headers = await this.getHeaders();
            console.log('Making request with headers:', headers); // Debug log

            const response = await axios.get(`${this.baseUrl}/me/player/currently-playing`, { headers });

            if (!response.data) {
                return {
                    name: '',
                    artist: '',
                    album_cover: '',
                    is_playing: false,
                    progress_ms: 0,
                    duration_ms: 0,
                };
            }

            const track = response.data.item;
            return {
                name: track.name,
                artist: track.artists.map((artist: any) => artist.name).join(', '),
                album_cover: track.album.images[0]?.url || '',
                year: track.album.release_date?.split('-')[0],
                is_playing: response.data.is_playing,
                progress_ms: response.data.progress_ms,
                duration_ms: track.duration_ms,
            };
        } catch (error) {
            console.error('Error fetching current track:', error);
            throw error;
        }
    }

    async getLyrics(): Promise<LyricsResponse> {
        try {
            const currentTrack = await this.getCurrentTrack();
            const response = await axios.get(`/api/lyrics?track=${currentTrack.name}&artist=${currentTrack.artist}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            return { lyrics: '', error: 'Failed to fetch lyrics' };
        }
    }

    async getNextSong(): Promise<Song> {
        try {
            const headers = await this.getHeaders();
            const response = await axios.get(`${this.baseUrl}/me/player/queue`, { headers });

            if (!response.data?.queue?.length) {
                return {
                    name: '',
                    artist: '',
                    album_cover: '',
                };
            }

            const nextTrack = response.data.queue[0];
            return {
                name: nextTrack.name,
                artist: nextTrack.artists.map((artist: any) => artist.name).join(', '),
                album_cover: nextTrack.album.images[0]?.url || '',
            };
        } catch (error) {
            console.error('Error fetching next song:', error);
            throw error;
        }
    }

    async playNextSong(): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.post(`${this.baseUrl}/me/player/next`, {}, { headers });
        } catch (error) {
            console.error('Error playing next song:', error);
            throw error;
        }
    }

    async playPreviousSong(): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.post(`${this.baseUrl}/me/player/previous`, {}, { headers });
        } catch (error) {
            console.error('Error playing previous song:', error);
            throw error;
        }
    }

    async pausePlayback(): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.put(`${this.baseUrl}/me/player/pause`, {}, { headers });
        } catch (error) {
            console.error('Error pausing playback:', error);
            throw error;
        }
    }

    async resumePlayback(): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.put(`${this.baseUrl}/me/player/play`, {}, { headers });
        } catch (error) {
            console.error('Error resuming playback:', error);
            throw error;
        }
    }

    async setVolume(volume: number): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.put(`${this.baseUrl}/me/player/volume`, null, {
                headers,
                params: { volume_percent: Math.round(volume) }
            });
        } catch (error) {
            console.error('Error setting volume:', error);
            throw error;
        }
    }

    async seek(position: number): Promise<void> {
        try {
            const headers = await this.getHeaders();
            await axios.put(`${this.baseUrl}/me/player/seek`, null, {
                headers,
                params: { position_ms: Math.round(position) }
            });
        } catch (error) {
            console.error('Error seeking position:', error);
            throw error;
        }
    }

    async getSpotifyToken(): Promise<string> {
        // If auth is in progress, wait for it
        if (this.isAuthInProgress && this.authPromise) {
            return this.authPromise;
        }

        // If we have a valid token, return it
        if (this.accessToken && Date.now() < this.tokenExpirationTime) {
            return this.accessToken;
        }

        // If we have a refresh token, use it
        if (this.refreshToken) {
            try {
                await this.refreshAccessToken();
                return this.accessToken;
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        }

        // If we get here, we need a new auth flow
        return this.authorize();
    }



    async toggleRepeatMode(): Promise<void> {
        try {
            const headers = await this.getHeaders();

            // First, get current playback state
            const response = await axios.get(`${this.baseUrl}/me/player`, { headers });

            if (!response.data) {
                throw new Error('No active playback found');
            }

            const currentState = response.data.repeat_state;
            let newState: RepeatState;

            // Determine next state in the sequence
            switch (currentState) {
                case RepeatState.OFF:
                    newState = RepeatState.CONTEXT;
                    break;
                case RepeatState.CONTEXT:
                    newState = RepeatState.TRACK;
                    break;
                case RepeatState.TRACK:
                    newState = RepeatState.OFF;
                    break;
                default:
                    newState = RepeatState.OFF;
            }

            // Set the new repeat state
            await axios.put(
                `${this.baseUrl}/me/player/repeat`,
                null,
                {
                    headers,
                    params: { state: newState }
                }
            );
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
            const headers = await this.getHeaders();
            await axios.put(
                `${this.baseUrl}/me/player/repeat`,
                null,
                {
                    headers,
                    params: { state: mode }
                }
            );
        } catch (error) {
            console.error('Error setting repeat mode:', error);
            throw error;
        }
    }




    private async handleApiError<T>(promise: Promise<T>): Promise<T> {
        try {
            return await promise;
        } catch (error: any) {
            if (error.response?.status === 401) {
                // Token expired, clear it and retry once
                this.accessToken = '';
                return await promise;
            }
            throw error;
        }
    }
}

export const spotifyService = new SpotifyService();
export default spotifyService;