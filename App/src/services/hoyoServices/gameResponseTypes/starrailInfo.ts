export interface starrailInfo {
    retcode: number;
    message: string;
    data: Data;
}

interface Data {
    stats: Stats;
    avatar_list: AvatarList[];
    cur_head_icon_url: string;
    phone_background_image_url: string;
}

interface AvatarList {
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

interface Equip {
    id: number;
    level: number;
    rank: number;
    name: string;
    desc: string;
    icon: string;
    rarity: number;
}

interface Stats {
    active_days: number;
    avatar_num: number;
    achievement_num: number;
    chest_num: number;
    abyss_process: string;
    field_ext_map: FieldEXTMap;
    dream_paster_num: number;
    season_title: string;
}

interface FieldEXTMap {
    season_title: AchievementNum;
    active_days: AchievementNum;
    avatar_num: AchievementNum;
    achievement_num: AchievementNum;
    chest_num: AchievementNum;
    dream_paster_num: AchievementNum;
}

interface AchievementNum {
    link: string;
    backup_link: string;
}
