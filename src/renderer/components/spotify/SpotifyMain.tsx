// src/renderer/components/spotify/SpotifyMain.tsx
import React, { useEffect, useState }  from 'react';
import SongInfo from './SongInfo';
import SongControls from './SongControls';
import SongUpcoming from './SongUpcoming';
import './Styles/Main.css';
import '../../../main/SpotifyService'
import { spotifyService, Song } from '../../../main/SpotifyService';

interface SpotifyMainProps {
  // Add any props if needed in the future
}

const SpotifyMain: React.FC<SpotifyMainProps> = () => {
  const [currentTrackData, setCurrentTrackData] = useState<Song | null>({
    name: '',
    artist: '',
    album_cover: '',
    year:'',
    is_playing: false,
    progress_ms: 0,
    duration_ms: 0,
  });

  const [nextTrackData, setNextTrackData] = useState<Song | null>({
    name: '',
    artist: '',
    album_cover: '',
  });


  const [nextTrack] = useState<Song | null>(null);
  const [lyrics] = useState<string[]>([]);

  
  useEffect(() => {
    const fetchCurrentTrack = async () => {
      try {
        let track = await spotifyService.getCurrentTrack();
        

        setCurrentTrackData({
          name: track.name,
          artist: track.artist,
          album_cover: track.album_cover,
          year: track.year,
          is_playing: track.is_playing,
          progress_ms: track.progress_ms,
          duration_ms: track.duration_ms,
        });

        

      } catch (error) {

        console.error('Error fetching track:', error);

      }
    };

    // Set up polling to update track information regularly
    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 1000); // Updates every second

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNextTrack = async () => {
      try {
        let nextTrack = await spotifyService.getNextSong();
        setNextTrackData({
          name: nextTrack.name,
          artist: nextTrack.artist,
          album_cover: nextTrack.album_cover,
        });
      } catch (error) {
        console.error('Error fetching next track:', error);
      }
    };

    fetchNextTrack();
  }, [currentTrackData?.name]); // Only re-run when the current track name changes

  
  return (
    <div className="spotify">
      <div className="undercover"></div>
      <div className="song-info">
        <SongInfo currentSong={{
            name: currentTrackData?.name || 'Failed',
            artist: currentTrackData?.artist || '',
            album_cover: currentTrackData?.album_cover || '',
            year: currentTrackData?.year || ''
          }} 
        />
        <SongControls
        isPlaying={currentTrackData?.is_playing || false}
        currentTime={currentTrackData?.progress_ms || 0}
        duration={currentTrackData?.duration_ms || 0}
        />
      </div>
      <SongUpcoming 
        nextSong={{
          id: '1',
          title: nextTrackData?.name || 'Failed',
          artist: nextTrackData?.artist || '',
          albumCover: nextTrackData?.album_cover || ''
        }}
      />
    </div>
  );
};

export default SpotifyMain;
