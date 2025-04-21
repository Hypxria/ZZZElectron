export interface VoiceStateType {
    cmd:  string;
    evt:  string;
    data: Data;
}

export interface Data {
    voice_state: VoiceState;
    user:        User;
    nick:        string;
    volume:      number;
    mute:        boolean;
    pan:         Pan;
}

export interface Pan {
    left:  number;
    right: number;
}

export interface User {
    id:            string;
    username:      string;
    discriminator: string;
    avatar:        string;
    bot:           boolean;
}

export interface VoiceState {
    mute:      boolean;
    deaf:      boolean;
    self_mute: boolean;
    self_deaf: boolean;
    suppress:  boolean;
}
