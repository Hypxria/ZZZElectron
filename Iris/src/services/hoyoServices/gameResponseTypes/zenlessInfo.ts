export interface zenlessInfo {
    data:    Data;
    message: string;
    retcode: number;
}

interface Data {
    stats:             Stats;
    avatar_list:       AvatarList[];
    cur_head_icon_url: string;
    buddy_list:        BuddyList[];
    cat_notes_list:    CatNotesList[];
    award_state:       string;
    game_data_show:    GameDataShow;
}

interface AvatarList {
    id:                number;
    level:             number;
    name_mi18n:        string;
    full_name_mi18n:   string;
    element_type:      number;
    camp_name_mi18n:   string;
    avatar_profession: number;
    rarity:           string;
    group_icon_path:  string;
    hollow_icon_path: string;
    rank:             number;
    is_chosen:        boolean;
    role_square_url:  string;
    sub_element_type: number;
}

interface BuddyList {
    id:                    number;
    name:                  string;
    rarity:                string;
    level:                 number;
    star:                  number;
    bangboo_rectangle_url: string;
}

interface CatNotesList {
    name:       string;
    icon:       string;
    num:        number;
    total:      number;
    is_lock:    boolean;
    id:         number;
    medal_list: MedalList[];
    wiki_url:   string;
}

interface MedalList {
    quest_id:  number;
    name:      string;
    desc:      string;
    icon:      string;
    is_finish: boolean;
}

interface GameDataShow {
    personal_title:     string;
    title_main_color:   string;
    title_bottom_color: string;
    title_bg_url:       string;
    medal_list:         string[];
    card_url:           string;
    medal_item_list:    List[];
    all_medal_list:     List[];
}

interface List {
    medal_icon: string;
    number:     number;
    medal_type: string;
    name:       string;
    is_show:    boolean;
    medal_id:   number;
}

interface Stats {
    active_days:                 number;
    avatar_num:                  number;
    world_level_name:           string;
    cur_period_zone_layer_count: number;
    buddy_num:                   number;
    commemorative_coins_list:    CommemorativeCoinsList[];
    achievement_count:           number;
    climbing_tower_layer:        number;
    next_hundred_layer:         string;
    memory_battlefield:         MemoryBattlefield;
    stable_zone_layer_count:    number;
    all_change_zone_layer_count: number;
    climbing_tower_s2:          ClimbingTowerS2;
}

interface ClimbingTowerS2 {
    climbing_tower_layer: number;
    floor_mvp_num:        number;
}

interface CommemorativeCoinsList {
    num:      number;
    name:     string;
    sort:     number;
    url:      string;
    wiki_url: string;
}

interface MemoryBattlefield {
    rank_percent: number;
    total_score:  number;
    total_star:   number;
}