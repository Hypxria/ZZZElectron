// lrclib-api.ts

/**
 * Interface for LrcLib API response
 */
interface LrcLibResponse {
  id: number;
  artist: string;
  track: string;
  album: string;
  plaintext: string;
  syncedLyrics: string | null;
  instrumental: boolean;
  lang: string;
}

/**
 * Interface for search query parameters
 */
interface SearchParams {
  artist: string;
  track: string;
  album?: string;
}

/**
 * Main class for interacting with the LrcLib API
 */
export class LrcLibApi {
  private baseUrl = 'https://lrclib.net/api';

  /**
   * Search for lyrics by artist and track
   * @param params Search parameters (artist, track, optional album)
   * @returns Promise with the search results
   */
  async searchLyrics(params: SearchParams): Promise<LrcLibResponse[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('artist', params.artist);
    queryParams.append('track', params.track);
    
    if (params.album) {
      queryParams.append('album', params.album);
    }

    const url = `${this.baseUrl}/search?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as LrcLibResponse[];
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      throw error;
    }
  }

  /**
   * Get lyrics by ID
   * @param id Lyrics ID
   * @returns Promise with the lyrics data
   */
  async getLyricsById(id: number): Promise<LrcLibResponse> {
    const url = `${this.baseUrl}/get/${id}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as LrcLibResponse;
    } catch (error) {
      console.error('Error fetching lyrics by ID:', error);
      throw error;
    }
  }

  /**
   * Format synced lyrics into a structured format
   * @param syncedLyrics Raw synced lyrics string
   * @returns Array of timestamped lyrics
   */
  parseSyncedLyrics(syncedLyrics: string): Array<{time: number, text: string}> {
    if (!syncedLyrics) return [];
    
    const lines = syncedLyrics.split('\n');
    const result: Array<{time: number, text: string}> = [];
    
    for (const line of lines) {
      // Match the timestamp format [mm:ss.xx]
      const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
      
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const hundredths = parseInt(match[3], 10);
        const text = match[4].trim();
        
        // Convert to milliseconds
        const time = (minutes * 60 + seconds) * 1000 + hundredths * 10;
        
        result.push({ time, text });
      }
    }
    
    return result;
  }
}