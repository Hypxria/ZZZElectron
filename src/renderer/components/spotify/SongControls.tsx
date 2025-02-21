import React, { useState, useRef, useEffect } from 'react';
import './Styles/SongControls.css';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';
import ElasticSlider from '../../ElasticSlider/ElasticSlider'
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';

interface SongControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

const SongControls: React.FC<SongControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  onPlayPause
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Update progress smoothly
  useEffect(() => {
    const updateProgress = () => {
      if (!isDragging && isPlaying) {
        const now = Date.now();
        const delta = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now;

        setSliderValue(prev => {
          const newValue = (currentTime / duration) * 100;
          return Number.isFinite(newValue) ? newValue : prev;
        });
      }
    };

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Set up new interval if playing
    if (isPlaying && !isDragging) {
      progressIntervalRef.current = setInterval(updateProgress, 50); // Update every 50ms
      lastUpdateTimeRef.current = Date.now();
    }

    // Cleanup function
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, isDragging, currentTime, duration]);

  useEffect(() => {
    if (!isDragging && duration > 0) {
      setSliderValue((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    updateProgressBar(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateProgressBar(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastUpdateTimeRef.current = Date.now();
  };

  const updateProgressBar = (e: React.MouseEvent) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      
      setSliderValue(percentage);
      onSeek((percentage / 100) * duration);
    }
  };

  // Buttons
  const handlePlayPause = () => {
    onPlayPause();
  };
  
  const handleSkip = () => {

  }

  const handleBack = () => {

  }

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
        onClick={handleSkip}
    >
      <SkipPreviousRoundedIcon className="back-icon" />
    </button>
  );

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
          onMouseLeave={handleMouseUp}
        >
          <span className="time-label time-label-left">{formatTime(currentTime)}</span>
          <div className="progress-bar-background">
            <div 
              className="progress-bar-fill"
              style={{ width: `${sliderValue}%` }}
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
