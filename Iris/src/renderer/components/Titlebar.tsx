import React, { useState, useEffect } from 'react';
import './Titlebar.scss';
import MinimizeIcon from '@mui/icons-material/Remove';
import MaximizeIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded';

import iris from '../../assets/icons/IrisTransparent.png'

interface TitlebarProps {
    title?: string;
    isSettings: boolean;
    setIsSettings: (value: boolean) => void;
}

const Titlebar: React.FC<TitlebarProps> = ({
    title = 'Iris',
    isSettings,
    setIsSettings: onSettingsChange,
}: TitlebarProps) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isDocFullscreen = !!document.fullscreenElement;
            window.electron.window.isFullScreen().then((isElectronFullscreen: boolean) => {
                setIsFullScreen(isDocFullscreen || isElectronFullscreen);
            });
        };

        window.electron.window.onFullScreen(handleFullscreenChange);

        // Initial check
        handleFullscreenChange();

        return () => {
            
            window.electron.window.removeFullScreenListener();
        };
    }, []);

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

    const handleFullscreen = () => {
        window.electron.window.fullscreen();
    }

    return (
        <>
            {!isFullScreen && (
                <div className={`titlebar`}>
                    <div className="titlename">
                        <img src={iris} className='iris-image'></img>
                        <div className="window-title">{title}</div>
                    </div>
    
                    <div className="window-controls">
                        <button
                            className='window-control-button settingsicon'
                            onClick={() => onSettingsChange(!isSettings)}
                        >
                            <SettingsRoundedIcon fontSize='small' />
                        </button>
    
                        <button
                            className='window-control-button fullscreen'
                            onClick={handleFullscreen}
                        >
                            {isFullScreen ? (
                                <FullscreenExitRounded fontSize='small' />
                            ) : (
                                <FullscreenRounded fontSize='small' />
                            )}
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
            )}
        </>
    );    
};

export default Titlebar;
