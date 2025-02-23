// src/renderer/services/spotifyService.ts

const API_BASE_URL = 'http://localhost:20000'; // Make sure this matches your Flask server port

export interface Song {
  name: string;
  artist: string;
  album_cover: string;
  year?: string;
  duration_ms?: number;
  is_playing?: boolean;
  progress_ms?: number;
}

export interface LyricsResponse {
  lyrics: string[];
  syncedLyrics?: {
    time: number;
    text: string;
  }[];
}

export const spotifyService = {
  // Current playback endpoints


  async getCurrentTrack(): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/spotify/current-track`);
    if (!response.ok) throw new Error('Failed to fetch current track');
    return response.json();
    /*
    album_cover
    {
      "album_cover": "https://i.scdn.co/image/ab67616d0000b27322805a1b17e41ae357bd98bc",
      "artist": "Fujii Kaze",
      "duration_ms": 185573,
      "is_playing": true,
      "name": "Shinunoga E-Wa",
      "repeat_state": "context",
      "shuffle_state": false,
      "volume_percent": 64,
      "year": "2020"
    }
    */
  },

  async getLyrics(): Promise<LyricsResponse> {
    const response = await fetch(`${API_BASE_URL}/spotify/lyrics`);
    if (!response.ok) throw new Error('Failed to fetch lyrics');
    return response.json();
  },

  async getNextSong(): Promise<Song> {
    const response = await fetch(`${API_BASE_URL}/spotify/get-next-song`);
    if (!response.ok) throw new Error('Failed to fetch next song');
    return response.json();
  },

  // Playback control endpoints
  async playNextSong(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/next-track`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to play next song');
    return response.json();
  },

  async playPreviousSong(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/previous-track`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to play previous song');
    return response.json();
  },

  async pausePlayback(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/pause`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to pause playback');
    return response.json();
  },

  async resumePlayback(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/play`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to resume playback');
    return response.json();
  },

  // Monitoring endpoints
  async startMonitoring(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/start-monitoring`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start monitoring');
    return response.json();
  },

  async stopMonitoring(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/stop-monitoring`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop monitoring');
    return response.json();
  },

  // Volume control
  async setVolume(volume: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ volume }),
    });
    if (!response.ok) throw new Error('Failed to set volume');
    return response.json();
  },

  // Seek Song Position
  async seek(position: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/spotify/seek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position_ms: position }),
    });
    if (!response.ok) throw new Error('Failed to seek');
    return response.json();
  },

  // Error handling wrapper
  async handleApiError<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      console.error('Spotify API Error:', error);
      throw error;
    }
  }
};

