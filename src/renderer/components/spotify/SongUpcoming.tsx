import React, {useState} from 'react';
import './Styles/SongUpcoming.css';

interface Song {
  id: string;
  title: string;
  artist: string;
  albumCover: string;
}

interface SongUpcomingProps {
  nextSong: Song;
  onSongSelect?: (song: Song) => void;
}

const SongUpcoming: React.FC<SongUpcomingProps> = ({ nextSong, onSongSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
 

  return (
    <div className={`upcoming-song-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div 
        className="upcoming-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3>Up Next
          <span className={`collapse-arrow ${isCollapsed ? 'rotated' : ''}`}>▼</span>
        </h3>
      </div>
      {!isCollapsed && (
      <div className="upcoming-content">
        <div className="next-song-card" onClick={() => onSongSelect?.(nextSong)}>
          <img 
            src={nextSong?.albumCover} 
            alt="Album Cover" 
            className="next-song-image"
          />
          <div className="next-song-info">
            <span className="next-song-title">{nextSong?.title}</span>
            <span className="next-song-artist">{nextSong?.artist}</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default SongUpcoming;
