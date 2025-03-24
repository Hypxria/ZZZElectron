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
  albumCover: string;
  colors: string[];
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
  colors,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [displayTime, setDisplayTime] = useState(currentTime);

  const lyricsStyle = {
    '--average-color': colors?.[0] || '#ffffff',
    '--brighter-color': colors?.[1] || '#cccccc',
    '--dimmer-color': colors?.[5] || '#999999',
  } as React.CSSProperties;

// Progress Bar
  useEffect(() => {
    if (!isDragging) {
      setSliderValue((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);

  // Make updateProgress accessible outside useEffect
  const updateProgressBar = (e: React.MouseEvent) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.min(Math.max((x / width) * 100, 0), 100);
      setSliderValue(percentage);
      // Update display time while dragging
      setDisplayTime(Math.floor((percentage / 100) * duration));
    }
  };


  // weird volume slider things
  useEffect(() => {
    const positionVolumeControl = () => {
      const songImage = document.getElementById('song-image');
      const volumeControl = document.querySelector('.volume-control-wrapper') as HTMLElement;
      const controls = document.querySelector('.song-controls') as HTMLElement;
      const volumeBar = document.querySelector('.volume-slider-container') as HTMLElement;

      if (songImage && volumeControl) {
        const imageRect = songImage.getBoundingClientRect();
        const controlsRect = controls.getBoundingClientRect();
        volumeControl.style.position = 'absolute'; // Change to absolute
        volumeControl.style.left = `${imageRect.width+15}px`;
        volumeControl.style.top = `${-imageRect.height * 0.5 - controlsRect.height}px`; 
        volumeControl.style.transformOrigin = `left`

        volumeBar.style.width = `${imageRect.height-28*2}px`

        volumeControl.style.transform = 'rotate(90deg) translate(-55%, -0%)'        
      }
    };
  
    positionVolumeControl();
    window.addEventListener('resize', positionVolumeControl);
    
    return () => {
      window.removeEventListener('resize', positionVolumeControl);
    };
  }, []);

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
    window.electron.log(`${currentTime/1000}`)
    if (currentTime/1000 < 3) {
      onBack();
      return;
    } 
    onSeek(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
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
      const seekTime = Math.floor((sliderValue / 100) * duration);
      onSeek(seekTime);
    }
    setIsDragging(false);
    setDisplayTime(currentTime);
  };


  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);


  const updateVolumeFromMouseEvent = (e: MouseEvent | React.MouseEvent) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    if (!isDraggingVolume){
      onVolumeChange(percentage);
    }
  };
  
  useEffect(() => {
    const handleVolumeDrag = (e: MouseEvent) => {
      if (isDraggingVolume) {
        updateVolumeFromMouseEvent(e);
      }
    };
  
    const handleMouseUp = () => {
      setIsDraggingVolume(false);
      document.removeEventListener('mousemove', handleVolumeDrag);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  
    if (isDraggingVolume) {
      document.addEventListener('mousemove', handleVolumeDrag);
      document.addEventListener('mouseup', handleMouseUp);
    }
  
    return () => {
      document.removeEventListener('mousemove', handleVolumeDrag);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume, onVolumeChange]);
  
  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    setIsDraggingVolume(true);
    updateVolumeFromMouseEvent(e);
  };
  


  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateProgressBarTouch(e);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      updateProgressBarTouch(e);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging) {
      updateProgressBarTouch(e);
      const seekTime = Math.floor((sliderValue / 100) * duration);
      onSeek(seekTime);
    }
    setIsDragging(false);
    setDisplayTime(currentTime);
  };
  
  // Add this new function to handle touch coordinates
  const updateProgressBarTouch = (e: React.TouchEvent) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      // For touchend, use changedTouches instead of touches
      const touch = e.type === 'touchend' ? e.changedTouches[0] : e.touches[0];
      if (!touch) return;
  
      const x = touch.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.min(Math.max((x / width) * 100, 0), 100);
      setSliderValue(percentage);
      setDisplayTime(Math.floor((percentage / 100) * duration));
    }
  };

  useEffect(() => {
    if (!isDragging) {
      setDisplayTime(currentTime);
    }
  }, [currentTime, isDragging]);
  
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
    const seconds = Math.floor((ms / 1000) << 0);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  

  return (
    <div 
    className="song-controls" 
    style={lyricsStyle}
    >
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar-container"
          ref={progressBarRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="time-label time-label-left">{formatTime(displayTime)}</span>
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
      
      <div className="volume-control-wrapper">
        <VolumeDownRoundedIcon className="volume-icon" />
        <div className="volume-slider-container">
          <div 
            className="volume-slider-background"
            onClick={handleVolumeMouseDown}
            ref={volumeBarRef}
          >
            <div 
              className="volume-slider-fill"
              style={{ transform: `scaleX(${volume / 100})` }}
            />
            <div 
              className="volume-slider-handle"
              style={{ left: `${volume}%` }}
            />
          </div>
        </div>
        <VolumeUpRoundedIcon className="volume-icon" />
      </div>
      
    </div>
  );
};  

export default SongControls;
