import { createHash } from 'crypto';

export enum Region {
    OVERSEAS = "OVERSEAS",
    CHINESE = "CHINESE"
}

export enum Game {
    GENSHIN = "GENSHIN",
    STARRAIL = "STARRAIL",
    ZENLESS = "ZENLESS"
}

const DS_SALT = {
    [Region.OVERSEAS]: {
        [Game.GENSHIN]: "6s25p5ox5y14umn1p61aqyyvbvvl3lrt",
        [Game.STARRAIL]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        [Game.ZENLESS]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    },
    [Region.CHINESE]: {
        [Game.GENSHIN]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        [Game.STARRAIL]: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
};

const DS_SALT_2 = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const DS_SALT_PAS = "5pFRlzRCPlVHRTI8";

export function generateDynamicSecret(salt: string = DS_SALT[Region.OVERSEAS][Game.GENSHIN]): string {
    const time = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    const stringToHash = `salt=${salt}&t=${time}&r=${random}`;
    const check = createHash('md5').update(stringToHash).digest('hex');
    return `${time},${random},${check}`;
}

export function generateCnDynamicSecret(body: Record<string, any> = {}, query: string = ""): string {
    const salt = DS_SALT[Region.CHINESE][Game.GENSHIN];
    const time = Math.floor(Date.now() / 1000);
    const stringToHash = `salt=${salt}&t=${time}&r=&b=${JSON.stringify(body)}&q=${query}`;
    const check = createHash('md5').update(stringToHash).digest('hex');
    return `${time},,${check}`;
}

export function getDsHeaders(
    region: Region = Region.OVERSEAS,
    game: Game = Game.GENSHIN,
    body: Record<string, any> = {},
    query: string = ""
): Record<string, string> {
    const ds = region === Region.CHINESE
        ? generateCnDynamicSecret(body, query)
        : generateDynamicSecret(DS_SALT[region][game]);
    
    return {
        'DS': ds,
        'x-rpc-app_version': '2.40.0',
        'x-rpc-client_type': '5',
    };
}

export function generatePassportDs(body: Record<string, any>): string {
    const salt = DS_SALT_PAS;
    const time = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    const stringToHash = `salt=${salt}&t=${time}&r=${random}&b=${JSON.stringify(body)}`;
    const check = createHash('md5').update(stringToHash).digest('hex');
    return `${time},${random},${check}`;
}

export function generateGeetestDs(region: Region): string {
    const salt = DS_SALT_2;
    const time = Math.floor(Date.now() / 1000);
    const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    const stringToHash = `salt=${salt}&t=${time}&r=${random}`;
    const check = createHash('md5').update(stringToHash).digest('hex');
    return `${time},${random},${check}`;
}