import React, { useState } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar';
import Settings from './components/Settings';
import DiscordNotification from './components/discord/DiscordNotification';
import '../index.scss';
import { ViewState } from '../types/viewState';
import HoyoMain from './components/hoyo/HoyoMain';




interface AppProps {
}

const App: React.FC<AppProps> = () => {
  const [isSettings, setIsSettings] = useState<boolean>(false);
  const [viewState, setViewState] = useState<ViewState>(ViewState.NEUTRAL);


  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only close if clicking the container itself, not its children
    if (e.target === e.currentTarget) {
      setIsSettings(false);
    }
  };

  window.electron.log(`ViewState: ${viewState}`)
  var isEnabled = true
  return (
    <div
      className='App'
      onClick={isSettings ? handleOutsideClick : undefined}
    >
      <Titlebar
        isSettings={isSettings}
        setIsSettings={setIsSettings}
        viewState={viewState}
        setViewState={setViewState}
      />

      

      <DiscordNotification
      
      />

      {isSettings && (
        <div
          className="settings-backdrop"
          onClick={handleOutsideClick}
        >
          <Settings isSettings={isSettings} setIsSettings={setIsSettings} />
        </div>
      )}


      <div className={`content-wrapper ${viewState}`}>
        <div className={`spotify-section ${viewState === ViewState.SPOTIFY_FULL ? 'full' : ''}`}>
          <SpotifyMain
            ViewState={viewState}
          />
        </div>
        <div className={`right-section ${viewState === ViewState.RIGHT_FULL ? 'full' : viewState === ViewState.SPOTIFY_FULL ? 'hidden' : ''}`}>
          {/* Right side content will go here */}
          <HoyoMain 
          ViewState={viewState}
          />
        </div>
      </div>
    </div>
  );
};

export default App;