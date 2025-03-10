import React, { useState, useEffect } from 'react'
import './Titlebar.css'
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { ViewState } from '../../types/viewState';

interface TitlebarProps {
  isSettings: boolean;
  setIsSettings: (value: boolean) => void;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}


const Titlebar: React.FC<TitlebarProps> = ({
  isSettings,
  setIsSettings: onSettingsChange,
  viewState,
  setViewState,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [areButtonsVisible, setAreButtonsVisible] = useState(false);

  useEffect(() => {
    if (isHovered) {
      setIsBoxVisible(true);
      // Delay the buttons appearance
      setTimeout(() => {
        setAreButtonsVisible(true);
      }, 100); // Wait for box animation
    } else {
      setAreButtonsVisible(false);
      // Delay hiding the box until buttons fade out
      setTimeout(() => {
        setIsBoxVisible(false);
      }, 100);
    }
  }, [isHovered]);

  const handleLeftButtonClick = () => {
    if (viewState === ViewState.SPOTIFY_FULL) {
      setViewState(ViewState.NEUTRAL);
      window.electron.log('Neutral')
    } else {
      setViewState(ViewState.SPOTIFY_FULL);
      window.electron.log('Spotify')
    }
  };

  const handleRightButtonClick = () => {
    if (viewState === ViewState.RIGHT_FULL) {
      setViewState(ViewState.NEUTRAL);
      window.electron.log('Neutral')
    } else {
      setViewState(ViewState.RIGHT_FULL);
      window.electron.log('Right')
    }
  };


  return (
    <div className="titlebar-wrapper">
      <div
      id="titlebar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      >
          <div className="button-container">
              <div className="button-wrapper">
                  <div className="main-buttons">
                      <button className="titlebar-button" onClick={handleLeftButtonClick}/>
                      <button className="titlebar-button" onClick={handleRightButtonClick}/>
                  </div>
                  <div className={`sub-buttons-left ${isBoxVisible ? 'visible' : ''}`}>

                      <button className={`sub-button ${areButtonsVisible ? 'visible' : ''}`}>
                          <MinimizeRoundedIcon className="minimize-icon"/>
                      </button>

                      <button className={`sub-button ${areButtonsVisible ? 'visible' : ''}`} onClick={() => onSettingsChange(!isSettings)}>
                          <SettingsRoundedIcon className="settings-icon"/>
                      </button>

                  </div>
                  <div className={`sub-buttons-right ${isBoxVisible ? 'visible' : ''}`}>

                      <button className={`sub-button ${areButtonsVisible ? 'visible' : ''}`}>
                          <FullscreenRoundedIcon className="close-icon" />
                      </button>

                      <button className={`sub-button ${areButtonsVisible ? 'visible' : ''}`}>
                          <CloseRoundedIcon className="close-icon" />
                      </button>
                      
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Titlebar;
