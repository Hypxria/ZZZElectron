import React, { useEffect, useState, useRef, useCallback } from "react";

import SongInfo from "./SongInfo";
import SongControls from "./SongControls";
import SongUpcoming from "./SongUpcoming";
import SongBackground from "./SongBackground";
import SongLyrics from "./SongLyrics";
import SongVolume from "./SongVolume";

import "./Styles/Main.scss";
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
    repeat_state: 0,
  });

  const [nextTrackData, setNextTrackData] = useState<Song>({
    name: "",
    artist: "",
    album_cover: "",
  });

  const [localProgress, setLocalProgress] = useState<number>(0);

  const [hasInitialData, setHasInitialData] = useState(false);

  const manualStateUpdateRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const progressRef = useRef<number>(0); // Add a ref to track between renders

  // CurrentTrack Tracking
  useEffect(() => {
    isMountedRef.current = true;

    const fetchCurrentTrack = async () => {
      try {
        if (Date.now() - manualStateUpdateRef.current < 2000) return;

        const track = await spotifyService.getCurrentTrack();
        if (track) {
          setCurrentTrackData(prev => {
            if (prev.name === track.name &&
              prev.artist === track.artist &&
              prev.duration_ms === track.duration_ms &&
              prev.is_playing === track.is_playing &&
              prev.volume === track.volume &&
              prev.repeat_state === track.repeat_state &&
              prev.shuffle_state === track.shuffle_state) {
                window.electron.window.windowTitle(`Iris - ${prev.name}, ${prev.artist}`)
              return prev;
            }
            // Exclude progress_ms from the update
            const { progress_ms, ...trackWithoutProgress } = track;
            return { ...prev, ...trackWithoutProgress };
          })
          if (!hasInitialData) setHasInitialData(true);
        }
      } catch (error) {
        console.error("Error fetching track:", error);
      }
    };


    fetchCurrentTrack();

    const pollInterval = setInterval(fetchCurrentTrack, 250);

    return () => {
      isMountedRef.current = false;
      clearInterval(pollInterval);
    };
  }, [currentTrackData.is_playing, currentTrackData.duration_ms]);

  useEffect(() => {
    // Immediate sync with current progress
    if (spotifyService.currentProgress?.progress_ms) {
      setLocalProgress(spotifyService.currentProgress.progress_ms);
    }
  }, []); // Run once on mount

  // Regular progress tracking effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined
    var justInTimeout: boolean = false

    const updateProgress = async () => {
      const timeSinceManualUpdate = Date.now() - manualStateUpdateRef.current;

      // console.log('Update Progress Check:', {
      //   currentTime: Date.now(),
      //   manualStateUpdateTime: manualStateUpdateRef.current,
      //   timeSinceManualUpdate,
      //   shouldSkip: timeSinceManualUpdate < 200
      // });

      if (timeSinceManualUpdate < 200) {
        const remainingWait = 200 - timeSinceManualUpdate;
        console.log(`Waiting for ${remainingWait}ms before resuming updates`);

        if (timeoutId) clearTimeout(timeoutId);


        justInTimeout = true
        // Wait for the remaining time
        await new Promise(resolve => setTimeout(resolve, remainingWait));

      } else {
        if (justInTimeout) {
          justInTimeout = false
          // console.log('Resuming updates');
        }
      }

      // console.log('updating')

      const serviceProgress = spotifyService.currentProgress?.progress_ms ?? 0;

      // console.log('Progress Update:', {
      // serviceProgress,
      // currentLocalProgress: localProgress,
      // refProgress: progressRef.current,
      // stateUpdateTriggered: serviceProgress !== progressRef.current
      // });

      if (serviceProgress !== progressRef.current) {
        progressRef.current = serviceProgress;
        setLocalProgress(serviceProgress);
      }
    };

    // Run immediately
    updateProgress();

    const interval = setInterval(updateProgress, 100);
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Remove localProgress from dependencies



  useEffect(() => {
    // console.log('Local progress state updated:', {
    // newValue: localProgress,
    // refValue: progressRef.current
    // });
  }, [localProgress]);




  // NextTrack tracking
  const initialNextTrack = useCallback(async () => {
    // console.log("initialNextTrack called");
    try {
      const nextTrack = await spotifyService.getNextSong();
      // console.log(`next track:${nextTrack}`)
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
        // console.log(`next track:${nextTrack}`)
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
      setLocalProgress(boundedSeekTime);
      await spotifyService.seek(boundedSeekTime);
    } catch (error) {
      console.error("Failed to seek:", error);
    }
  };






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
      <div className="section-content">
        <div className="song-info">
          <SongInfo
            currentSong={{
              name: currentTrackData.name || "No track playing",
              artist: currentTrackData.artist || "No artist",
              album_cover: currentTrackData.album_cover || "sex",
              year: currentTrackData.year || "N/A",
            }}
            colors={colors}
            SongVolume={() => (
              <SongVolume
                volume={currentTrackData.volume || 0}
                onVolumeChange={async (volume: number) => {
                  manualStateUpdateRef.current = Date.now();
                  setCurrentTrackData((prev) => ({ ...prev, volume }));
                  await spotifyService.setVolume(volume);
                }}
              />
            )}
          />
          <SongControls
            isPlaying={currentTrackData.is_playing || false}
            currentTime={
              Date.now() - manualStateUpdateRef.current < 200
                ? localProgress
                : (spotifyService.currentProgress?.progress_ms ?? 0)
            }
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
                }
              } catch (error) {
                console.error("Error during back operation:", error);
              }
            }}
            onShuffle={async () => {
              manualStateUpdateRef.current = Date.now();
              setCurrentTrackData((prev) => ({ ...prev, shuffle_state: (!prev.shuffle_state) }));
              await spotifyService.toggleShuffle()
            }}
            onLoop={async () => {
              manualStateUpdateRef.current = Date.now();
              setCurrentTrackData((prev) => ({ ...prev, repeat_state: ((prev.repeat_state ?? 0) + 1) % 3 }));
              await spotifyService.toggleRepeatMode()
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
            shuffle={currentTrackData.shuffle_state || false}
            loop={currentTrackData.repeat_state || 0}
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
              currentSong={{
                name: currentTrackData.name || "",
                artist: currentTrackData.artist || "",
                album: currentTrackData.album || "",
              }}
              currentTime={
                Date.now() - manualStateUpdateRef.current < 200
                  ? localProgress
                  : (spotifyService.currentProgress?.progress_ms ?? 0)
              }
              viewState={viewState.ViewState}
              colors={colors}
              onSeek={handleSeek}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyMain;
