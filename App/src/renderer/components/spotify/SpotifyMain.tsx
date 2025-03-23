import React, { useEffect, useState, useRef, useCallback } from "react";
import SongInfo from "./SongInfo";
import SongControls from "./SongControls";
import SongUpcoming from "./SongUpcoming";
import SongBackground from "./SongBackground";
import SongLyrics from "./SongLyrics";
import "./Styles/Main.css";
import { spotifyService, Song } from "../../../services/spotifyServices/SpotifyService";
import { ViewState } from "../../../types/viewState";
import { ColorExtractor } from '../../../utils/ColorExtractor'

interface SpotifyMainProps {
  ViewState: ViewState
}

spotifyService.startLinkWs();


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
  const manualStateUpdateRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  let lastCallName = '';

  // CurrentTrack Tracking
  useEffect(() => {
    isMountedRef.current = true;

    const syncProgress = async () => {
      try {
        const track = currentTrackData;
        if (track && Math.abs((track.progress_ms || 0) - progressRef.current) > 1000) {
          progressRef.current = track.progress_ms || 0;
          setLocalProgress(track.progress_ms || 0);
          lastTimeRef.current = performance.now();
        }
      } catch (error) {
        console.error("Error syncing progress:", error);
      }
    };

    const fetchCurrentTrack = async () => {
      try {
        if (Date.now() - manualStateUpdateRef.current < 2000) return;

        const track = await spotifyService.getCurrentTrack();
        if (track) {
          setCurrentTrackData(prev => {
            if (prev.name === track.name && prev.artist === track.artist && 
               prev.duration_ms === track.duration_ms && prev.is_playing === track.is_playing) {
              return prev;
            }
            return { ...prev, ...track };
          });
          progressRef.current = track.progress_ms || 0;
          lastCallName = track.name || "";
          if (!hasInitialData) setHasInitialData(true);
        }
      } catch (error) {
        console.error("Error fetching track:", error);
      }
    };

    const updateProgress = () => {
      if (!currentTrackData.is_playing || !isMountedRef.current) {
        return;
      }
  
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      lastTimeRef.current = now;
  
      if (elapsed > 0) {
        const newProgress = Math.min(
          progressRef.current + elapsed,
          currentTrackData.duration_ms || 0
        );
        
        progressRef.current = newProgress;
        setLocalProgress(Math.round(newProgress));
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    fetchCurrentTrack();
    animationFrameRef.current = requestAnimationFrame(updateProgress);

    const pollInterval = setInterval(fetchCurrentTrack, 2000);
    const syncInterval = setInterval(syncProgress, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
      clearInterval(syncInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }  
    };
  }, [currentTrackData.is_playing, currentTrackData.duration_ms]);

  // NextTrack tracking
  const initialNextTrack = useCallback(async () => {
    try {
      const nextTrack = await spotifyService.getNextSong();
      setNextTrackData(nextTrack);
    } catch (error) {
      console.error("Error fetching next track:", error);
    }
  }, []);

  useEffect(() => {
    initialNextTrack();
    const debounceTimeout = setTimeout(async () => {
      try {
        const nextTrack = await spotifyService.getNextSong();
        setNextTrackData(prev => {
          if (prev.name === nextTrack.name && prev.artist === nextTrack.artist) return prev;
          return nextTrack;
        });
      } catch (error) {
        console.error("Error fetching next track:", error);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [currentTrackData.name, initialNextTrack]);

  const handleSeek = async (seekTime: number) => {
    try {
      const boundedSeekTime = Math.min(seekTime, currentTrackData.duration_ms || 0);
      manualStateUpdateRef.current = Date.now();
      progressRef.current = boundedSeekTime;
      setLocalProgress(boundedSeekTime);
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
          colors={colors}
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
            try {
              setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
              await spotifyService.playPreviousSong();
              // Add delay and fetch
              const track = await spotifyService.getCurrentTrack();
              if (track) {
                setCurrentTrackData(track);
                setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
                progressRef.current = track.progress_ms || 0;
                lastCallName = track.name || "";
              }
            } catch (error) {
              console.error("Error during back operation:", error);
            }
          }}
          
          onNext={async () => {
            try {
              setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
              await spotifyService.playNextSong();
              // Add delay and fetch
              const track = await spotifyService.getCurrentTrack();
              if (track) {
                setCurrentTrackData(track);
                setCurrentTrackData((prev) => ({ ...prev, is_playing: true }));
                progressRef.current = track.progress_ms || 0;
                lastCallName = track.name || "";
              }
            } catch (error) {
              console.error("Error during back operation:", error);
            }
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
            onSeek={handleSeek}
          />
        </div>
      )}
    </div>
  );
};

export default SpotifyMain;
