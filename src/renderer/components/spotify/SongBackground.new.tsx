import React, { useEffect, useState } from 'react';
import './Styles/SongBackground.css';
import { ColorExtractor } from '../../../utils/ColorExtractor';

const SongBackground: React.FC<{ coverUrl: string }> = ({ coverUrl }) => {
  const [backgroundColors, setBackgroundColors] = useState<string[]>([]);
  
  useEffect(() => {
    const getColors = async () => {
      if (!coverUrl) return;

      try {
        const palette = await ColorExtractor.from(coverUrl);
        const colors = [
          palette.Vibrant?.hex,
          palette.LightVibrant?.hex,
          palette.DarkVibrant?.hex,
          palette.Muted?.hex,
          palette.LightMuted?.hex,
          palette.DarkMuted?.hex,
        ].filter((color): color is string => !!color);

        setBackgroundColors(colors.length >= 3 ? colors : ['#1a1a1a', '#2c2c2c', '#3e3e3e', '#505050', '#626262']);
      } catch (error) {
        console.error('Error getting image colors:', error);
        setBackgroundColors(['#1a1a1a', '#2c2c2c', '#3e3e3e', '#505050', '#626262']);
      }
    };

    getColors();
  }, [coverUrl]);

  return (
    <div className="song-background-wrapper">
      <div 
        className="song-background animated-gradient"
        style={{
          '--color-1': backgroundColors[0] || '#1a1a1a',
          '--color-2': backgroundColors[1] || '#2c2c2c',
          '--color-3': backgroundColors[2] || '#3e3e3e',
          '--color-4': backgroundColors[3] || '#505050',
          '--color-5': backgroundColors[4] || '#626262',
          '--color-6': backgroundColors[5] || '#747474',
        } as React.CSSProperties}
      >
        <div className="background-overlay" />
      </div>
    </div>
  );
};

export default SongBackground;