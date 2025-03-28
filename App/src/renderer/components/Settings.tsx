// Settings.tsx
import React, { useState, useEffect } from 'react';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import secureLocalStorage from "react-secure-storage";
import './Settings.scss';

interface SettingsProps {
    isSettings: boolean;
    setIsSettings: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ isSettings, setIsSettings: setIsSettings }) => {
    const [navigationPath, setNavigationPath] = useState<string[]>(['Settings']);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);



    const generalOptions = [
        'Spotify Settings',
        'Hoyolab Settings',
        'Discord Settings',
        'Credits',
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

        console.log(id, secret)

        secureLocalStorage.setItem('spotify_client_id', id);
        secureLocalStorage.setItem('spotify_client_secret', secret);

        const { spotifyService } = require('../../services/spotifyServices/SpotifyService');

        // Update the service with new credentials
        spotifyService.updateCredentials(id, secret);
        window.location.reload();
    };

    const handleCredentialsHoyo = () => {
        const idInput = document.querySelector('.hoyolab-input') as HTMLInputElement;
        const secretInput = document.querySelector('.hoyolab-input-secret') as HTMLInputElement;

        const account = idInput.value;
        const password = secretInput.value;

        secureLocalStorage.setItem('hoyolab_username', account);
        secureLocalStorage.setItem('hoyolab_password', password);
    }

    const handleCredentialsDiscord = () => {
        const idInput = document.querySelector('.discord-input') as HTMLInputElement;
        const secretInput = document.querySelector('.discord-input-secret') as HTMLInputElement;

        const id = idInput.value;
        const secret = secretInput.value;

        secureLocalStorage.setItem('discord_client_id', id);
        secureLocalStorage.setItem('discord_client_secret', secret);

        // Refreshing discord connection with the new credentials
        const result = window.discord.connect(String(id), String(secret));
        window.electron.restart();
    }

    const handleDiscordReset = async () => {
        try {
            await window.discord.revokeAllTokens();
            await window.discord.disconnect();
            await window.electron.restart();
        } catch (error) {
            console.error('Error in the middle of discord reset:', error);
        }    
    }

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
                                className={`nav-item ${index === navigationPath.length - 1 ? 'active' : ''
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

                    </div>
                )}



                {/* Hoyoverse Settings section */}
                {activeMenu === 'Hoyolab Settings' && (
                    <div className="options-menu">
                        <div className="credentials">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Hoyolab Username/Email"
                                    className="hoyo-input"
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Hoyolab Password"
                                    className="hoyo-input-secret"
                                />
                            </div>
                            <div className="save-input">
                                <button className="save-button" onClick={handleCredentialsHoyo}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Discord Settings section */}
                {activeMenu === 'Discord Settings' && (
                    <div className="options-menu">
                        <div className="credentials">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Discord Client ID"
                                    className="discord-input"
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Discord Client Secret"
                                    className="discord-input-secret"
                                />
                            </div>

                            <div className="save-input">
                                <button className="save-button" onClick={handleCredentialsDiscord}>Save</button>
                                <button className="save-button" onClick={handleDiscordReset}>Reset</button>
                            </div>
                        </div>
                    </div>

                )}

            </div>
        </div >
    );
};



export default Settings;
