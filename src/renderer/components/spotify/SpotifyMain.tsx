import React, { useEffect, useState, useRef } from "react";
import SongInfo from "./SongInfo";
import SongControls from "./SongControls";
import SongUpcoming from "./SongUpcoming";
import SongBackground from "./SongBackground";
import SongLyrics from "./SongLyrics";
import "./Styles/Main.css";
import { spotifyService, Song } from "../../../services/SpotifyService";
import { ViewState } from "../../../types/viewState";
import { ColorExtractor } from '../../../utils/ColorExtractor'

interface SpotifyMainProps {
  ViewState: ViewState
}

spotifyService.authorize();

const SpotifyMain: React.FC<SpotifyMainProps> = (
  viewState
) => {
  const [currentTrackData, setCurrentTrackData] = useState<Song>({
    name: "",
    artist: "",
    album_cover: "",
    year: "",
    is_playing: false,
    progress_ms: 0,
    duration_ms: 0,
    volume: 0,
    repeat_state: "off",
  });

  const [nextTrackData, setNextTrackData] = useState<Song>({
    name: "",
    artist: "",
    album_cover: "",
  });
  

  const [localProgress, setLocalProgress] = useState<number>(0);
  const [hasInitialData, setHasInitialData] = useState(false);

  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  const manualStateUpdateRef = useRef<number>(0);

  let lastCallName = '';

  // CurrentTrack Tracking
  useEffect(() => {
    let isComponentMounted = true;

    const fetchCurrentTrack = async () => {
      try {
        if (Date.now() - manualStateUpdateRef.current < 2000) {
          if (process.env.NODE_ENV === "development") {
            console.log("Skipping fetch due to manual state update");
          }
          return;
        }

        console.log("Fetching track");

        const track = await spotifyService.getCurrentTrack();
        if (track) {
          setCurrentTrackData(track);
          progressRef.current = track.progress_ms || 0;
          lastCallName = track.name || "";
          setHasInitialData(true);
        }

        console.log("Track fetched:", track.name);
        if (!isComponentMounted) return;

      } catch (error) {
        console.error("Error fetching track:", error);
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
        // Make sure we're not exceeding the duration
        const newProgress = Math.min(
          progressRef.current + elapsed,
          currentTrackData.duration_ms || 0
        );
        
        // Reset progress if we've reached the end
        if (newProgress >= (currentTrackData.duration_ms || 0)) {
          progressRef.current = currentTrackData.duration_ms || 0;
        } else {
          progressRef.current = newProgress;
        }
        
        setLocalProgress(Math.round(progressRef.current));
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    // Initial fetch and start animation
    fetchCurrentTrack();
    lastTimeRef.current = performance.now(); // Reset the time reference
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
    };
  }, [currentTrackData.is_playing]);

  // NextTrack tracking

  const initialNextTrack = async () => {
    try {
      const nextTrack = await spotifyService.getNextSong();
      setNextTrackData(nextTrack);
    } catch (error) {
      console.error("Error fetching next track:", error);
    }
  };

  useEffect(() => {
    let isComponentMounted = true;
    let debounceTimeout: NodeJS.Timeout;

    const fetchNextTrack = async () => {
      try {
        if (!isComponentMounted) return;

        if (currentTrackData.name !== lastCallName || "") {
          const nextTrack = await spotifyService.getNextSong();
          setNextTrackData(nextTrack);
        }
      } catch (error) {
        console.error("Error fetching next track:", error);
      }
    };

    // It is also used in non initial contexts XD

    initialNextTrack();
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
      const boundedSeekTime = Math.min(seekTime, currentTrackData.duration_ms || 0);
  
      // Set manual update ref FIRST
      manualStateUpdateRef.current = Date.now();
  
      // Update state with new position
      setCurrentTrackData(prev => ({
        ...prev,
        progress_ms: boundedSeekTime,
        is_playing: true
      }));
      
      // Update local progress tracking
      progressRef.current = boundedSeekTime;
      lastTimeRef.current = performance.now();
      setLocalProgress(boundedSeekTime);
  
      // Call Spotify API
      await spotifyService.seek(boundedSeekTime);
  
    } catch (error) {
      console.error("Failed to seek:", error);
    }
  };
  
  

  console.log(
    `Song Details- ${currentTrackData.name}, ${currentTrackData.artist}, ${currentTrackData.album}`
  );
  
  // Getting Avg Colors
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const getColors = async () => {
      if (!currentTrackData.album_cover) return; // Early return if no album cover

      try {
        const palette = await ColorExtractor.from(currentTrackData.album_cover);
        const extractedColors = [
          palette.Vibrant?.hex, // [0]
          palette.LightVibrant?.hex, // [1]
          palette.DarkVibrant?.hex, // [2]
          palette.Muted?.hex, // [3]
          palette.LightMuted?.hex, // [4]
          palette.DarkMuted?.hex, // [5]
        ].filter((color): color is string => !!color);

        setColors(extractedColors); // Set the state with extracted colors
      } catch (error) {
        console.error('Error extracting colors:', error);
      }
    };

    getColors();
  }, [currentTrackData.album_cover]);
  
  

  return (
    <div className="spotify">
      <SongBackground coverUrl={currentTrackData.album_cover || ""} />
      <div className="song-info">
        <SongInfo
          currentSong={{
            name: currentTrackData.name || "No track playing",
            artist: currentTrackData.artist || "No artist",
            album_cover: currentTrackData.album_cover || "sex",
            year: currentTrackData.year || "N/A",
          }}
        />
        <SongControls
          isPlaying={currentTrackData.is_playing || false}
          currentTime={localProgress}
          duration={currentTrackData.duration_ms || 0}
          onPlay={() => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
            spotifyService.resumePlayback();
          }}
          onPause={() => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData((prev) => ({ ...prev, is_playing: false }));
            spotifyService.pausePlayback();
          }}
          onBack={async () => {
            setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
            await spotifyService.playPreviousSong();
          }}
          onNext={async () => {
            initialNextTrack();
            await spotifyService.playNextSong();
            setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
          }}
          onSeek={handleSeek}
          volume={currentTrackData.volume || 0}
          onVolumeChange={async (volume: number) => {
            manualStateUpdateRef.current = Date.now();
            setCurrentTrackData((prev) => ({ ...prev, volume }));
            await spotifyService.setVolume(volume);
          }}
          albumCover={currentTrackData.album_cover || "sex"}
          colors={colors}  
        />
      </div>
      <SongUpcoming
        nextSong={{
          id: "1",
          title: nextTrackData.name || "No upcoming track",
          artist: nextTrackData.artist || "None",
          albumCover: nextTrackData.album_cover || "sex",
        }}
      />
      {hasInitialData && (
        <div className="song-lyrics">
          <SongLyrics
            currentSong = {{
              name: currentTrackData.name || "",
              artist: currentTrackData.artist || "",
              album: currentTrackData.album || "",
            }}
            currentTime = {localProgress || 0}
            viewState = {viewState.ViewState}
            colors={colors}  
          />
        </div>
      )}
    </div>
  );
};

export default SpotifyMain;
