// src/renderer/components/spotify/SongInfo.tsx
import React from 'react';
import './Styles/SongInfo.scss';

interface Song {
  name: string;
  artist: string;
  album_cover: string;
  year: string;
}

interface SongInfoProps {
  currentSong: Song;
  colors: string[]
  SongVolume: React.FC;
}

const SongInfo: React.FC<SongInfoProps> = ({ currentSong, colors, SongVolume }) => {
  return (
    <div className="song-details">
      <div className='image-overlay'>
        <img
          className="song-image"
          src={currentSong?.album_cover}
          alt="Album Cover"
          id="song-image"
        />
        <SongVolume />
      </div>
      <div className="song-text">{currentSong?.name}</div>
      <div className="artist-text">{currentSong?.artist} • <span className='year-text'>{currentSong.year}</span></div>
    </div>
  );
};

export default SongInfo;
