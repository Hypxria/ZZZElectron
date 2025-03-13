/*

// https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard?uid=93112092 (all games mini-details)

// HSR
// https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/index?server={server}&role_id={roleid} (HSR Details)
// https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/note?server=prod_official_usa&role_id=615855534 (HSR Battery Charge)
// https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (Something..?)
// https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge_story?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (also something?)
// https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge_boss?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (???)


// GI
// https://sg-public-api.hoyolab.com/event/game_record/genshin/api/index?avatar_list_type=0&server={server}&role_id={roleid} (Genshin Details?)

// ZZZ
// https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/index?server={server}&role_id={roleid} (ZZZ Details)
// https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/note?server=prod_gf_us&role_id=1000278659 (ZZZ Battery Charge)
// https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/mem_detail?uid=1000278659&region=prod_gf_us&schedule_type=1 (ZZZ Deadly Assault)
// https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/challenge?server=prod_gf_us&role_id=1000278659&schedule_type=1 (ZZZ Shiyu (Only Last four?))
// https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/abyss_abstract?server=prod_gf_us&role_id=1000278659 (ZZZ HZ)

Available cookie conversions:

- fetch_cookie_with_cookie
    - cookie_token -> cookie_token
    - cookie_token -> ltoken
    - stoken -> cookie_token
    - stoken -> ltoken
    - stoken -> login_ticket
- fetch_cookie_token_info
    - cookie_token -> cookie_token
    - login_ticket -> cookie_token
- fetch_cookie_with_stoken_v2
    - stoken (v2) + mid -> ltoken_v2 (token_type=2)
    - stoken (v2) + mid -> cookie_token_v2 (token_type=4)
- cn_fetch_cookie_token_with_stoken_v2
    - stoken (v2) + mid -> cookie_token
- fetch_cookie_token_with_game_token
    - game_token -> cookie_token
- fetch_stoken_with_game_token
    - game_token -> stoken
*/

interface GachaLog {
    hk4e: string;
    hkrpg: string;
    nap: string;
}

interface GameRecordCard {
    gameRecordCard: string;
    index: string;
}

interface HK4EBattleChronicles extends GameRecordCard {
    spiralAbyss: string;
    imaginariumTheatre: string;
    charactersList: string;
}

interface HKRPGBattleChronicles extends GameRecordCard {
    forgottenHall: string;
    pureFiction: string;
    apocalypticShadow: string;
    divergentUniverse: string;
    simulatedUniverse: string;
    unknowableDomain: string;
    swarmDisaster: string;
    goldAndGears: string;
    avatarInfo: string;
}

interface NAPBattleChronicles extends GameRecordCard {
    deadlyAssault: string;
    shiyuDefense: string;
    lostVoid: string;
    lostVoidDetail: string;
    witheredDomain: string;
    witheredDomainDetail: string;
    avatarBasic: string;
}

interface BH3BattleChronicles extends GameRecordCard {
    arenaReport: string;
    newAbyss: string;
    elysianRealm: string;
    characters: string;
}

interface BattleChronicles {
    hk4e: HK4EBattleChronicles;
    hkrpg: HKRPGBattleChronicles;
    nap: NAPBattleChronicles;
    bh3: BH3BattleChronicles;
}

interface SolActs {
    hk4e: string;
    hkrpg: string;
    nap: string;
    bh3: string;
}

