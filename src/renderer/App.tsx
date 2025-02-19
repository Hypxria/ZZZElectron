import React from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar'
import '../index.css';

const App: React.FC = () => {
  return (
    <div>
      <Titlebar />
      <div>
        <SpotifyMain />
      </div>
    </div>
  );
};

export default App;