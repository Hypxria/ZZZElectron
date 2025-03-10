// Settings.tsx
import React, { useState } from 'react';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import './Settings.css';

interface SettingsProps {
    isSettings: boolean;
    setIsSettings: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ isSettings, setIsSettings: setIsSettings}) => {
    const [navigationPath, setNavigationPath] = useState<string[]>(['Settings']);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const generalOptions = [
        'Spotify Settings',
        'Hoyolab Settings',
        'Privacy',
        'Language'
    ];

    const appearanceOptions = [
        'Theme',
        'Font Size',
        'Color Scheme',
        'Layout'
    ];

    const handleMenuSelect = (menu: string) => {
        setActiveMenu(menu);
        setNavigationPath(['Settings', menu]);
    };

    const handleNavigationClick = (index: number) => {
        // If clicking on 'Settings', reset to main menu
        if (index === 0) {
            setActiveMenu(null);
            setNavigationPath(['Settings']);
        }
        // If clicking on a submenu, truncate the path up to that point
        else if (index < navigationPath.length) {
            setActiveMenu(navigationPath[index]);
            setNavigationPath(navigationPath.slice(0, index + 1));
        }
    };

    const handleCredentials = () => {
        const idInput = document.querySelector('.spotify-input') as HTMLInputElement;
        const secretInput = document.querySelector('.spotify-input-secret') as HTMLInputElement;

        const id = idInput.value;
        const secret = secretInput.value;

        localStorage.setItem('spotify_client_id', id);
        localStorage.setItem('spotify_client_secret', secret);

        const { spotifyService } = require('../../services/SpotifyService');
    
        // Update the service with new credentials
        spotifyService.updateCredentials(id, secret);
    };
    
    return (
        <div 
            className={`settings ${isSettings ? 'show' : ''}`} 
            onClick={(e) => e.stopPropagation()}
        >
            <div className="settings-container">
                {/* Navigation header */}
                <div className="navigation-header">
                    {navigationPath.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <ArrowForwardIosRoundedIcon className="nav-arrow" />
                            )}
                            <span 
                                className={`nav-item ${
                                    index === navigationPath.length - 1 ? 'active' : ''
                                }`}
                                onClick={() => handleNavigationClick(index)}
                                role="button"
                                tabIndex={0}
                            >
                                {item}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Main menu */}
                {!activeMenu && (
                    <div className="main-buttons">
                        <button 
                            className="settings-button"
                            onClick={() => handleMenuSelect('General')}
                        >
                            General
                        </button>
                        <button 
                            className="settings-button"
                            onClick={() => handleMenuSelect('Appearance')}
                        >
                            Appearance
                        </button>
                    </div>
                )}



                {/* Sub menus */}
                {activeMenu === 'General' && (
                    <div className="options-menu">
                        <div className="options-list">
                            {generalOptions.map((option, index) => (
                                <button 
                                    key={index} 
                                    className="option-button"
                                    onClick={() => handleMenuSelect(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Appearance menu */}
                {activeMenu === 'Appearance' && (
                    <div className="options-menu">
                        <div className="options-list">
                            {appearanceOptions.map((option, index) => (
                                <button 
                                    key={index} 
                                    className="option-button"
                                    onClick={() => handleMenuSelect(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Spotify Settings section */}
                {activeMenu === 'Spotify Settings' && (
                    <div className="options-menu">
                        <div className="spotify-credentials">
                            <div className="input-group">
                                <input 
                                    type="text"
                                    placeholder="Client ID"
                                    className="spotify-input"
                                    value={localStorage.getItem('spotify_client_id') || ''}
                                />
                            </div>
                            <div className="input-group">
                                <input 
                                    type="text"
                                    placeholder="Client Secret"
                                    className="spotify-input-secret"
                                    value={localStorage.getItem('spotify_client_secret') || ''}

                                />
                            </div>
                            <div className="save-input">
                                <button className="save-button" onClick={handleCredentials}>Save</button>
                            </div>  
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};



export default Settings;
