// Settings.tsx
import React, { useState, useEffect, act } from 'react';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import secureLocalStorage from "react-secure-storage";
import './Settings.scss';

import Iris from '../../assets/icons/IrisWideTransparent.png'

export interface EnabledModules {
    Spotify: boolean;
    Discord: boolean;
    Hoyolab: boolean;
}

export const DEFAULT_MODULES: EnabledModules = {
    Spotify: true,
    Discord: true,
    Hoyolab: true
};

interface SettingsProps {
    isSettings: boolean;
    setIsSettings: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({
    isSettings,
    setIsSettings: setIsSettings,
}) => {
    const [navigationPath, setNavigationPath] = useState<string[]>(['Settings']);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [installStatus, setInstallStatus] = useState<string>('');
    const [isInstalling, setIsInstalling] = useState(false);

    const modules: Array<keyof EnabledModules> = ['Spotify', 'Discord', 'Hoyolab'];
    const [enabledModules, setEnabledModules] = useState<EnabledModules>(() => {
        // Load saved module states from secure storage, defaulting to DEFAULT_MODULES
        const savedModules = secureLocalStorage.getItem('enabled_modules');
        if (savedModules) {
            return JSON.parse(savedModules as string) as EnabledModules;
        }
        return DEFAULT_MODULES;
    });

    const generalOptions = [
        'Spotify Settings',
        'Hoyolab Settings',
        'Discord Settings',
        'Modules',
    ];

    const [tempModules, setTempModules] = useState<EnabledModules>(enabledModules);

    useEffect(() => {
        if (isSettings) {
            setTempModules(enabledModules);
        }
    }, [isSettings]);

    const handleMenuSelect = (menu: string) => {
        window.electron.log(`Menu selected: ${menu}`)
        // Build the full path based on current navigation
        let newPath: string[];

        // If we're in the main menu (Settings)
        if (navigationPath.length === 1) {
            newPath = ['Settings', menu];
        }
        // If we're in a submenu (e.g., General)
        else if (navigationPath.length === 2) {
            // Keep the current path and add the new menu
            newPath = [...navigationPath, menu];
        }
        // If we're already in a sub-submenu, replace the last item
        else {
            newPath = [...navigationPath.slice(0, -1), menu];
        }

        setNavigationPath(newPath);
        setActiveMenu(menu);
    };

    const handleModuleToggle = (moduleName: keyof EnabledModules) => {
        // Update only the temporary state
        setTempModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    const handleModuleSave = () => {
        // Apply changes
        setEnabledModules(tempModules);
        secureLocalStorage.setItem('enabled_modules', JSON.stringify(tempModules));
        window.electron.log('Module settings saved');
        // Optionally close settings
        setIsSettings(false);
        location.reload();
    };



    const handleNavigationClick = (index: number) => {
        // If clicking on 'Settings', reset to main menu
        if (index === 0) {
            setActiveMenu(null);
            setNavigationPath(['Settings']);
            window.electron.log(`Navigation path: ${navigationPath}`);
        }
        // If clicking on a submenu, truncate the path up to that point
        else if (index < navigationPath.length) {
            const newPath = navigationPath.slice(0, index + 1);
            setActiveMenu(navigationPath[index]);
            setNavigationPath(newPath);
            window.electron.log(`Navigation path: ${newPath}`)
        }
    };


    const handleInstallExtension = async () => {
        try {
            setIsInstalling(true);
            const result = await window.spotify.spicetify.installExtension();
            setInstallStatus(result.message);
        } catch (error) {
            setInstallStatus(`Installation failed: ${error.message}`);
        } finally {
            setIsInstalling(false);
        }
    };


    const handleCredentialsHoyo = async () => {
        const idInput = document.querySelector('.hoyo-input') as HTMLInputElement;
        const secretInput = document.querySelector('.hoyo-input-secret') as HTMLInputElement;

        const username = idInput.value;
        const password = secretInput.value;

        secureLocalStorage.setItem('hoyolab_username', username);
        secureLocalStorage.setItem('hoyolab_password', password);


        if (!username || !password) {
            throw new Error('Username or password not found in storage');
        }

        const result = await window.hoyoAPI.login(username, password);
        console.log('Login successful:', result);

        const cookieString = [
            `cookie_token_v2=${result.cookies.cookie_token_v2}`,
            `account_mid_v2=${result.cookies.account_mid_v2}`,
            `account_id_v2=${result.cookies.account_id_v2}`,
            `ltoken_v2=${result.cookies.ltoken_v2}`,
            `ltmid_v2=${result.cookies.ltmid_v2}`,
            `ltuid_v2=${result.cookies.ltuid_v2}`,
        ].join('; ');

        window.hoyoAPI.initialize(cookieString, result.uid);
    }

    const handleCredentialsDiscord = () => {
        const idInput = document.querySelector('.discord-input') as HTMLInputElement;
        const secretInput = document.querySelector('.discord-input-secret') as HTMLInputElement;

        const id = idInput.value;
        const secret = secretInput.value;

        secureLocalStorage.setItem('discord_client_id', id);
        secureLocalStorage.setItem('discord_client_secret', secret);

        // Refreshing discord connection with the new credentials
        window.discord.disconnect();
        window.discord.connect(String(id), String(secret))
    }

    const handleDiscordReset = async () => {
        try {
            await window.discord.revokeAllTokens();
            window.discord.disconnect();
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
                {navigationPath.length === 1 && (
                    <div className="main-buttons">
                        <button
                            className="settings-button"
                            onClick={() => handleMenuSelect('General')}
                        >
                            General
                        </button>
                        <button
                            className="settings-button"
                            onClick={() => handleMenuSelect('About')}
                        >
                            About
                        </button>
                    </div>
                )}

                {/* About Menu */}
                {activeMenu === 'About' && (
                    <div className="options-menu">
                        <div className="about-content">
                            <div className='basic-details'>
                                <img src={Iris} alt="Iris" className="iris-image" />
                                <div className='name-text'>
                                    <span id='title'>Iris</span>
                                    <span id='name'>By Hyperiya</span>
                                </div>
                            </div>

                            <p className="iris-text">
                                Iris is a project created by Hyperiya (That's me!).
                                It is a project that aims to provide a user-friendly interface for the
                                Spotify, Discord, and Hoyolab APIs.
                                Iris © 2025 is licensed under CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License). 
                            </p>
                        </div>
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



                {/* Spotify Settings section */}
                {activeMenu === 'Spotify Settings' && (
                    <div className="options-menu">
                        <div className="settings-section">
                            <h3>Spicetify Extension</h3>
                            <button
                                className="install-button"
                                onClick={handleInstallExtension}
                            >
                                Install Spicetify Extension
                            </button>
                            {installStatus && (
                                <div className={`install-status ${installStatus.includes('failed') ? 'error' : 'success'
                                    }`}>
                                    {installStatus}
                                </div>
                            )}
                            {isInstalling && <div className="install-status installing">Installing...</div>}
                        </div>
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
                                    id='input-bar'
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Hoyolab Password"
                                    className="hoyo-input-secret"
                                    id='input-bar'
                                />
                            </div>
                            <div className="save-input">
                                <button id='input-button' className="save-button" onClick={handleCredentialsHoyo}>Save</button>
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
                                    id='input-bar'
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Discord Client Secret"
                                    className="discord-input-secret"
                                    id='input-bar'
                                />
                            </div>

                            <div className="save-input">
                                <button id='input-button' className="save-button" onClick={handleCredentialsDiscord}>Save</button>
                                <button id='input-button' className="reset-button" onClick={handleDiscordReset}>Reset</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeMenu === 'Modules' && (
                    <div className="options-menu">
                        <div className="settings-section">
                            <div className="module-toggles">
                                {modules.map((module) => (

                                    <div key={module} className="module-toggle">
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={tempModules[module]}
                                                onChange={() => handleModuleToggle(module)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                        <span className="module-name">
                                            {module.charAt(0).toUpperCase() + module.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="save-input">
                                <button
                                    id='input-button'
                                    className="save-button"
                                    onClick={handleModuleSave}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};



export default Settings;
