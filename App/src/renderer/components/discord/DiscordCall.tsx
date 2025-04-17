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
import { VoiceSettingsType } from './../../../services/discordServices/eventTypes/VoiceSettingsType';


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
    const [isInCall, setIsInCall] = useState(false);
    const [callState, setCallState] = useState<VoiceUsers | null>(null)

    const handleMute = () => {
        if (isDeafened) {
            setIsDeafened(false);
            window.discord.voice.undeafen();
            return;
        }
        if (!isMuted) window.discord.voice.mute();
        else window.discord.voice.unmute();

        setIsMuted(!isMuted)
    }
    const handleDeafen = () => {
        if (!isDeafened) window.discord.voice.deafen();
        else window.discord.voice.undeafen();

        setIsDeafened(!isDeafened)
        setIsMuted(!isMuted)
    }

    const handleLeave = () => {
        if (isInCall) {
            window.discord.voice.leave();
            setCallState(null)
        }

        setIsInCall(!isInCall)
    }

    const handleDiscordData = useCallback(async (data: any) => {
        const setInitial = (initialData: GetChannelType) => {
            if (!initialData) return;
            window.electron.log('setting initial')
            const voiceUsers = initialData?.data?.voice_states?.reduce((acc, state) => {
                acc[state.user.id] = {
                    uid: state.user.id,
                    speaking: false,
                    profile: `https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}?size=1024`, // Set your default value
                    nickname: state.nick,
                    muted: state.voice_state.mute,
                    deafened: state.voice_state.deaf,
                    selfmuted: state.voice_state.self_mute,
                    selfdeafened: state.voice_state.self_deaf
                };
                return acc;
            }, {} as VoiceUsers);

            
            if (!initialData?.data?.voice_states) {
                setIsInCall(false)
                return;
            } else {
                console.log(initialData?.data?.voice_states?.length)
                setIsInCall(true)
            }


            setCallState(voiceUsers)
            console.log(voiceUsers)

        }
        switch (data.evt ?? data.cmd) {
            case 'VOICE_CHANNEL_SELECT':
                if (!data.data.channel_id) {
                    setCallState(null);
                    setIsInCall(false)
                    console.log('no channel ID')
                    break;
                }
                console.log('channel ID')

                setIsInCall(true);
                console.log('getting channel')
                window.discord.voice.getVoiceChannel();
                console.log('getting voicesettings')
                window.discord.voice.getVoiceSettings();
                break;
            case 'GET_SELECTED_VOICE_CHANNEL':
                console.log('got channel')
                const initialData: GetChannelType = data;
                setInitial(initialData)
                break;
            case 'GET_VOICE_SETTINGS':
                console.log('got voicesettigns')
                const voiceSettingsData: VoiceSettingsType = data;
                setIsMuted(voiceSettingsData.data.mute)
                setIsDeafened(voiceSettingsData.data.deaf)
                break;
            case 'VOICE_STATE_CREATE':
                const voiceStateCreateData: VoiceStateType = data;
                setCallState((prevCallState): VoiceUsers | null => {
                    if (!prevCallState) return null;

                    const updatedCallState = { ...prevCallState };
                    updatedCallState[voiceStateCreateData.data.user.id] = {
                        uid: voiceStateCreateData.data.user.id,
                        speaking: false,
                        profile: `https://cdn.discordapp.com/avatars/${voiceStateCreateData.data.user.id}/${voiceStateCreateData.data.user.avatar}?size=1024`, // Set your default value
                        nickname: voiceStateCreateData.data.nick,
                        muted: voiceStateCreateData.data.voice_state.mute,
                        deafened: voiceStateCreateData.data.voice_state.deaf,
                        selfmuted: voiceStateCreateData.data.voice_state.self_mute,
                        selfdeafened: voiceStateCreateData.data.voice_state.self_deaf
                    }
                    console.log('created Call State:', updatedCallState);
                    return updatedCallState;
                })
                break;
            case 'VOICE_STATE_UPDATE':
                console.log('Voice State Updated:', data);
                const voiceStateUpdateData: VoiceStateType = data;
                setCallState((prevCallState): VoiceUsers | null => {
                    if (!prevCallState) return null;
                    const updatedCallState = { ...prevCallState };
                    updatedCallState[voiceStateUpdateData.data.user.id] = {
                        uid: voiceStateUpdateData.data.user.id,
                        speaking: prevCallState?.[voiceStateUpdateData.data.user.id]?.speaking || false,
                        profile: `https://cdn.discordapp.com/avatars/${voiceStateUpdateData.data.user.id}/${voiceStateUpdateData.data.user.avatar}?size=1024`, // Set your default value
                        nickname: voiceStateUpdateData.data.nick,
                        muted: voiceStateUpdateData.data.voice_state.mute,
                        deafened: voiceStateUpdateData.data.voice_state.deaf,
                        selfmuted: voiceStateUpdateData.data.voice_state.self_mute,
                        selfdeafened: voiceStateUpdateData.data.voice_state.self_deaf
                    };
                    console.log('Updated Call State:', updatedCallState);
                    return updatedCallState;  // Return the new state
                });
                break;
            case 'VOICE_STATE_DELETE':
                const voiceStateDeleteData: VoiceStateType = data;
                setCallState((prevCallState): VoiceUsers | null => {
                    if (!prevCallState) return null;

                    const updatedCallState = { ...prevCallState };
                    delete updatedCallState[voiceStateDeleteData.data.user.id];
                    return updatedCallState;
                });
                break;
            case 'SPEAKING_START':
                console.log('Speaking Start:', data);
                const speakingData: SpeakingType = data;
                setCallState((prevCallState): VoiceUsers | null => {
                    if (!prevCallState) return null;

                    const updatedCallState = { ...prevCallState };
                    updatedCallState[speakingData.data.user_id].speaking = true;
                    return updatedCallState;
                })
                break;
            case 'SPEAKING_STOP':
                console.log('Speaking Stop:', data);
                const speakingStopData: SpeakingType = data
                setCallState((prevCallState): VoiceUsers | null => {
                    if (!prevCallState) return null;

                    const updatedCallState = { ...prevCallState };
                    updatedCallState[speakingStopData.data.user_id].speaking = false;
                    return updatedCallState;
                })
                break;
            case 'VOICE_SETTINGS_UPDATE':
                const voiceSettingsUpdateData: VoiceSettingsType = data;
                setIsMuted(voiceSettingsUpdateData.data.mute)
                setIsDeafened(voiceSettingsUpdateData.data.deaf)
                break;
            default:
                console.log('Unhandled event:', data.evt, data.cmd);
        }
    }, [])

    useEffect(() => {
        console.log('CallState updated:', callState);
    }, [callState]);

    useEffect(() => {
        try {
            window.discord.onData(
                handleDiscordData
            );
            setTimeout(() => {
                window.discord.voice.getVoiceChannel();
                window.discord.voice.getVoiceSettings();
            }, 2000);
        } catch (error) {
            window.discord.removeDataListener();
            throw new Error(error)
        }
    }, []);

    const MuteButton = (
        <div id={`icon ${isMuted === true ? 'muted' : ''}`} onClick={handleMute}>
            {isMuted || isDeafened ?
                <MicOffRoundedIcon className="mute-button muted" />
                :
                <MicRoundedIcon className="mute-button" />
            }
        </div>
    );

    const DeafenButton = (
        <div id='icon' onClick={handleDeafen}>
            {isDeafened ?
                <HeadsetOffRoundedIcon className="mute-button muted" />
                :
                <HeadsetRoundedIcon className="mute-button" />
            }
        </div>
    );

    const leaveCall = (
        <div id='icon' onClick={handleLeave}>
            <PhoneDisabledRoundedIcon className="mute-button" />
        </div>
    );

    const StatusIcon = ({ isMuted, isDeafened }: { isMuted: boolean, isDeafened: boolean }) => (
        <div className={`status-icon ${isDeafened === true ? 'deaf' : isMuted === true ? 'mute' : ''}`} id='icon' >
            {isDeafened === true ?
                <HeadsetOffRoundedIcon className="mute-button muted" />
                : isMuted ?
                    <MicOffRoundedIcon className="mute-button muted" />
                    : <></>
            }
        </div>
    );


    return (
        <div className={`discord-call ${isInCall === true ? 'call' : ''}`}>
            <div className="call-controls">
                {MuteButton}
                {DeafenButton}
            </div>


            <div className={`speakers ${isInCall === true ? 'call' : ''}`}>
                {/* Add speaker components here */}
                {isInCall && callState && Object.values(callState).map((user, index) => (
                    <div className={`speaker ${user.speaking === true ? 'speaking' : ''}`} key={user.uid}>
                        <img src={user.profile} alt={user.nickname} />
                        <StatusIcon
                            isMuted={user?.selfmuted || user?.muted || false}
                            isDeafened={user?.selfdeafened || user?.deafened || false}
                        />
                    </div>
                ))}
            </div>



            <div className="leave-call">
                {leaveCall}
            </div>
        </div>
    );
};

export default DiscordCall;