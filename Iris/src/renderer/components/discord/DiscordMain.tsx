import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Styles/DiscordNotification.scss';
import { DiscordNotificationType } from './../../../services/discordServices/types.ts';
import secureLocalStorage from 'react-secure-storage';

import DiscordCall from './DiscordCall.tsx';
import DiscordNotification from './DiscordNotification.tsx';


const DiscordMain: React.FC = ({

}) => {
    useEffect(() => {
        let mounted = true;
        const connectToDiscord = async () => {
            try {
                const id = secureLocalStorage.getItem('discord_client_id');
                const secret = secureLocalStorage.getItem('discord_client_secret');

                const result = await window.discord.connect(String(id), String(secret));
                if (!mounted) return;

                if (!result.success) {
                    console.error('Failed to connect to Discord:', result.error);
                    return;
                }
            } catch (error) {
                if (!mounted) return;
                console.error('Error connecting to Discord:', error);
            }
        };

        connectToDiscord();

        return () => {
            mounted = false;
            window.discord.disconnect();
        };
    }, []);

    
    return (
        <div>
            <DiscordCall />
            <DiscordNotification />
        </div>
    );
};



export default DiscordMain;
