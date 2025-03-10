import axios from 'axios';
import * as crypto from 'crypto';

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36";
const SIGNATURE_KEY_BASE_URL = "https://s.mxmcdn.net/site/js/";

enum EndPoints {
  GET_ARTIST = "artist.get",
  GET_TRACK = "track.get",
  GET_TRACK_LYRICS = "track.lyrics.get",
  GET_SYNCED_LYRICS = "crowd.track.lyrics.get", 
  SEARCH_TRACK = "track.search",
  SEARCH_ARTIST = "artist.search",
  GET_ARTIST_CHART = "chart.artists.get",
  GET_TRACT_CHART = "chart.tracks.get",
  GET_ARTIST_ALBUMS = "artist.albums.get",
  GET_ALBUM = "album.get",
  GET_ALBUM_TRACKS = "album.tracks.get",
  GET_TRACK_LYRICS_TRANSLATION = "crowd.track.translations.get"
}

interface ProxyConfig {
  http?: string;
  https?: string;
}

class MusixMatchAPI {
  private base_url: string = "https://www.musixmatch.com/ws/1.1/";
  private headers: Record<string, string> = { "User-Agent": USER_AGENT };
  private proxies?: ProxyConfig;
  private secret: string = '';
  private latestAppCache?: string;
  private secretCache?: string;
  private initializationPromise: Promise<void>;
  private initialized = false;


  constructor(proxies?: ProxyConfig) {
    this.proxies = proxies;
    this.initializationPromise = this.initialize();
  }

  
  private async initialize(): Promise<void> {
    try {
      this.secret = await this.getSecret();
      console.log(this.secret)
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MusixMatch API:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializationPromise;
    }
  }


  private async getLatestApp(): Promise<string> {
    if (this.latestAppCache) {
      return this.latestAppCache;
    }

    const url = "https://www.musixmatch.com/search";

    const headers = {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Cookie": "mxm_bab=AB",
    };
    
    const response = await axios.get(url, { headers });
    // Fetch HTML content
    const htmlContent = response.data;

    // Regular expression to match `_app` script URLs
    const pattern = /src="([^"]*\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/;

    // Find all matches
    const matches = htmlContent.match(new RegExp(pattern, 'g'));

