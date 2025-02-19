// src/renderer/components/spotify/SpotifyMain.tsx
import React from 'react';
import SongInfo from './SongInfo';
import SongControls from './SongControls';
import SongUpcoming from './SongUpcoming';
import './Styles/Main.css';

interface SpotifyMainProps {
  // Add any props if needed in the future
}

const nextSong = {
  id: '1',
  title: 'Breeze Blows',
  artist: 'Jamie Paige',
  albumCover: 'path/to/album/cover.jpg'
};

const SpotifyMain: React.FC<SpotifyMainProps> = () => {
  return (
    <div className="spotify">
      <div className="undercover"></div>
      <div className="song-info">
        <SongInfo />
        <SongControls />
      </div>
      <SongUpcoming 
        nextSong={nextSong}
        onSongSelect={(song) => {
          // Handle song selection
          console.log('Selected song:', song);
        }}
      />
    </div>
  );
};

export default SpotifyMain;
