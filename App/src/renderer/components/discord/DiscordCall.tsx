import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Styles/DiscordCall.scss';

import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import HeadsetRoundedIcon from '@mui/icons-material/HeadsetRounded';
import HeadsetOffRoundedIcon from '@mui/icons-material/HeadsetOffRounded';
import PhoneDisabledRoundedIcon from '@mui/icons-material/PhoneDisabledRounded';

import { VoiceChannelSelectType } from '../../../services/discordServices/types';


// DiscordCall.tsx
const DiscordCall: React.FC = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isCalling, setIsCalling] = useState(false);

    const handleMute = () => setIsMuted(!isMuted);
    const handleDeafen = () => setIsDeafened(!isDeafened);

    const users = [
        {
            uid: 33,
            speaking: true,
            profile: 'https://....',
            nickname: 'example',
            muted: false,
            deafened: false,
            selfmuted: false,
            selfdeafend: false,
        }
            
        
    ]

    

    const MuteButton = (
        <div id='icon' onClick={handleMute}>
            {isMuted ?
                <MicOffRoundedIcon className="mute-button" />
                :
                <MicRoundedIcon className="mute-button" />
            }
        </div>
    );

    const DeafenButton = (
        <div id='icon' onClick={handleDeafen}>
            {isDeafened ?
                <HeadsetOffRoundedIcon className="mute-button" />
                :
                <HeadsetRoundedIcon className="mute-button" />
            }
        </div>
    );

    const leaveCall = (
        <div id='icon' onClick={() => console.log('Leave call')}>
            <PhoneDisabledRoundedIcon className="mute-button" />
        </div>
    );

    return (
        <div className="discord-call">
            <div className="call-controls">
                {MuteButton}
                {DeafenButton}
            </div>
            
            <div className="speakers">
                {/* Add speaker components here */}
                <span style={{ color: '#b9bbbe' }}>0 / 0</span>
            </div>
            
            <div className="leave-call">
                {leaveCall}
            </div>
        </div>
    );
};

export default DiscordCall;