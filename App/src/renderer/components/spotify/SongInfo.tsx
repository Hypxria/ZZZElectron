// src/renderer/components/spotify/SongInfo.tsx
import React from 'react';
import './Styles/SongInfo.css';

interface Song {
  name: string;
  artist: string;
  album_cover: string;
  year: string;
}

interface SongInfoProps {
  currentSong: Song;
  colors: string[]
}

const SongInfo: React.FC<SongInfoProps> = ({ currentSong, colors }) =>{
  return (
    <div className="song-details">
      <img 
        className="song-image" 
        src={currentSong?.album_cover} 
        alt="Album Cover"
        id="song-image"  
      />
      <div className="song-text">{currentSong?.name}</div>
      <div className="artist-text">{currentSong?.artist} • <span className='year-text'>{currentSong.year}</span></div>
    </div>
  );
};

export default SongInfo;
