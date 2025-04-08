export interface zenlessBattery {
    retcode: number;
    message: string;
    data:    Data;
}

export interface Data {
    energy:           Energy;
    vitality:         Vitality;
    vhsSale:          VhsSale;
    cardSign:         string;
    bountyCommission: BountyCommission;
    surveyPoints:     null;
    abyssRefresh:     number;
    coffee:           null;
    weeklyTask:       null;
}

export interface BountyCommission {
    num:         number;
    total:       number;
    refreshTime: number;
}

export interface Energy {
    progress: Vitality;
    restore:  number;
    dayType:  number;
    hour:     number;
    minute:   number;
}

export interface Vitality {
    max:     number;
    current: number;
}

export interface VhsSale {
    saleState: string;
}
