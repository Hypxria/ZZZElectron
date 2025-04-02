export interface zenlessInfo {
    data:    Data;
    message: string;
    retcode: number;
}

interface Data {
    stats:          Stats;
    avatarList:     AvatarList[];
    curHeadIconURL: string;
    buddyList:      BuddyList[];
    catNotesList:   CatNotesList[];
    awardState:     string;
    gameDataShow:   GameDataShow;
}

interface AvatarList {
    id:               number;
    level:            number;
    nameMi18N:        string;
    fullNameMi18N:    string;
    elementType:      number;
    campNameMi18N:    string;
    avatarProfession: number;
    rarity:           string;
    groupIconPath:    string;
    hollowIconPath:   string;
    rank:             number;
    isChosen:         boolean;
    roleSquareURL:    string;
    subElementType:   number;
}

interface BuddyList {
    id:                  number;
    name:                string;
    rarity:              string;
    level:               number;
    star:                number;
    bangbooRectangleURL: string;
}

interface CatNotesList {
    name:      string;
    icon:      string;
    num:       number;
    total:     number;
    isLock:    boolean;
    id:        number;
    medalList: MedalList[];
    wikiURL:   string;
}

interface MedalList {
    questID:  number;
    name:     string;
    desc:     string;
    icon:     string;
    isFinish: boolean;
}

interface GameDataShow {
    personalTitle:    string;
    titleMainColor:   string;
    titleBottomColor: string;
    titleBgURL:       string;
    medalList:        string[];
    cardURL:          string;
    medalItemList:    List[];
    allMedalList:     List[];
}

interface List {
    medalIcon: string;
    number:    number;
    medalType: string;
    name:      string;
    isShow:    boolean;
    medalID:   number;
}

interface Stats {
    activeDays:              number;
    avatarNum:               number;
    worldLevelName:          string;
    curPeriodZoneLayerCount: number;
    buddyNum:                number;
    commemorativeCoinsList:  CommemorativeCoinsList[];
    achievementCount:        number;
    climbingTowerLayer:      number;
    nextHundredLayer:        string;
    memoryBattlefield:       MemoryBattlefield;
    stableZoneLayerCount:    number;
    allChangeZoneLayerCount: number;
    climbingTowerS2:         ClimbingTowerS2;
}

interface ClimbingTowerS2 {
    climbingTowerLayer: number;
    floorMVPNum:        number;
}

interface CommemorativeCoinsList {
    num:     number;
    name:    string;
    sort:    number;
    url:     string;
    wikiURL: string;
}

interface MemoryBattlefield {
    rankPercent: number;
    totalScore:  number;
    totalStar:   number;
}