const constants = {
    OS_HOYOLAB_BBS_API: "https://bbs-api-os.hoyolab.com",
    OS_SG_PUB_API: "https://sg-public-api.hoyolab.com",
    OS_SG_PUB_HOYOVERSE_API: "https://sg-public-api.hoyoverse.com",
    OS_WEB_API: "https://webapi-os.account.hoyoverse.com/Api",
    OS_ACCOUNT_API: "https://api-account-os.hoyolab.com/account/auth/api",
    OS_TAKUMI_API: "https://api-os-takumi.mihoyo.com",
    OS_PUB_OPERATIONS_NAP_API: "https://public-operation-nap.hoyoverse.com",

    OS_SG_HK4E_HOYOLAB_API: "https://sg-hk4e-api.hoyolab.com",
    OS_SG_HK4E_HOYOVERSE_API: "https://sg-hk4e-api.hoyoverse.com",
    OS_SG_HKRPG_HOYOVERSE_API: "https://sg-hkrpg-api.hoyoverse.com",

    OS_PUB_OPERATION_HK4E_SG_API: "https://public-operation-hk4e-sg.hoyoverse.com",
    OS_PUB_OPERATION_HKRPG_SG_API: "https://public-operation-hkrpg-sg.hoyoverse.com",
    OS_PUB_OPERATION_NAP_SG_API: "https://public-operation-nap-sg.hoyoverse.com",

    OS_USER_FULL_INFO: "community/user/wapi/getUserFullInfo",
    OS_WEB_LOGIN: "account/ma-passport/api/webLoginByPassword",
    OS_WEB_LOGOUT: "account/ma-passport/api/logout",
    OS_COOKIEV2_REFRESH: "account/ma-passport/token/getBySToken",
    OS_COOKIEV2_ACCOUNT_INFO: "fetch_cookie_accountinfo",
    OS_GAME_ROLES_BY_COOKIE: "binding/api/getUserGameRolesByCookie",
    OS_TRUSTED_DEVICES_BY_COOKIE: "device/api/listByCookieToken",

    OS_WEB_EXCHANGE_CD_KEY_HK4E_NAP: "common/apicdkey/api/webExchangeCdkey",
    OS_WEB_EXCHANGE_CD_KEY_HKRPG: "common/apicdkey/api/webExchangeCdkeyRisk",
    OS_CD_KEY_LIST: "community/painter/wapi/circle/channel/guide/material",

    OS_GACHA_LOG_PAGE_SIZE: 9,
    OS_GACHA_LOG: {
        hk4e: "gacha_info/api/getGachaLog",
        hkrpg: "common/gacha_record/api/getGachaLog",
        nap: "common/gacha_record/api/getGachaLog",
    } as GachaLog,

    OS_BATTLE_CHRONICLES_PAGE_SIZE: 1,
    OS_BATTLE_CHRONICLES_PRIVACY_SETTINGS: "game_record/card/wapi/changeDataSwitch",
    OS_BATTLE_CHONICLES: {
        hk4e: {
            gameRecordCard: "event/game_record/card/wapi/getGameRecordCard",
            index: "event/game_record/genshin/api/index",
            spiralAbyss: "event/game_record/genshin/api/spiralAbyss",
            imaginariumTheatre: "event/game_record/genshin/api/role_combat",
            charactersList: "event/game_record/genshin/api/character/list"
        },
        hkrpg: {
            gameRecordCard: "event/game_record/card/wapi/getGameRecordCard",
            index: "event/game_record/hkrpg/api/index",
            forgottenHall: "event/game_record/hkrpg/api/challenge",
            pureFiction: "event/game_record/hkrpg/api/challenge_story",
            apocalypticShadow: "event/game_record/hkrpg/api/challenge_boss",
            divergentUniverse: "event/game_record/hkrpg/api/rogue_tourn",
            simulatedUniverse: "event/game_record/hkrpg/api/rogue",
            // expansion module of simulated universe
            unknowableDomain: "event/game_record/hkrpg/api/rogue_magic",
            swarmDisaster: "event/game_record/hkrpg/api/rogue_locust",
            goldAndGears: "event/game_record/hkrpg/api/rogue_nous",
            avatarInfo: "event/game_record/hkrpg/api/avatar/info"
        },
        nap: {
            gameRecordCard: "game_record/card/wapi/getGameRecordCard",
            index: "event/game_record_zzz/api/zzz/index",
            deadlyAssault: "event/game_record_zzz/api/zzz/mem_detail",
            shiyuDefense: "event/game_record_zzz/api/zzz/challenge",
            lostVoid: "event/game_record_zzz/api/zzz/abysss2_abstract",
            lostVoidDetail: "event/game_record_zzz/api/zzz/abysss2_detail",
            witheredDomain: "event/game_record_zzz/api/zzz/abyss_abstract",
            witheredDomainDetail: "event/game_record_zzz/api/zzz/abyss_detail",
            avatarBasic: "event/game_record_zzz/api/zzz/avatar/basic"
        },
        bh3: {
            gameRecordCard: "game_record/card/wapi/getGameRecordCard",
            index: "game_record/honkai3rd/api/index",
            arenaReport: "game_record/honkai3rd/api/battleFieldReport",
            newAbyss: "game_record/honkai3rd/api/newAbyssReport",
            elysianRealm: "game_record/honkai3rd/api/godWar",
            characters: "game_record/honkai3rd/api/characters"
        }
    } as BattleChronicles,

    OS_SOL_REWARDS_PAGE_SIZE: 6,
    OS_SOL_HK4E_INFO: "event/sol/info",
    OS_SOL_HK4E_SIGN: "event/sol/sign",
    OS_SOL_HK4E_HOME: "event/sol/home",
    OS_SOL_HKRPG_SIGN: "event/luna/hkrpg/os/sign",
    OS_SOL_HKRPG_INFO: "event/luna/hkrpg/os/info",
    OS_SOL_HKRPG_HOME: "event/luna/hkrpg/os/home",
    OS_SOL_NAP_SIGN: "event/luna/zzz/os/sign",
    OS_SOL_NAP_INFO: "event/luna/zzz/os/info",
    OS_SOL_NAP_HOME: "event/luna/zzz/os/home",
    OS_SOL_BH3_SIGN: "event/mani/sign",
    OS_SOL_BH3_INFO: "event/mani/info",
    OS_SOL_BH3_HOME: "event/mani/home",

    OS_SOL_ACTS: {
        hk4e: "e202102251931481",
        hkrpg: "e202303301540311",
        nap: "e202406031448091",
        bh3: "e202110291205111"
    } as SolActs,

    OS_TRUSTED_DEVICES_PAGE_SIZE: 1,
    OS_APP_ID: "c9oqaq3s3gu8",
    DS_GLOBAL_SALT: "6s25p5ox5y14umn1p61aqyyvbvvl3lrt",
    DS_CN_SALT: "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs",
    DS_APP_LOGIN_SALT: "IZPgfb0dRPtBeLuFkdDznSZ6f4wWt6y2",

    // RSA key used for OS app/web login
    LOGIN_KEY_TYPE_1: `
-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4PMS2JVMwBsOIrYWRluY
wEiFZL7Aphtm9z5Eu/anzJ09nB00uhW+ScrDWFECPwpQto/GlOJYCUwVM/raQpAj
/xvcjK5tNVzzK94mhk+j9RiQ+aWHaTXmOgurhxSp3YbwlRDvOgcq5yPiTz0+kSeK
ZJcGeJ95bvJ+hJ/UMP0Zx2qB5PElZmiKvfiNqVUk8A8oxLJdBB5eCpqWV6CUqDKQ
KSQP4sM0mZvQ1Sr4UcACVcYgYnCbTZMWhJTWkrNXqI8TMomekgny3y+d6NX/cFa6
6jozFIF4HCX5aW8bp8C8vq2tFvFbleQ/Q3CU56EWWKMrOcpmFtRmC18s9biZBVR/
8QIDAQAB
-----END PUBLIC KEY-----
`,

    // RSA key used for CN app/game and game login
    LOGIN_KEY_TYPE_2: `
-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7
cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----
`
} as const

export default constants;

