export interface DiscordNotificationType {
    data:any | undefined | null
    channel_id: number,
    message: {
        id: number,
        content: string,
        content_parsed: any[];
        nick: string,
        timestamp: string,
        tts: boolean,
        mentions: string[],
        mention_roles: string[],
        embeds: any[],
        attachments: any[],
        author: {
            id: string,
            username: string,
            discriminator: number,
            global_name: string,
            avatar: string,
            avatar_decoration_data: any,
            bot: false,
            flags: number,
            premium_type: number,
        },
        pinned: boolean,
        type: number
    },
    icon_url: string,
    title: string,
    body: string,
}