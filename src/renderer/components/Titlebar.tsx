import React, { useState, useEffect } from 'react'
import './Titlebar.css'
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

interface TitlebarProps {
  isSettings: boolean;
  setIsSettings: (value: boolean) => void;
}


const Titlebar: React.FC<TitlebarProps> = ({isSettings, setIsSettings: onSettingsChange}) => {
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


  return (
    <div
    id="titlebar"
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    >
        <div className="button-container">
            <div className="button-wrapper">
                <div className="main-buttons">
                    <button className="titlebar-button"></button>
                    <button className="titlebar-button"></button>
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
  );
};

export default Titlebar;
