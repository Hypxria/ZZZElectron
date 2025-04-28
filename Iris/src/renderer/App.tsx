import React, { useState, useEffect, use } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain.tsx';
import Titlebar from './components/Titlebar.tsx';
import Settings, { EnabledModules, DEFAULT_MODULES } from './components/Settings.tsx';
import '../index.scss';
import { ViewState } from '../types/viewState.ts';
import HoyoMain from './components/hoyo/HoyoMain.tsx';
import AppSelector from './components/AppSelector.tsx';
import DiscordMain from './components/discord/DiscordMain.tsx';
import secureLocalStorage from 'react-secure-storage';
import { SpeechRecognitionService } from '../services/micServices/speech.ts';

interface AppProps {
}



const App: React.FC<AppProps> = () => {
  const [isSettings, setIsSettings] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [enabledModules, setEnabledModules] = useState<EnabledModules>(() => {
    const savedModules = secureLocalStorage.getItem('enabled_modules');
    if (savedModules) {
      return JSON.parse(savedModules as string) as EnabledModules;
    }
    return DEFAULT_MODULES;
  });
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (!enabledModules.Hoyolab) {
      return ViewState.SPOTIFY_FULL;
    } else if (!enabledModules.Spotify) {
      return ViewState.RIGHT_FULL;
    }
    return ViewState.NEUTRAL;
  });
  const [hide, setHide] = useState<boolean>(() => {
    if (!enabledModules.Hoyolab || !enabledModules.Spotify) {
      return true;
    }
    return false;
  });
  
  const speechService = new SpeechRecognitionService();


  useEffect(() => {
    // Usage example

    // Initialize the service
    speechService.initialize();



  }, []);

  useEffect(() => {
    const savedModules = secureLocalStorage.getItem('enabled_modules');
    console.log(savedModules)
    if (savedModules) {
      setEnabledModules(JSON.parse(savedModules as string));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!document.fullscreenElement;
      window.electron.window.isFullScreen().then((isElectronFullscreen: boolean) => {
        setIsFullScreen(isDocFullscreen || isElectronFullscreen);
      });
    };

    window.electron.window.onFullScreen(handleFullscreenChange);

    // Initial check
    handleFullscreenChange();

    return () => {

      window.electron.window.removeFullScreenListener();
    };
  }, []);

  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only close if clicking the container itself, not its children
    if (e.target === e.currentTarget) {
      setIsSettings(false);
    }
  };

  const turnOnThing = () => {
    speechService.startListening();

  }

  const turnOffThing = () => {
    speechService.stopListening();

  }

  window.electron.log(`ViewState: ${viewState}`)
  return (
    <div
      className={`App ${isFullScreen ? 'fullscreen' : ''}`}
      onClick={isSettings ? handleOutsideClick : undefined}
    >


      <Titlebar
        isSettings={isSettings}
        setIsSettings={setIsSettings}
      />


      {/* {enabledModules.Hoyolab && enabledModules.Spotify && ( */}
      <AppSelector
        viewState={viewState}
        setViewState={setViewState}
        hide={hide}
      />
      {/* )} */}

      <div className={`content-wrapper ${viewState}`}>

        {isSettings && (
          <div
            className="settings-backdrop"
            onClick={handleOutsideClick}
          >
            <Settings isSettings={isSettings} setIsSettings={setIsSettings} />
          </div>
        )}

        {enabledModules.Discord && (
          <DiscordMain />

        )}

        <button onClick={turnOnThing}>
          ON
        </button>

        <button onClick={turnOffThing}>
          OFF

        </button>

        {enabledModules.Spotify && (
          <div className={`spotify-section ${viewState === ViewState.SPOTIFY_FULL ? 'full' : ''}`}>
            <SpotifyMain ViewState={viewState} />
          </div>
        )}
        {enabledModules.Hoyolab && (
          <div className={`right-section ${viewState === ViewState.RIGHT_FULL ? 'full' : viewState === ViewState.SPOTIFY_FULL ? 'hidden' : ''}`}>
            <HoyoMain ViewState={viewState} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;