import React, { useEffect, useState, useRef } from 'react';
import SongInfo from './SongInfo';
import SongControls from './SongControls';
import SongUpcoming from './SongUpcoming';
import './Styles/Main.css';
import { spotifyService, Song } from '../../../main/SpotifyService';

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

  useEffect(() => {
    let isComponentMounted = true;

    const fetchCurrentTrack = async () => {
      try {
        const track = await spotifyService.getCurrentTrack();
        if (!isComponentMounted) return;

        setCurrentTrackData(track);
        progressRef.current = track.progress_ms || 0;
      } catch (error) {
        console.error('Error fetching track:', error);
      }
    };

    const updateProgress = () => {
      if (!currentTrackData.is_playing) return;

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
    const pollInterval = setInterval(fetchCurrentTrack, 1000);

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

  useEffect(() => {
    let isComponentMounted = true;

    const fetchNextTrack = async () => {
      try {
        const nextTrack = await spotifyService.getNextSong();
        if (!isComponentMounted) return;

        setNextTrackData(nextTrack);
      } catch (error) {
        console.error('Error fetching next track:', error);
      }
    };

    fetchNextTrack();

    return () => {
      isComponentMounted = false;
    };
  }, [currentTrackData.name]);

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
