import React, { useState, useEffect } from 'react'
import './AppSelector.scss'
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { ViewState } from '../../types/viewState';

interface TitlebarProps {
  
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}


const AppSelector: React.FC<TitlebarProps> = ({
  viewState,
  setViewState,
}) => {
  
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
    <div className="selector-wrapper">
      <div
      id="selector"
      >
          <div className="button-container">
              <div className="button-wrapper">
                  <div className="main-buttons">
                      <button className="selector-button" onClick={handleLeftButtonClick}/>
                      <button className="selector-button" onClick={handleRightButtonClick}/>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AppSelector;
