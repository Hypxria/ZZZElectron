export interface zenlessBattery {
    retcode: number;
    message: string;
    data: Data;
}

export interface Data {
    energy: Energy;
    vitality: Vitality;
    vhs_sale: VhsSale;
    card_sign: string;
    bounty_commission: BountyCommission;
    survey_points: null;
    abyss_refresh: number;
    coffee: null;
    weekly_task: WeeklyTask;
}

interface WeeklyTask {
    refreshtime: number;
    cur_point: number;
    max_point: number;
}

export interface BountyCommission {
    num: number;
    total: number;
    refreshTime: number;
}

export interface Energy {
    progress: Vitality;
    restore: number;
    day_type: number;
    hour: number;
    minute: number;
}

export interface Vitality {
    max: number;
    current: number;
}

export interface VhsSale {
    sale_state: string;
}
