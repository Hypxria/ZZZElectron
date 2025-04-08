interface genshinInfo {
    retcode: number;
    message: string;
    data: GameData;
}

interface Equip {
    id: number;
    level: number;
    rank: number;
    name: string;
    desc: string;
    icon: string;
    rarity: number;
}

interface Avatar {
    id: number;
    level: number;
    name: string;
    element: string;
    icon: string;
    rarity: number;
    rank: number;
    is_chosen: boolean;
    equip: Equip | null;
    base_type: number;
    figure_path: string;
    element_id: number;
}

interface FieldExt {
    link: string;
    backup_link: string;
}

interface Stats {
    active_days: number;
    avatar_num: number;
    achievement_num: number;
    chest_num: number;
    abyss_process: string;
    field_ext_map: {
        [key: string]: FieldExt;
    };
    dream_paster_num: number;
    season_title: string;
}

interface GameData {
    stats: Stats;
    avatar_list: Avatar[];
    cur_head_icon_url: string;
    phone_background_image_url: string;
}

