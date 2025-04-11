import React, { useState } from 'react';
import './Titlebar.scss';
import MinimizeIcon from '@mui/icons-material/Remove';
import MaximizeIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

interface TitlebarProps {
  title?: string;
}

const Titlebar: React.FC<TitlebarProps> = ({ title = 'My App' }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    window.electron.window.minimize();
  };

  const handleMaximize = () => {
    if (isMaximized) {
      window.electron.window.unmaximize();
    } else {
      window.electron.window.maximize();
    }
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electron.window.close();
  };

  return (
    <div className="titlebar">
      <div className="titlename">
        <div className="window-title">{title}</div>
      </div>
      
      <div className="window-controls">

        <button 
          className='window-control-button minimize' 
          
        >
          <SettingsRoundedIcon/>
        </button>
        
        <button
          className="window-control-button minimize"
          onClick={handleMinimize}
        >
          <MinimizeIcon fontSize="small" />
        </button>
        <button
          className="window-control-button maximize"
          onClick={handleMaximize}
        >
          <MaximizeIcon fontSize="small" />
        </button>
        <button
          className="window-control-button close"
          onClick={handleClose}
        >
          <CloseIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
