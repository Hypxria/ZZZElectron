export interface GetChannelType {
    cmd: string;
    data: Data;
    nonce: string;
}

export interface Data {
    id: string;
    name: string;
    type: number;
    bitrate: number;
    user_limit: number;
    guild_id: string;
    position: number;
    voice_states: VoiceStateElement[];
}

export interface VoiceStateElement {
    voice_state: VoiceStateVoiceState;
    user: User;
    nick: string;
    volume: number;
    mute: boolean;
    pan: Pan;
}

export interface Pan {
    left: number;
    right: number;
}

export interface User {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    bot: boolean;
}

export interface VoiceStateVoiceState {
    mute: boolean;
    deaf: boolean;
    self_mute: boolean;
    self_deaf: boolean;
    suppress: boolean;
}
