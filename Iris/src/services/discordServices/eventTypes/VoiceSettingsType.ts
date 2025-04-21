export interface VoiceSettingsType {
    cmd:   string;
    data:  Data;
    nonce: string;
}

export interface Data {
    input:                  Put;
    output:                 Put;
    mode:                   Mode;
    automatic_gain_control: boolean;
    echo_cancellation:      boolean;
    noise_suppression:      boolean;
    qos:                    boolean;
    silence_warning:        boolean;
    deaf:                   boolean;
    mute:                   boolean;
}

export interface Put {
    available_devices: AvailableDevice[];
    device_id:         string;
    volume:            number;
}

export interface AvailableDevice {
    id:   string;
    name: string;
}

export interface Mode {
    type:           string;
    auto_threshold: boolean;
    threshold:      number;
    shortcut:       Shortcut[];
    delay:          number;
}

export interface Shortcut {
    type: number;
    code: number;
    name: string;
}
