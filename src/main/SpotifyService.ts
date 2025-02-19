// src/renderer/services/spotifyService.ts

const API_BASE_URL = 'http://localhost:20000'; // Make sure this matches your Flask server port

export interface SpotifyTrack {
  name: string;
  artist: string;
  duration: number;
  // Add other track properties as needed
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


  async getCurrentTrack(): Promise<SpotifyTrack> {
    const response = await fetch(`${API_BASE_URL}/spotify/current-track`);
    if (!response.ok) throw new Error('Failed to fetch current track');
    return response.json();
  },

  async getLyrics(): Promise<LyricsResponse> {
    const response = await fetch(`${API_BASE_URL}/spotify/lyrics`);
    if (!response.ok) throw new Error('Failed to fetch lyrics');
    return response.json();
  },

  async getUpcomingSongs(): Promise<SpotifyTrack[]> {
    const response = await fetch(`${API_BASE_URL}/spotify/upcoming-songs`);
    if (!response.ok) throw new Error('Failed to fetch upcoming songs');
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
    const response = await fetch(`${API_BASE_URL}/spotify/resume`, {
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

