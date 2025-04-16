import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Styles/DiscordCall.scss';

import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import HeadsetRoundedIcon from '@mui/icons-material/HeadsetRounded';
import HeadsetOffRoundedIcon from '@mui/icons-material/HeadsetOffRounded';
import PhoneDisabledRoundedIcon from '@mui/icons-material/PhoneDisabledRounded';

import { VoiceChannelSelectType } from '../../../services/discordServices/types';

import { GetChannelType } from './../../../services/discordServices/eventTypes/GetChannelType'
import { SpeakingType } from './../../../services/discordServices/eventTypes/SpeakingType';
import { VoiceStateType } from './../../../services/discordServices/eventTypes/VoiceStateType';

interface VoiceUsers {
    [key: string]: {
        uid: string;
        speaking: boolean;
        profile: string;
        nickname: string;
        muted: boolean;
        deafened: boolean;
        selfmuted: boolean;
        selfdeafened: boolean;
    }
}


// DiscordCall.tsx
const DiscordCall: React.FC = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [inCall, setIsInCall] = useState(false);
    const [callState, setCallState] = useState<VoiceUsers | null>(null)

    const handleMute = () => setIsMuted(!isMuted);
    const handleDeafen = () => setIsDeafened(!isDeafened);

    

    useEffect(() => {
        window.discord.onData(async (data: any) => {
            switch (data.evt) {
                case 'VOICE_CHANNEL_SELECT':
                    if (!data.data.channel_id) setCallState(null)
                    const initialData: GetChannelType = await window.discord.voice.getCurrentChannel()

                    const voiceUsers = initialData.data.voice_states.reduce((acc, state) => {
                        acc[state.user.id] = {
                            uid: state.user.id,
                            speaking: false,
                            profile: `https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}`, // Set your default value
                            nickname: state.nick,
                            muted: voiceStateCreateData.data.voice_state.mute,
                            deafened: voiceStateCreateData.data.voice_state.deaf,
                            selfmuted: voiceStateCreateData.data.voice_state.self_mute,
                            selfdeafened: voiceStateCreateData.data.voice_state.self_deaf
                        };
                        return acc;
                    }, {} as VoiceUsers);

                    setCallState(voiceUsers)

                    setIsInCall(true);
                    break;
                case 'VOICE_STATE_CREATE':
                    const voiceStateCreateData: VoiceStateType = data;
                    if (callState) {
                        const updatedCallState = { ...callState };
                        updatedCallState[voiceStateCreateData.data.user.id] = {
                            uid: voiceStateCreateData.data.user.id,
                            speaking: false,
                            profile: `https://cdn.discordapp.com/avatars/${voiceStateCreateData.data.user.id}/${voiceStateCreateData.data.user.avatar}`, // Set your default value
                            nickname: voiceStateCreateData.data.nick,
                            muted: voiceStateCreateData.data.voice_state.mute,
                            deafened: voiceStateCreateData.data.voice_state.deaf,
                            selfmuted: voiceStateCreateData.data.voice_state.self_mute,
                            selfdeafened: voiceStateCreateData.data.voice_state.self_deaf
                        };
                        setCallState(updatedCallState);
                    }
                    break;
                case 'VOICE_STATE_UPDATE':
                    console.log('Voice State Updated:', data);
                    const voiceStateUpdateData: VoiceStateType = data;
                    if (callState) {
                        const updatedCallState = { ...callState };
                        updatedCallState[voiceStateUpdateData.data.user.id] = {
                            uid: voiceStateUpdateData.data.user.id,
                            speaking: callState[voiceStateUpdateData.data.user.id].speaking,
                            profile: `https://cdn.discordapp.com/avatars/${voiceStateUpdateData.data.user.id}/${voiceStateUpdateData.data.user.avatar}`, // Set your default value
                            nickname: voiceStateUpdateData.data.nick,
                            muted: voiceStateUpdateData.data.voice_state.mute,
                            deafened: voiceStateUpdateData.data.voice_state.deaf,
                            selfmuted: voiceStateUpdateData.data.voice_state.self_mute,
                            selfdeafened: voiceStateUpdateData.data.voice_state.self_deaf
                        };
                        setCallState(updatedCallState);
                    }
                    break;
                case 'VOICE_STATE_DELETE':
                    const voiceStateDeleteData: VoiceChannelSelectType = data;
                    if (callState) {
                        const updatedCallState = { ...callState };
                        delete updatedCallState[data.data.user_id];
                        setCallState(updatedCallState);
                    }
                    break;
                case 'SPEAKING_START':
                    console.log('Speaking Start:', data);
                    const speakingData: SpeakingType = data;
                    if (callState) {
                        const updatedCallState = { ...callState };
                        updatedCallState[speakingData.data.user_id].speaking = true;
                        setCallState(updatedCallState);
                    }
                    break;
                case 'SPEAKING_STOP':
                    console.log('Speaking Stop:', data);
                    const speakingStopData: SpeakingType = data
                    if (callState) {
                        const updatedCallState = { ...callState };
                        updatedCallState[speakingStopData.data.user_id].speaking = false;
                        setCallState(updatedCallState);
                    }
                    break;
                default:
                    console.log('Unhandled event:', data.evt);
            }
        });
    }, []);

    const users = {
        'uid2': {
            uid: 'XXX',
            speaking: false,
            profile: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            nickname: 'User1',
            muted: false,
            deafened: false,
            selfmuted: false,
            selfdeafened: false
        },
        'uid': {
            speaking: false,
            profile: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            nickname: 'User2',
            muted: false,
            deafened: false,
            selfmuted: false,
            selfdeafened: false
        }
    }



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