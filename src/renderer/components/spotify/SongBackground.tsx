import React, { useEffect, useState } from 'react';
import './Styles/SongBackground.css'; // We'll create this file for the animations

const SongBackground: React.FC<{ coverUrl: string }> = ({ coverUrl }) => {
  const [backgroundColors, setBackgroundColors] = useState<string[]>([]);
  
  // Previous color sampling code remains the same...
  useEffect(() => {
    const getColors = async () => {
      if (!coverUrl) return;

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const colors: string[] = [];
          const numSamples = 6;

          for (let i = 0; i < numSamples; i++) {
            const x = Math.floor(Math.random() * img.width);
            const y = Math.floor(Math.random() * img.height);
            
            const imageData = ctx.getImageData(x, y, 3, 3);
            const data = imageData.data;
            
            const color = `#${((data[0] << 16) | (data[1] << 8) | data[2]).toString(16).padStart(6, '0')}`;
            colors.push(color);
          }

          const filteredColors = colors.filter(color => {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 20 && brightness < 235;
          });

          setBackgroundColors(filteredColors.length >= 3 ? filteredColors : colors);
        };

        img.src = coverUrl;

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
