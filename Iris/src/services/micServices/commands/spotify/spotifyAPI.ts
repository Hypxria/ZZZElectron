import axios from 'axios';

// Cache for search results to avoid redundant API calls
const searchCache = new Map<string, {uri: string, timestamp: number}>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100;

export async function search(q: string, token: string) {
    try {
        // Normalize query for better cache hits
        const normalizedQuery = q.toLowerCase().trim();
        
        // Check cache first
        const cachedResult = searchCache.get(normalizedQuery);
        if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
            console.log('Using cached Spotify search result for:', normalizedQuery);
            return cachedResult.uri;
        }
        
        // Prepare request with optimized parameters
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: {
                q: normalizedQuery,
                type: 'track,album',
                limit: 1,
                market: 'from_token' // Use user's market for better results
            }
        };

        // Make the API request with timeout
        const response = await axios.get('https://api.spotify.com/v1/search', {
            ...config,
            timeout: 5000 // 5 second timeout
        });
        
        // Extract URI from response
        const uri = response.data?.tracks?.items[0]?.uri;
        
        if (uri) {
            // Cache the result
            cacheSearchResult(normalizedQuery, uri);
            return uri;
        } else {
            throw new Error('No tracks found for query: ' + q);
        }
    } catch (error) {
        console.error('Spotify search error:', error);
        
        // If we have a cached result, use it as fallback even if expired
        const cachedResult = searchCache.get(q.toLowerCase().trim());
        if (cachedResult) {
            console.log('Using expired cache as fallback for:', q);
            return cachedResult.uri;
        }
        
        throw error;
    }
}

// Helper function to manage the search cache
function cacheSearchResult(query: string, uri: string): void {
    // Implement LRU cache - remove oldest entries if cache is full
    if (searchCache.size >= MAX_CACHE_SIZE) {
        // Find and delete oldest entry
        let oldestKey = '';
        let oldestTime = Date.now();
        
        for (const [key, value] of searchCache.entries()) {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            searchCache.delete(oldestKey);
        }
    }
    
    // Add new entry to cache
    searchCache.set(query, {
        uri,
        timestamp: Date.now()
    });
}