// src/renderer/components/spotify/SongInfo.tsx
import React from 'react';
import './Styles/SongInfo.css';

interface SongInfoProps {
  songTitle?: string;
  artistName?: string;
  year?: string;
  albumCover?: string;
}

const SongInfo: React.FC<SongInfoProps> = ({
  songTitle = "Weathergirl",
  artistName = "FLAVOR FOLEY",
  year = "2024",
  albumCover
}) => {
  return (
    <div className="song-details">
      <img 
        className="song-image" 
        src={albumCover} 
        alt="Album Cover" 
      />
      <div className="song-text">{songTitle}</div>
      <div className="artist-text">{artistName} • {year}</div>
    </div>
  );
};

export default SongInfo;
