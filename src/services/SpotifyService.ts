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
    album_cover: string;
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
    private tokenUrl = 'https://accounts.spotify.com/api/token';
    private token: string = '';
    private refreshToken: string = '';
    private tokenExpirationTime: number = 0;
    private clientId: string = '';
    private clientSecret: string = '';
    private redirectUri = 'http://127.0.0.1:8080/callback'; // Make sure this matches your Spotify App settings
    private authorizationInProgress: boolean = false;


    async authorize() {
        // If authorization is already in progress, wait for it to complete
        if (this.authorizationInProgress) {
            console.log('Authorization already in progress, waiting...');
            // Wait for a short period and check if we got a token
            for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
                if (this.token) {
                    return this.token;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            throw new Error('Authorization timeout');
        }

        try {
            this.authorizationInProgress = true;

            const scope = [
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-currently-playing'
            ].join(' ');

            const params = new URLSearchParams({
                client_id: this.clientId,
                response_type: 'code',
                redirect_uri: this.redirectUri,
                scope: scope,
                show_dialog: 'false' // Changed to false to prevent showing dialog if already authorized
            });

            // Open the authorization URL in the default browser
            const authUrl = `${this.authUrl}?${params.toString()}`;
            await window.electron.openExternal(authUrl);

            // Listen for the callback on your local server
            const code = await window.electron.listenForSpotifyCallback();
            
            // Exchange the code for tokens
            await this.getTokenFromCode(code);
            return this.token;
        } catch (error) {
            console.error('Error during authorization:', error);
            throw error;
        } finally {
            this.authorizationInProgress = false;
        }
    }


    private async getTokenFromCode(code: string) {
        try {
            const data = {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
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

            this.token = response.data.access_token;
            this.refreshToken = response.data.refresh_token;
            this.tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
            
            return this.token;
        } catch (error) {
            console.error('Error exchanging code for token:', error);
            throw error;
        }
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

            this.token = response.data.access_token;
            this.tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
            
            if (response.data.refresh_token) {
                this.refreshToken = response.data.refresh_token;
            }

            return this.token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }



    private async getHeaders() {
        const token = await this.getSpotifyToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    async getCurrentTrack(): Promise<Song> {
        try {
            const headers = await this.getHeaders();
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
        // If we have a valid token, return it
        if (this.token && Date.now() < this.tokenExpirationTime) {
            return this.token;
        }

        // If we have a refresh token, use it to get a new access token
        if (this.refreshToken) {
            try {
                return await this.refreshAccessToken();
            } catch (error) {
                console.error('Error refreshing token, falling back to full auth:', error);
                // Clear tokens if refresh failed
                this.token = '';
                this.refreshToken = '';
            }
        }

        // If we have neither, start the authorization process
        return await this.authorize();
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
                this.token = '';
                return await promise;
            }
            throw error;
        }
    }
}

export const spotifyService = new SpotifyService();
export default spotifyService;