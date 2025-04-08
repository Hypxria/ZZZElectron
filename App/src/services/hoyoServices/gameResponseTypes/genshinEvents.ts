export interface genshinEvents {
    data: Data;
}

export interface Data {
    avatarCardPoolList:         CardPoolList[];
    weaponCardPoolList:         CardPoolList[];
    mixedCardPoolList:          any[];
    selectedAvatarCardPoolList: CardPoolList[];
    selectedMixedCardPoolList:  any[];
    actList:                    ActList[];
    fixedActList:               ActList[];
    selectedActList:            ActList[];
}

export interface ActList {
    id:                number;
    name:              string;
    type:              string;
    startTimestamp:    string;
    startTime:         Time | null;
    endTimestamp:      string;
    endTime:           Time | null;
    desc:              string;
    strategy:          string;
    countdownSeconds:  number;
    status:            number;
    rewardList:        RewardList[];
    isFinished:        boolean;
    exploreDetail?:    ExploreDetail;
    doubleDetail?:     DoubleDetail;
    roleCombatDetail?: RoleCombatDetail;
    towerDetail?:      TowerDetail;
}

export interface DoubleDetail {
    total: number;
    left:  number;
}

export interface Time {
    year:   number;
    month:  number;
    day:    number;
    hour:   number;
    minute: number;
    second: number;
}

export interface ExploreDetail {
    explorePercent: number;
    isFinished:     boolean;
}

export interface RewardList {
    itemID:       number;
    name:         string;
    icon:         string;
    wikiURL:      string;
    num:          number;
    rarity:       string;
    homepageShow: boolean;
}

export interface RoleCombatDetail {
    isUnlock:   boolean;
    maxRoundID: number;
    hasData:    boolean;
}

export interface TowerDetail {
    isUnlock:  boolean;
    maxStar:   number;
    totalStar: number;
    hasData:   boolean;
}

export interface CardPoolList {
    poolID:           number;
    versionName:      string;
    poolName:         string;
    poolType:         number;
    avatars:          Avatar[];
    weapon:           Weapon[];
    startTimestamp:   string;
    startTime:        Time;
    endTimestamp:     string;
    endTime:          Time;
    jumpURL:          string;
    poolStatus:       number;
    countdownSeconds: number;
}

export interface Avatar {
    id:          number;
    icon:        string;
    name:        string;
    element:     Element;
    rarity:      number;
    isInvisible: boolean;
}

export enum Element {
    Anemo = "Anemo",
    Electro = "Electro",
    Pyro = "Pyro",
}

export interface Weapon {
    id:      number;
    icon:    string;
    rarity:  number;
    name:    string;
    wikiURL: string;
}
