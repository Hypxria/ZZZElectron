export interface starrailBattery {
    retcode: number;
    message: string;
    data:    Data;
}

export interface Data {
    currentStamina:           number;
    maxStamina:               number;
    staminaRecoverTime:       number;
    staminaFullTs:            number;
    acceptedEpeditionNum:     number;
    totalExpeditionNum:       number;
    expeditions:              Expedition[];
    currentTrainScore:        number;
    maxTrainScore:            number;
    currentRogueScore:        number;
    maxRogueScore:            number;
    weeklyCocoonCnt:          number;
    weeklyCocoonLimit:        number;
    currentReserveStamina:    number;
    isReserveStaminaFull:     boolean;
    rogueTournWeeklyUnlocked: boolean;
    rogueTournWeeklyMax:      number;
    rogueTournWeeklyCur:      number;
    currentTs:                number;
    rogueTournExpIsFull:      boolean;
}

export interface Expedition {
    avatars:       string[];
    status:        string;
    remainingTime: number;
    name:          string;
    itemURL:       string;
    finishTs:      number;
}
