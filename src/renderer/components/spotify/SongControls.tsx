import React, { useState } from 'react';
import './Styles/SongControls.css';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';


interface SongControlsProps {
  onPlay?: () => void/*run playhtingyfr*/;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (position: number) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const SongControls: React.FC<SongControlsProps> = ({isPlaying, currentTime, duration}) => {
  
  const handlePlayPause = () => {
    if (!isPlaying) {
        // Start playing logic
        try {
            // audioRef.current?.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    } else {
        // Pause logic
        try {
            // audioRef.current?.pause();
        } catch (error) {
            console.error('Error pausing audio:', error);
        }
    }
  };

  const handleSkip = () => {

    try {
      // audioRef.current?.pause();
    } catch (error) {
      console.error('Error skipping song:', error);
    }
    
  };
  
  const [sliderValue, setSliderValue] = useState<number>(0);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSliderValue(Number(e.target.value));
  };



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


  return (
    <div className="song-controls">
      <div className="slider-container">
        <input 
          type="range" 
          className="duration-slider" 
          min="0" 
          max="100" 
          value={sliderValue} 
          onChange={handleSliderChange}
        />
        <div className="time-labels">
          <span>{currentTime}</span>
          <span>{duration}</span>
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
