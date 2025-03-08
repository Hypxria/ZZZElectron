import React, { useState, useEffect } from 'react';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import './Settings.css';

interface SettingsProps {
    // your props here
}

const Settings: React.FC<SettingsProps> = () => {

    const handleClick = (e: React.MouseEvent) => {
        const element = document.querySelector('.settings-content') as HTMLElement;
        element.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        element.style.opacity = '0';
        element.style.transform = 'translateX(-100%)';
    };

    return (
        <section className="settings">
            <header className="settings-header">
                <h1>Settings</h1>
                <ArrowForwardIosRoundedIcon className='settings-arrow'/>
                <h2 className='sub-menu'>General</h2>
            </header>
            <main className="settings-content">
                {/* Settings groups */}
                <section className="settings-group">
                    <h2 onClick={handleClick} id='general'>General</h2>
                    {/* Settings items */}
                </section>

                <section className="settings-group">
                    <h2 onClick={handleClick} id='appearance'>Appearance</h2>
                    {/* Settings items */}
                </section>

                {/* More settings groups */}
            </main>
        </section>
    );
};

export default Settings;
