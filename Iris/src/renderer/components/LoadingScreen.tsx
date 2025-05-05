// src/renderer/components/LoadingScreen.tsx
import React from 'react';
import './styles/LoadingScreen.scss';

interface LoadingScreenProps {
  isVisible: boolean;
  progress: number;
  message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, progress, message }) => {
  if (!isVisible) {
    setTimeout(() => {
      return null;
    }, 1000);
  };
  
  return (
    <div className={`loading-overlay ${isVisible === true ? 'shown': ''}`}>
      <div className="loading-container">
        <div className="loading-logo">
          {/* Replace with your actual logo path */}
          <img src="./assets/icons/Iris.png" alt="Iris" />
        </div>
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <div 
              className="loading-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-percentage">{Math.round(progress)}%</div>
        </div>
        <div className="loading-message">{message}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
