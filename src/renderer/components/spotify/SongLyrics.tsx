import './Styles/SongLyrics.css';
import { LrcLibApi } from '../../../services/LrcLibService';
import React, { useState, useEffect } from 'react';

interface Lyric {
  time: number;
  text: string;
}

interface SongLyricsProps {
  currentSong: {
    name: string;
    artist: string;
    album: string;
  };
  currentTime: number;
}

const SongLyrics: React.FC<SongLyricsProps> = ({ currentSong, currentTime }) => {
  const [lyrics, setLyrics] = useState<Array<{time: number, text: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  useEffect(() => {
    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const lrcLibApi = new LrcLibApi();
        
        // Log the search parameters
        console.log('Fetching lyrics for:', {
          track: currentSong.name,
          artist: currentSong.artist,
          album: currentSong.album
        });

        const lyricsData = await lrcLibApi.searchLyrics({
          artist: currentSong.artist,
          track: currentSong.name,
          album: currentSong.album
        });

        console.log('Lyrics data received:', lyricsData);

        if (lyricsData.syncedLyrics) {
          const parsedLyrics = lrcLibApi.parseSyncedLyrics(lyricsData.syncedLyrics);
          console.log('Parsed synced lyrics:', parsedLyrics);
          setLyrics(parsedLyrics);
        } else if (lyricsData.plaintext) {
          // Fallback to plain text if no synced lyrics
          const plainLyrics = lyricsData.plaintext.split('\n').map((text, index) => ({
            time: index * 5000, // Space lines 5 seconds apart
            text: text.trim()
          }));
          setLyrics(plainLyrics);
        } else {
          setError('No lyrics content found');
        }
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError('Error fetching lyrics');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have both song name and artist
    if (currentSong.name && currentSong.artist) {
      fetchLyrics();
    }
  }, [currentSong.name, currentSong.artist, currentSong.album]);


  useEffect(() => {
    if (lyrics.length > 0) {
      const index = lyrics.findIndex((lyric, i) => {
        const nextLyric = lyrics[i + 1];
        return (
          currentTime >= lyric.time &&
          (!nextLyric || currentTime < nextLyric.time)
        );
      });
      setCurrentLyricIndex(index);
    }
  }, [currentTime, lyrics]);

  if (loading) {
    return <div className="lyrics-container"><div className="loading">Loading lyrics...</div></div>;
  }

  if (error) {
    return <div className="lyrics-container"><div className="error">{error}</div></div>;
  }

  return (
    <div className="lyrics-container">
      <div className="lyrics-menu">
        {currentLyricIndex > 0 && (
          <div className="prev-lyric">
            {lyrics[currentLyricIndex - 1].text}
          </div>
        )}
        
        <div className="current-lyric">
          {currentLyricIndex >= 0 ? lyrics[currentLyricIndex].text : '♪'}
        </div>
        
        {currentLyricIndex < lyrics.length - 1 && (
          <div className="next-lyric">
            {lyrics[currentLyricIndex + 1].text}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongLyrics;