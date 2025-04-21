import React, { useState, useEffect } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar';
import Settings, { EnabledModules, DEFAULT_MODULES } from './components/Settings';
import '../index.scss';
import { ViewState } from '../types/viewState';
import HoyoMain from './components/hoyo/HoyoMain';
import AppSelector from './components/AppSelector';
import DiscordMain from './components/discord/DiscordMain';
import secureLocalStorage from 'react-secure-storage';


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

  // Just change the order without restructuring the DOM

  const handleOutsideClick = (e: React.MouseEvent) => {
    // Only close if clicking the container itself, not its children
    if (e.target === e.currentTarget) {
      setIsSettings(false);
    }
  };

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