export interface starrailInfo {
    retcode: number;
    message: string;
    data:    Data;
}

interface Data {
    stats:                   Stats;
    avatarList:              AvatarList[];
    curHeadIconURL:          string;
    phoneBackgroundImageURL: string;
}

interface AvatarList {
    id:         number;
    level:      number;
    name:       string;
    element:    string;
    icon:       string;
    rarity:     number;
    rank:       number;
    isChosen:   boolean;
    equip:      Equip | null;
    baseType:   number;
    figurePath: string;
    elementID:  number;
}

interface Equip {
    id:     number;
    level:  number;
    rank:   number;
    name:   string;
    desc:   string;
    icon:   string;
    rarity: number;
}

interface Stats {
    activeDays:     number;
    avatarNum:      number;
    achievementNum: number;
    chestNum:       number;
    abyssProcess:   string;
    fieldEXTMap:    FieldEXTMap;
    dreamPasterNum: number;
    seasonTitle:    string;
}

interface FieldEXTMap {
    seasonTitle:    AchievementNum;
    activeDays:     AchievementNum;
    avatarNum:      AchievementNum;
    achievementNum: AchievementNum;
    chestNum:       AchievementNum;
    dreamPasterNum: AchievementNum;
}

interface AchievementNum {
    link:       string;
    backupLink: string;
}
