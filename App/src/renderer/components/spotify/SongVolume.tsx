// src/renderer/components/spotify/VolumeControls.tsx
import React, { useState, useRef, useEffect } from 'react';
import './Styles/SongVolume.scss';
import VolumeDownRoundedIcon from '@mui/icons-material/VolumeDownRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';

interface SongVolumeProps {
    volume: number;
    onVolumeChange: (volume: number) => void;
}

const SongVolume: React.FC<SongVolumeProps> = ({
    volume,
    onVolumeChange,
}) => {
    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onVolumeChange(Number(event.target.value));
    };

    const handleVolumeIconClick = (icon: 'up' | 'down') => {
        if (icon === 'down') {
            onVolumeChange(0);
        } else {
            onVolumeChange(100);
        }
    };

    return (
        <div className="volume-control-wrapper">
            <VolumeDownRoundedIcon
                className="volume-icon"
                onClick={() => handleVolumeIconClick('down')}
            />
            <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                aria-label="Volume"
            />
            <VolumeUpRoundedIcon
                className="volume-icon"
                onClick={() => handleVolumeIconClick('up')}
            />
        </div>
    );
};

export default SongVolume;
