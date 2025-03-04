import React, { useState, useRef, useEffect } from 'react';
import './Styles/SongControls.css';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';

interface SongControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onBack: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const SongControls: React.FC<SongControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  onPlay,
  onPause,
  onNext,
  onBack,
  volume,
  onVolumeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Single updateProgress function for animation and seeking
  const updateProgress = () => {
    if (!isDragging && isPlaying) {
      const now = Date.now();
      lastUpdateTimeRef.current = now;

      setSliderValue(prev => {
        const newValue = (currentTime / duration) * 100;
        return Number.isFinite(newValue) ? newValue : prev;
      });
    }
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Use the updateProgress function in useEffect for animation
  useEffect(() => {
    // Start animation frame if playing
    if (isPlaying && !isDragging) {
      lastUpdateTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isDragging]);

  // Update slider when currentTime or duration changes if not dragging
  useEffect(() => {
    if (!isDragging) {
      const newValue = (currentTime / duration) * 100;
      setSliderValue(Number.isFinite(newValue) ? newValue : 0);
    }
  }, [currentTime, duration, isDragging]);

  const updateProgressBar = (e: React.MouseEvent | MouseEvent) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      setSliderValue(percentage);
    }
  };

  // Handle seeking when slider is released
  const handleSeek = () => {
    const seekTime = Math.floor((sliderValue / 100) * duration);
    onSeek(seekTime);
  };

  // Action Handler
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };
  
  const handleSkip = () => {
    onNext();
  }

  const handleBack = () => {
    onBack();
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateProgressBar(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateProgressBar(e);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      updateProgressBar(e);
      handleSeek();
    }
    setIsDragging(false);
    lastUpdateTimeRef.current = Date.now();
  };

  // Handle window-level mouse events when dragging
  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (isDragging) {
        handleSeek();
        setIsDragging(false);
        lastUpdateTimeRef.current = Date.now();
      }
    };
    
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDragging && progressBarRef.current) {
        updateProgressBar(e);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleWindowMouseUp);
      window.addEventListener('mousemove', handleWindowMouseMove);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [isDragging, sliderValue, duration]);

  // Buttons
  const songButton = (
    <button 
        className="song-button" 
        id="play"
        onClick={handlePlayPause}
    >
        {isPlaying ? (
            <PauseIcon className="control-icon" />
        ) : (
            <PlayArrowIcon className="control-icon" />
        )}
    </button>
  );

  const skipButton = (
    <button 
        className="skip-button" 
        id="skip"
        onClick={handleSkip}
    >
      <SkipNextRoundedIcon className="skip-icon" />
    </button>
  );

  const backButton = (
    <button 
        className="back-button" 
        id="back"
        onClick={handleBack}
    >
      <SkipPreviousRoundedIcon className="back-icon" />
    </button>
  );

  // Misc
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-controls">
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-container"
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <span className="time-label time-label-left">{formatTime(currentTime)}</span>
          <div className="progress-bar-background">
          <div 
            className="progress-bar-fill"
            style={{ transform: `scaleX(${sliderValue / 100})` }}
          />
            <div 
              className="progress-bar-handle"
              style={{ left: `${sliderValue}%` }}
            />
          </div>
          <span className="time-label time-label-right">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="song-button-container">
        {backButton}
        {songButton}
        {skipButton}
      </div>
    </div>
  );
};  

export default SongControls;