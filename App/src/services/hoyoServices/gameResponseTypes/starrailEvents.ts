export interface starrailEvents {
    actList: ActList[];
}

export interface ActList {
    id:                   number;
    version:              string;
    name:                 string;
    actType:              string;
    actStatus:            string;
    rewardList:           SpecialReward[];
    totalProgress:        number;
    currentProgress:      number;
    timeInfo:             TimeInfo;
    panelID:              number;
    panelDesc:            string;
    strategy:             string;
    multipleDropType:     number;
    multipleDropTypeList: any[];
    countRefreshType:     number;
    countValue:           number;
    dropMultiple:         number;
    isAfterVersion:       boolean;
    sortWeight:           number;
    specialReward:        SpecialReward;
    allFinished:          boolean;
    showText:             string;
    actTimeType:          string;
}

export interface SpecialReward {
    itemID:     number;
    name:       string;
    icon:       string;
    wikiURL:    string;
    num:        number;
    rarity:     string;
    rewardType: RewardType;
}

export enum RewardType {
    RewardTypeEquip = "RewardTypeEquip",
    RewardTypeNormal = "RewardTypeNormal",
}

export interface TimeInfo {
    startTs:   string;
    endTs:     string;
    startTime: string;
    endTime:   string;
    now:       string;
}
