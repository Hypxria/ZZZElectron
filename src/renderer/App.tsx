import React from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar'
import Settings from './components/Settings';
import '../index.css';

const App: React.FC = () => {
  return (
    <div>
      {/* <Titlebar /> */}
      <Settings />
      <div>
        {/* <SpotifyMain /> */}
      </div>
    </div>
  );
};

export default App;