    // Extract the latest `_app` URL
    if (matches && matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const latestAppUrl = lastMatch.match(pattern)[1];
      this.latestAppCache = latestAppUrl;
      return latestAppUrl;
    } else {
      throw new Error("_app URL not found in the HTML content.");
    }
  }
  
  

  private async getSecret(): Promise<string> {
    if (this.secretCache) {
      return this.secretCache;
    }

    const latestAppUrl = await this.getLatestApp();
    const response = await axios.get(latestAppUrl, {
      headers: this.headers,
      proxy: this.proxies ? {
        host: this.proxies.http?.split('://')[1].split(':')[0] || '',
        port: parseInt(this.proxies.http?.split(':').pop() || '0') || 0
      } : undefined,
      timeout: 5000
    });
    
    const javascriptCode = response.data;

    // Regular expression to capture the string inside `from(...)`
    const pattern = /from\(\s*"(.*?)"\s*\.split/;

    // Search for the encoded string
    const match = javascriptCode.match(pattern);

    if (match) {
      const encodedString = match[1];
      const reversedString = encodedString.split('').reverse().join('');

      // Decode the reversed string from Base64
      const decodedBytes = Buffer.from(reversedString, 'base64');

      // Convert bytes to a string
      const decodedString = decodedBytes.toString('utf-8');
      this.secretCache = decodedString;
      return decodedString;
    } else {
      throw new Error("Encoded string not found in the JavaScript code.");
    }
  }

  private generateSignature(url: string): string {
    const currentDate = new Date();
    const l = currentDate.getFullYear().toString();
    const s = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const r = currentDate.getDate().toString().padStart(2, '0');
    
    const message = (url + l + s + r);
    const key = this.secret;
    
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    const hashOutput = hmac.digest();
    
    const signature = "&signature=" + 
      encodeURIComponent(Buffer.from(hashOutput).toString('base64')) + 
      "&signature_protocol=sha256";
    
    return signature;
  }

  public async searchTracks(trackQuery: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.SEARCH_TRACK}?app_id=community-app-v1.0&format=json&q=${encodeURIComponent(trackQuery)}&f_has_lyrics=true&page_size=100&page=${page}`;
    return this.makeRequest(url);
  }

  public async getTrack(trackId?: string, trackIsrc?: string): Promise<any> {
    await this.ensureInitialized();
    if (!trackId && !trackIsrc) {
      throw new Error("Either track_id or track_isrc must be provided.");
    }

    const param = trackId ? `track_id=${trackId}` : `track_isrc=${trackIsrc}`;
    const url = `${EndPoints.GET_TRACK}?app_id=community-app-v1.0&format=json&${param}`;

    return this.makeRequest(url);
  }

  public async getTrackLyrics(trackId?: string, trackIsrc?: string): Promise<any> {
    await this.ensureInitialized();
    if (!trackId && !trackIsrc) {
      throw new Error("Either track_id or track_isrc must be provided.");
    }

    const param = trackId ? `track_id=${trackId}` : `track_isrc=${trackIsrc}`;
    const url = `${EndPoints.GET_TRACK_LYRICS}?app_id=community-app-v1.0&format=json&${param}`;

    return this.makeRequest(url);
  }

  public async getArtistChart(country: string = "US", page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_ARTIST_CHART}?app_id=community-app-v1.0&format=json&page_size=100&country=${country}&page=${page}`;
    return this.makeRequest(url);
  }

  public async getTrackChart(country: string = "US", page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_TRACT_CHART}?app_id=community-app-v1.0&format=json&page_size=100&country=${country}&page=${page}`;
    return this.makeRequest(url);
  }

  public async searchArtist(query: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.SEARCH_ARTIST}?app_id=community-app-v1.0&format=json&q_artist=${query}&page_size=100&page=${page}`;
    return this.makeRequest(url);
  }

  public async getArtist(artistId: string): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_ARTIST}?app_id=community-app-v1.0&format=json&artist_id=${artistId}`;
    return this.makeRequest(url);
  }

  public async getArtistAlbums(artistId: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_ARTIST_ALBUMS}?app_id=community-app-v1.0&format=json&artist_id=${artistId}&page_size=100&page=${page}`;
    return this.makeRequest(url);
  }

  public async getAlbum(albumId: string): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_ALBUM}?app_id=community-app-v1.0&format=json&album_id=${albumId}`;
    return this.makeRequest(url);
  }

  public async getAlbumTracks(albumId: string, page: number = 1): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_ALBUM_TRACKS}?app_id=community-app-v1.0&format=json&album_id=${albumId}&page_size=100&page=${page}`;
    return this.makeRequest(url);
  }

  public async getTrackLyricsTranslation(trackId: string, selectedLanguage: string): Promise<any> {
    await this.ensureInitialized();
    const url = `${EndPoints.GET_TRACK_LYRICS_TRANSLATION}?app_id=community-app-v1.0&format=json&track_id=${trackId}&selected_language=${selectedLanguage}`;
    return this.makeRequest(url);
  }

  public async findExactTrack(trackName: string, artistName: string): Promise<any> {
    await this.ensureInitialized();
    const searchQuery = `${trackName}-${artistName}`.replace(/\s+/g, '-').toLowerCase();
    
    const searchResults = await this.searchTracks(searchQuery);
    console.log(searchResults)
    
    // Get the track list from the response
    const tracks = searchResults?.message?.body?.track_list;
    
    if (!tracks || tracks.length === 0) {
      throw new Error('No tracks found');
    }
  
    // Find the exact match
    const exactMatch = tracks.find((track: any) => {
      const trackInfo = track.track;
      return trackInfo.artist_name.toLowerCase() === artistName.toLowerCase() &&
             trackInfo.track_name.toLowerCase() === trackName.toLowerCase();
    });
  
    if (!exactMatch) {
      throw new Error('Exact track match not found');
    }
  
    // Get the specific track using track_id
    return this.getTrack(exactMatch.track.track_id);
  }
  
  public async findExactTrackLyrics(trackName: string, artistName: string): Promise<any> {
    await this.ensureInitialized();
    const searchQuery = `${trackName}-${artistName}`.replace(/\s+/g, '-').toLowerCase();
    
    const searchResults = await this.searchTracks(searchQuery);
    
    // Get the track list from the response
    const tracks = searchResults?.message?.body?.track_list;
    
    if (!tracks || tracks.length === 0) {
      throw new Error('No tracks found');
    }
  
    // Find the exact match
    const exactMatch = tracks.find((track: any) => {
      const trackInfo = track.track;
      return trackInfo.artist_name.toLowerCase() === artistName.toLowerCase() &&
             trackInfo.track_name.toLowerCase() === trackName.toLowerCase();
    });
  
    if (!exactMatch) {
      throw new Error('Exact track match not found');
    }
  
    // Get the specific track using track_id
    return this.getTrackLyrics(exactMatch.track.track_id);
  }

  private async makeRequest(url: string): Promise<any> {
    const fullUrl = this.base_url + url;
    const signedUrl = fullUrl + this.generateSignature(fullUrl);
    
    const response = await axios.get(signedUrl, {
      headers: this.headers,
      proxy: this.proxies ? {
        host: this.proxies.http?.split('://')[1].split(':')[0] || '',
        port: parseInt(this.proxies.http?.split(':').pop() || '0') || 0
      } : undefined,
      timeout: 5000
    });
    
    return response.data;
  }
}

export default MusixMatchAPI;

// Example usage
async function testMxM() {
  const api = new MusixMatchAPI();
  try {
    const exactTrack = await api.findExactTrackLyrics("Phantom Liberty", "Dawid Podsiadło");
    console.log(JSON.stringify(exactTrack, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testMxM();

