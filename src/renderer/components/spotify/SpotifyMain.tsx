import React, { useEffect, useState, useRef } from 'react';
import SongInfo from './SongInfo';
import SongControls from './SongControls';
import SongUpcoming from './SongUpcoming';
import SongBackground from './SongBackground';
import SongLyrics from './SongLyrics';
import './Styles/Main.css';
import { spotifyService, Song } from '../../../services/SpotifyService';

interface SpotifyMainProps {
  // Add any props if needed in the future
}

spotifyService.authorize()

const SpotifyMain: React.FC<SpotifyMainProps> = () => {
  // console.log('SpotifyMain component rendered')
  const [currentTrackData, setCurrentTrackData] = useState<Song>({
    name: '',
    artist: '',
    album_cover: '',
    year: '',
    is_playing: false,
    progress_ms: 0,
    duration_ms: 0,
    volume: 10,
    repeat_state: 'off',
  });

  const [nextTrackData, setNextTrackData] = useState<Song>({
    name: '',
    artist: '',
    album_cover: '',
  });

  const [localProgress, setLocalProgress] = useState<number>(0);
  const [hasInitialData, setHasInitialData] = useState(false);

  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  const manualStateUpdateRef = useRef<number>(0);

  // CurrentTrack Tracking
  useEffect(() => {
    let isComponentMounted = true;

    const fetchCurrentTrack = async () => {
      try {
        
        if (Date.now() - manualStateUpdateRef.current < 2000) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Skipping fetch due to manual state update');
          }
          return;
        }

        console.log('Fetching track')
        const track = await spotifyService.getCurrentTrack();
        if (track) {
          setCurrentTrackData(track);
          setHasInitialData(true); // Set this flag after first successful API response
        }

        console.log('Track fetched:', track.name);
        if (!isComponentMounted) return;

        
        if (Date.now() - manualStateUpdateRef.current > 2000) {
          setCurrentTrackData(track);
          console.log(track.volume)
          progressRef.current = track.progress_ms || 0;
        } else {
          // Update everything except the progress during debounce period
          setCurrentTrackData(prev => ({
            ...track,
            progress_ms: progressRef.current // Keep our local progress
          }));
        }
        

        
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
      
      if (elapsed > 0) {
        progressRef.current = Math.min(
          progressRef.current + elapsed,
          currentTrackData.duration_ms || 0
        );
        setLocalProgress(Math.round(progressRef.current));
      }
      
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    // Initial fetch and start animation
    fetchCurrentTrack();
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    // Set up polling interval for track updates
    const pollInterval = setInterval(fetchCurrentTrack, 500);

   

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
      lastTimeRef.current = performance.now(); // Add this line to reset the time reference
      
      manualStateUpdateRef.current = Date.now();

      // Call Spotify API to seek
      await spotifyService.seek(seekTime);
      
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  console.log(`Song Details- ${currentTrackData.name}, ${currentTrackData.artist}, ${currentTrackData.album}`)

  return (
    <div className="spotify">
      <SongBackground coverUrl={currentTrackData.album_cover || ''} />
      <div className="song-info">
        <SongInfo
          currentSong={{
            name: currentTrackData.name || 'No track playing',
            artist: currentTrackData.artist || 'No artist',
            album_cover: currentTrackData.album_cover || 'sex',
            year: currentTrackData.year || 'N/A'
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
            setCurrentTrackData(prev => ({ ...prev, is_playing: true }));
            await spotifyService.playPreviousSong();
            
          }} 
          onNext={async () => {
            setCurrentTrackData(prev => ({ ...prev, is_playing: true }));
            await spotifyService.playNextSong();
          }}
          onSeek={handleSeek}
          volume={currentTrackData.volume || 0}
          onVolumeChange={async (volume: number) => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData(prev => ({ ...prev, volume }));
            await spotifyService.setVolume(volume);
          }}
          albumCover={currentTrackData.album_cover || 'sex'}
        />
      </div>
      <SongUpcoming
        nextSong={{
          id: '1',
          title: nextTrackData.name || 'No upcoming track',
          artist: nextTrackData.artist || 'None',
          albumCover: nextTrackData.album_cover || 'sex'
        }}
      />
      {hasInitialData && (
          <div className="song-lyrics">
            <SongLyrics
              currentSong={{
                name: currentTrackData.name || 'No track playing',
                artist: currentTrackData.artist || 'No artist',
                album: currentTrackData.album || '',
              }}
              currentTime={localProgress || 0}
            />
          </div>
        )}
    </div>
  );
};

export default SpotifyMain;
