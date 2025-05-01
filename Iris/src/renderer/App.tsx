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

  const [sensitivity, setSensitivity] = useState<number>(() =>
    Number(localStorage.getItem('sensitivity-value')) || 50
  );
  const [activeDevice, setActiveDevice] = useState<string>(() =>
    localStorage.getItem('selected-device') || ''
  );

  const [isIrisEnabled, setIsIrisEnabled] = useState<boolean>(() =>
    Boolean(localStorage.getItem('iris-enabled')) || false
  )

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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sensitivity-value') {
        setSensitivity(Number(e.newValue) || 50);
      }
      if (e.key === 'selected-device') {
        setActiveDevice(e.newValue || '');
      }
      if (e.key === 'iris-enabled') {
        setIsIrisEnabled(Boolean(e.newValue) || false);
        console.log(Boolean(e.newValue))
      }
      console.log('storage event')
    };


    // For changes from other windows/tabs
    window.addEventListener('storage', handleStorageChange);

    // For changes within the same window
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key: string, value: string) {
      const event = new Event('localStorageChange');
      (event as any).key = key;
      (event as any).newValue = value;
      window.dispatchEvent(event);
      originalSetItem.apply(this, [key, value]);
    };

    const handleLocalChange = (e: Event) => {
      const key = (e as any).key;
      const newValue = (e as any).newValue;
      console.log(key, newValue)

      if (key === 'sensitivity-value') {
        setSensitivity(Number(newValue) || 50);
      }
      if (key === 'selected-device') {
        setActiveDevice(newValue || '');
      }
      if (key === 'iris-enabled') {
        setIsIrisEnabled(Boolean(newValue) || false);
        console.log(Boolean(newValue))

      }
      console.log('storage event')
    };

    window.addEventListener('localStorageChange', handleLocalChange);

    return () => {
      // Cleanup
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleLocalChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const turnOnThing = () => {
    const sensitivity = Number(window.localStorage.getItem('sensitivity-value'));
    const device = String(window.localStorage.getItem('selected-device'));

    speechService.startListening(sensitivity, device);
  }

  useEffect(() => {
    if (isIrisEnabled) {
      speechService.stopListening();
      speechService.startListening(sensitivity, activeDevice);
    }
  }, [sensitivity, activeDevice])

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

      <div className={`content-wrapper ${viewState}`}>
        {enabledModules.Hoyolab && enabledModules.Spotify && (
          <AppSelector
            viewState={viewState}
            setViewState={setViewState}
            hide={hide}
          />
        )}
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

        {isIrisEnabled === true && (
          <div>
            <button onClick={turnOnThing}>
              ON
            </button>

            <button onClick={turnOffThing}>
              OFF

            </button>
          </div>
        )}

        {/* {enabledModules.Spotify && (
          <div className={`spotify-section ${viewState === ViewState.SPOTIFY_FULL ? 'full' : ''}`}>
            <SpotifyMain ViewState={viewState} />
          </div>
        )}
        {enabledModules.Hoyolab && (
          <div className={`right-section ${viewState === ViewState.RIGHT_FULL ? 'full' : viewState === ViewState.SPOTIFY_FULL ? 'hidden' : ''}`}>
            <HoyoMain ViewState={viewState} />
          </div>
        )} */}

      </div>
    </div>
  );
};

export default App;