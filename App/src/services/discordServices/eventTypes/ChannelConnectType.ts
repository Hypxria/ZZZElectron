export interface ChannelConnectType {
    cmd:  string;
    data: Data;
    evt:  string;
}

export interface Data {
    // null means no voice call, meaning that they left 
    channel_id: string | null;
    // the same rule does not apply here
    guild_id:   string | null;
}
