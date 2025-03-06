import React, { useEffect, useState, useRef } from 'react';
import SongInfo from './SongInfo';
import SongControls from './SongControls';
import SongUpcoming from './SongUpcoming';
import './Styles/Main.css';
import { spotifyService, Song } from '../../../services/SpotifyService';

interface SpotifyMainProps {
  // Add any props if needed in the future
}

const SpotifyMain: React.FC<SpotifyMainProps> = () => {
  const [currentTrackData, setCurrentTrackData] = useState<Song>({
    name: '',
    artist: '',
    album_cover: '',
    year: '',
    is_playing: false,
    progress_ms: 0,
    duration_ms: 0,
  });

  const [nextTrackData, setNextTrackData] = useState<Song>({
    name: '',
    artist: '',
    album_cover: '',
  });

  const [localProgress, setLocalProgress] = useState<number>(0);
  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  const manualStateUpdateRef = useRef<number>(0);

  let escapedManual = false
  
  // CurrentTrack Tracking
  useEffect(() => {
    let isComponentMounted = true;
    let lastTrackName = currentTrackData.name;
    let lastPlayingState = currentTrackData.is_playing;

    const fetchCurrentTrack = async () => {
      try {
        
        if (Date.now() - manualStateUpdateRef.current < 1000) {
          escapedManual = true
          console.log('Skipping fetch due to manual state update')
          return;
        }
        console.log('Fetching track')
        const track = await spotifyService.getCurrentTrack();
        if (!isComponentMounted) return;

        if (track.name !== lastTrackName || track.is_playing !== lastPlayingState || escapedManual) {
          setCurrentTrackData(track);
          progressRef.current = track.progress_ms || 0;
          lastTrackName = track.name;
          lastPlayingState = track.is_playing;
        }
        escapedManual = false
      } catch (error) {
        console.error('Error fetching track:', error);
      }
    };

    const updateProgress = () => {
      if (!currentTrackData.is_playing) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      }
      
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;

      progressRef.current = Math.min(
        progressRef.current + elapsed,
        currentTrackData.duration_ms || 0
      );
      setLocalProgress(Math.round(progressRef.current));
      
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    // Initial fetch and start animation
    fetchCurrentTrack();
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    // Set up polling interval for track updates
    const pollInterval = setInterval(fetchCurrentTrack, 500);

    const repeat = setInterval

    // Cleanup function
    return () => {
      isComponentMounted = false;
      clearInterval(pollInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateTimeoutRef.current) {
        cancelAnimationFrame(updateTimeoutRef.current);
      }
    };
  }, [currentTrackData.is_playing]);


  // NextTrack tracking
  useEffect(() => {
    let isComponentMounted = true;
    let debounceTimeout: NodeJS.Timeout;

    const fetchNextTrack = async () => {
      try {
        const nextTrack = await spotifyService.getNextSong();
        if (!isComponentMounted) return;

        if (nextTrack.name !== nextTrackData.name) {
          setNextTrackData(nextTrack);
        }
      } catch (error) {
        console.error('Error fetching next track:', error);
      }
    };

    // Debounce the next track fetch to avoid unnecessary API calls
    debounceTimeout = setTimeout(fetchNextTrack, 300);

    return () => {
      isComponentMounted = false;
      clearTimeout(debounceTimeout);
    };
  }, [currentTrackData.name, nextTrackData.name]);

  // Handles
  
  const handleSeek = async (seekTime: number) => {
    try {
      // Update local state immediately for smooth UI
      setLocalProgress(seekTime);
      progressRef.current = seekTime;
      
      // Call Spotify API to seek
      await spotifyService.seek(seekTime);
      
      // Mark as manual update to prevent immediate fetch override
      manualStateUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  return (
    <div className="spotify">
      <div className="undercover"></div>
      <div className="song-info">
        <SongInfo
          currentSong={{
            name: currentTrackData.name || 'No track playing',
            artist: currentTrackData.artist || '',
            album_cover: currentTrackData.album_cover || '',
            year: currentTrackData.year || ''
          }}
        />
        <SongControls
          isPlaying={currentTrackData.is_playing || false}
          currentTime={localProgress}
          duration={currentTrackData.duration_ms || 0}
          onPlay={() => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData(prev => ({ ...prev, is_playing: true }));
            spotifyService.resumePlayback();
          }}
          onPause={() => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData(prev => ({ ...prev, is_playing: false }));
            spotifyService.pausePlayback();
          }}
          onBack={async () => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData(prev => ({ ...prev, is_playing: true }));
            await spotifyService.playPreviousSong();
            
          }} 
          onNext={async () => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData(prev => ({ ...prev, is_playing: true }));
            await spotifyService.playNextSong();
          }}
          onSeek={handleSeek}
        />
      </div>
      <SongUpcoming
        nextSong={{
          id: '1',
          title: nextTrackData.name || 'No upcoming track',
          artist: nextTrackData.artist || '',
          albumCover: nextTrackData.album_cover || ''
        }}
      />
    </div>
  );
};

export default SpotifyMain;
