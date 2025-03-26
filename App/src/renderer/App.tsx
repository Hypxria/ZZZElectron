import React, { useState } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar'
import Settings from './components/Settings';
import '../index.css';
import {ViewState} from '../types/viewState';

declare global {
  interface Window {
      discord: {
          onNotification: (callback: (notification: any) => void) => void;
      }
  }
}

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

  window.discord.onNotification((notification) => {
    console.log('Received Discord notification:', notification);
    // Handle the notification in your UI
  });


  
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
      
      {isSettings && (
        <div 
          className="settings-backdrop"
          onClick={handleOutsideClick}
        >
          <Settings isSettings={isSettings} setIsSettings={setIsSettings}/>
        </div>
      )}

      
      <div className={`content-wrapper ${viewState}`}>
        <div className={`spotify-section ${viewState === ViewState.SPOTIFY_FULL ? 'full' : ''}`}>
          <SpotifyMain
            ViewState={viewState}
          />
        </div>
        <div className={`right-section ${viewState === ViewState.RIGHT_FULL ? 'full' : ''}`}>
          {/* Right side content will go here */}
          <div style={{ color: 'white' }}>Right Side Content (Coming Soon)</div>
        </div>
      </div>
    </div>
  );
};

export default App;