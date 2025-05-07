import React, { useEffect } from 'react';

import secureLocalStorage from 'react-secure-storage';

import DiscordCall from './DiscordCall.tsx';
import DiscordNotification from './DiscordNotification.tsx';


const DiscordMain: React.FC = ({

}) => {
    const [logins, setLogins] = React.useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        const connectToDiscord = async () => {
            try {
                const id = secureLocalStorage.getItem('discord_client_id');
                const secret = secureLocalStorage.getItem('discord_client_secret');

                if (!id || !secret) {
                    console.error('Discord client ID or secret not found in secure storage.');
                    setLogins(false)
                    return;
                } else {
                    setLogins(true)
                }

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
        <div className='discord-container'>
            {logins && (
                <>
                    <DiscordCall />
                    <DiscordNotification />
                </>
            )}

        </div>
    );
};



export default DiscordMain;
