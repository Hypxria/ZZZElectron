export interface starrailEvents {
    act_list: ActList[];
}

export interface ActList {
    id:                        number;
    version:                   string;
    name:                      string;
    act_type:                 string;
    act_status:               string;
    reward_list:              SpecialReward[];
    total_progress:           number;
    current_progress:         number;
    time_info:                TimeInfo;
    panel_id:                 number;
    panel_desc:               string;
    strategy:                 string;
    multiple_drop_type:       number;
    multiple_drop_type_list:  any[];
    count_refresh_type:       number;
    count_value:              number;
    drop_multiple:            number;
    is_after_version:         boolean;
    sort_weight:              number;
    special_reward:           SpecialReward;
    all_finished:             boolean;
    show_text:                string;
    act_time_type:            string;
}

export interface SpecialReward {
    item_id:      number;
    name:         string;
    icon:         string;
    wiki_url:     string;
    num:          number;
    rarity:       string;
    reward_type:  RewardType;
}

export enum RewardType {
    RewardTypeEquip = "RewardTypeEquip",
    RewardTypeNormal = "RewardTypeNormal",
}

export interface TimeInfo {
    start_ts:    string;
    end_ts:      string;
    start_time:  string;
    end_time:    string;
    now:         string;
}
