import React, { useState } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar'
import Settings from './components/Settings';
import '../index.css';

interface AppProps {
}

const App: React.FC<AppProps> = () => {
  const [isSettings, setIsSettings] = useState<boolean>(false);

  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only close if clicking the container itself, not its children
    if (e.target === e.currentTarget) {
      setIsSettings(false);
    }
  };

  return (
    <div 
    className='App' 
    onClick={isSettings ? handleOutsideClick : undefined}
    >
      <Titlebar
        isSettings={isSettings} 
        setIsSettings={setIsSettings}/>
      {isSettings && (
        <div 
          className="settings-backdrop"
          onClick={handleOutsideClick}
        >
          <Settings isSettings={isSettings} setIsSettings={setIsSettings}/>
        </div>
      )}
      <div>
        <SpotifyMain />
      </div>
    </div>
  );
};

export default App;