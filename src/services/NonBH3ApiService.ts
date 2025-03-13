    import axios, { AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
    import constants from './constants';

    // Type definitions
    interface GameAccount {
    uid: string;
    region: string;
    game_biz: string;
    level: number;
    nickname: string;
    }

    interface ApiResponse<T> {
    retcode: number;
    message: string;
    data: T;
    }



    // Game types
    enum GameType {
    GENSHIN_IMPACT = 'hk4e',
    HONKAI_STAR_RAIL = 'hkrpg',
    ZENLESS_ZONE_ZERO = 'nap'
    }

    // Authentication headers
    interface AuthHeaders {
    cookie: string;
    'x-rpc-app_version'?: string;
    'x-rpc-client_type'?: string;
    'x-rpc-language'?: string;
    ds?: string;
    }

    // Generate DS signature for API requests
    function generateDS(salt: string = constants.DS_GLOBAL_SALT): string {
    const t = Math.floor(Date.now() / 1000);
    const r = Math.floor(Math.random() * 900000 + 100000);
    // In a real implementation, you would use the crypto library
    // This is a placeholder for the hash calculation
    const h = `${salt}${t}${r}`; // Replace with actual MD5 hash
    return `${t},${r},${h}`;
    }

    // Create default headers for authenticated requests
    function createHeaders(cookie: string): AuthHeaders {
    return {
        cookie,
        'x-rpc-app_version': '2.44.0',
        'x-rpc-client_type': '5',
        'x-rpc-language': 'en-us',
        ds: generateDS()
    };
    }

    /**
     * Main HoyolabAPI class to interact with various Hoyoverse game APIs
     */
    class HoyolabAPI {
    private cookie: string;
    private headers: AuthHeaders;

    constructor(cookie: string) {
        this.cookie = cookie;
        this.headers = createHeaders(cookie);
    }

    /**
     * Fetches user's full profile information
     */
    async getUserFullInfo(): Promise<ApiResponse<any>> {
        const url = `${constants.OS_HOYOLAB_BBS_API}/${constants.OS_USER_FULL_INFO}`;
        return this.makeRequest(url, 'GET');
    }

    /**
     * Fetches all game accounts linked to the current Hoyolab account
     */
    async getGameAccounts(): Promise<ApiResponse<GameAccount[]>> {
        const url = `${constants.OS_TAKUMI_API}/${constants.OS_GAME_ROLES_BY_COOKIE}`;
        return this.makeRequest(url, 'GET');
    }

    /**
     * Lists all trusted devices for the current account
     */
    async getTrustedDevices(): Promise<ApiResponse<any>> {
        const url = `${constants.OS_ACCOUNT_API}/${constants.OS_TRUSTED_DEVICES_BY_COOKIE}`;
        return this.makeRequest(url, 'GET');
    }

    /**
     * Redeems a code for a specific game
     * @param code - The redemption code to use
     * @param uid - The user ID for the game account
     * @param game - The game type (hk4e, hkrpg, nap)
     */
    async redeemCode(code: string, uid: string, game: GameType): Promise<ApiResponse<any>> {
        let url: string;
        if (game === GameType.HONKAI_STAR_RAIL) {
        url = `${constants.OS_TAKUMI_API}/${constants.OS_WEB_EXCHANGE_CD_KEY_HKRPG}`;
        } else {
        url = `${constants.OS_TAKUMI_API}/${constants.OS_WEB_EXCHANGE_CD_KEY_HK4E_NAP}`;
        }

        const data = {
        uid,
        region: this.getRegionFromUid(uid, game),
        cdkey: code,
        game_biz: this.getGameBiz(game)
        };

        return this.makeRequest(url, 'POST', data);
    }

    /**
     * Lists available redemption codes
     */
    async getRedemptionCodes(): Promise<ApiResponse<any>> {
        const url = `${constants.OS_HOYOLAB_BBS_API}/${constants.OS_CD_KEY_LIST}`;
        return this.makeRequest(url, 'GET');
    }

    /**
     * Fetches gacha history for a specific game
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     * @param gachaType - Type of gacha banner
     * @param endId - End ID for pagination (optional)
     * @param size - Number of records to return (default: constants.OS_GACHA_LOG_PAGE_SIZE)
     */
    async getGachaLogs(
        uid: string, 
        game: GameType, 
        gachaType: number, 
        endId?: string, 
        size: number = constants.OS_GACHA_LOG_PAGE_SIZE
    ): Promise<ApiResponse<any>> {
        const gameApi = this.getGameApi(game);
        const url = `${gameApi}/${constants.OS_GACHA_LOG[game]}`;
        
        const params = {
        uid,
        region: this.getRegionFromUid(uid, game),
        gacha_type: gachaType,
        size: size.toString(),
        ...(endId && { end_id: endId })
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Fetches battle chronicle data for a game account
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     */
    async getBattleChronicleIndex(uid: string, game: GameType): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(game, 'index');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, game)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Updates privacy settings for battle chronicles
     * @param isPublic - Whether to make the data public or private
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     */
    async updateBattleChroniclePrivacy(isPublic: boolean, uid: string, game: GameType): Promise<ApiResponse<any>> {
        const url = `${constants.OS_HOYOLAB_BBS_API}/${constants.OS_BATTLE_CHRONICLES_PRIVACY_SETTINGS}`;
        
        const data = {
        game_id: this.getGameId(game),
        is_public: isPublic,
        switch_id: 1, // Default switch ID
        uid
        };

        return this.makeRequest(url, 'POST', data);
    }

    /**
     * Performs the daily check-in for a specific game
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     */
    async performDailyCheckIn(uid: string, game: GameType): Promise<ApiResponse<any>> {
        const actId = constants.OS_SOL_ACTS[game];
        let url: string;
        
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HK4E_SIGN}`;
            break;
        case GameType.HONKAI_STAR_RAIL:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HKRPG_SIGN}`;
            break;
        case GameType.ZENLESS_ZONE_ZERO:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_NAP_SIGN}`;
            break;
        }

        const data = {
        act_id: actId,
        region: this.getRegionFromUid(uid, game),
        uid
        };

        return this.makeRequest(url, 'POST', data);
    }

    /**
     * Gets the check-in information for a specific game
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     */
    async getCheckInInfo(uid: string, game: GameType): Promise<ApiResponse<any>> {
        const actId = constants.OS_SOL_ACTS[game];
        let url: string;
        
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HK4E_INFO}`;
            break;
        case GameType.HONKAI_STAR_RAIL:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HKRPG_INFO}`;
            break;
        case GameType.ZENLESS_ZONE_ZERO:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_NAP_INFO}`;
            break;
        }

        const params = {
        act_id: actId,
        region: this.getRegionFromUid(uid, game),
        uid
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Gets the check-in rewards for a specific game
     * @param game - Game type (hk4e, hkrpg, nap)
     */
    async getCheckInRewards(game: GameType): Promise<ApiResponse<any>> {
        const actId = constants.OS_SOL_ACTS[game];
        let url: string;
        
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HK4E_HOME}`;
            break;
        case GameType.HONKAI_STAR_RAIL:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_HKRPG_HOME}`;
            break;
        case GameType.ZENLESS_ZONE_ZERO:
            url = `${constants.OS_TAKUMI_API}/${constants.OS_SOL_NAP_HOME}`;
            break;
        }

        const params = {
        act_id: actId,
        lang: 'en-us'
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Fetches game-specific battle chronicle data
     * @param uid - User ID for the game account
     * @param game - Game type (hk4e, hkrpg, nap)
     * @param endpoint - Specific endpoint to fetch data from
     */
    async getBattleChronicleData(uid: string, game: GameType, endpoint: string): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(game, endpoint);
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, game)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    // Game-specific methods
    
    // Genshin Impact (hk4e) specific methods
    
    /**
     * Gets Spiral Abyss data for Genshin Impact
     * @param uid - User ID for the game account
     * @param schedule - Abyss schedule (1: current, 2: previous)
     */
    async getGenshinSpiralAbyss(uid: string, schedule: number = 1): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.GENSHIN_IMPACT, 'spiralAbyss');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.GENSHIN_IMPACT),
        schedule_type: schedule.toString()
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Gets character list for Genshin Impact
     * @param uid - User ID for the game account
     */
    async getGenshinCharacters(uid: string): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.GENSHIN_IMPACT, 'charactersList');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.GENSHIN_IMPACT)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    // Honkai Star Rail (hkrpg) specific methods
    
    /**
     * Gets Forgotten Hall data for Honkai: Star Rail
     * @param uid - User ID for the game account
     * @param schedule - Schedule type (1: current, 2: previous)
     */
    async getStarRailForgottenHall(uid: string, schedule: number = 1): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.HONKAI_STAR_RAIL, 'forgottenHall');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.HONKAI_STAR_RAIL),
        schedule_type: schedule.toString()
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Gets character information for Honkai: Star Rail
     * @param uid - User ID for the game account
     */
    async getStarRailCharacters(uid: string): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.HONKAI_STAR_RAIL, 'avatarInfo');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.HONKAI_STAR_RAIL)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    // Zenless Zone Zero (nap) specific methods
    
    /**
     * Gets Deadly Assault data for Zenless Zone Zero
     * @param uid - User ID for the game account
     */
    async getZZZDeadlyAssault(uid: string): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.ZENLESS_ZONE_ZERO, 'deadlyAssault');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.ZENLESS_ZONE_ZERO)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    /**
     * Gets character information for Zenless Zone Zero
     * @param uid - User ID for the game account
     */
    async getZZZCharacters(uid: string): Promise<ApiResponse<any>> {
        const url = this.getBattleChronicleUrl(GameType.ZENLESS_ZONE_ZERO, 'avatarBasic');
        const params = {
        role_id: uid,
        server: this.getRegionFromUid(uid, GameType.ZENLESS_ZONE_ZERO)
        };

        return this.makeRequest(url, 'GET', null, params);
    }

    // Helper methods
    
    private getBattleChronicleUrl(game: GameType, endpoint: string): string {
        const baseApi = this.getGameBattleChronicleApi(game);
        const gameBattleChronicles = constants.OS_BATTLE_CHONICLES[game];
        if (!gameBattleChronicles) {
            throw new Error(`No battle chronicles found for game ${game}`);
        }

        const endpointPath = gameBattleChronicles[endpoint as keyof typeof gameBattleChronicles];
        if (!endpointPath) {
            throw new Error(`No endpoint ${endpoint} found for game ${game}`);
        }

        return `${baseApi}/${endpointPath}`;
    }



    private getGameBattleChronicleApi(game: GameType): string {
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            return constants.OS_SG_HK4E_HOYOVERSE_API;
        case GameType.HONKAI_STAR_RAIL:
            return constants.OS_SG_HKRPG_HOYOVERSE_API;
        case GameType.ZENLESS_ZONE_ZERO:
            return constants.OS_PUB_OPERATIONS_NAP_API;
        default:
            throw new Error(`Unsupported game type: ${game}`);
        }
    }

    private getGameApi(game: GameType): string {
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            return constants.OS_SG_HK4E_HOYOVERSE_API;
        case GameType.HONKAI_STAR_RAIL:
            return constants.OS_SG_HKRPG_HOYOVERSE_API;
        case GameType.ZENLESS_ZONE_ZERO:
            return constants.OS_PUB_OPERATIONS_NAP_API;
        default:
            throw new Error(`Unsupported game type: ${game}`);
        }
    }

    private getGameBiz(game: GameType): string {
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            return 'hk4e_global';
        case GameType.HONKAI_STAR_RAIL:
            return 'hkrpg_global';
        case GameType.ZENLESS_ZONE_ZERO:
            return 'nap_global';
        default:
            throw new Error(`Unsupported game type: ${game}`);
        }
    }

    private getGameId(game: GameType): string {
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            return '2';
        case GameType.HONKAI_STAR_RAIL:
            return '6';
        case GameType.ZENLESS_ZONE_ZERO:
            return '8';
        default:
            throw new Error(`Unsupported game type: ${game}`);
        }
    }

    private getRegionFromUid(uid: string, game: GameType): string {
        const firstChar = uid.charAt(0);
        
        switch (game) {
        case GameType.GENSHIN_IMPACT:
            if (firstChar === '1' || firstChar === '2') return 'cn_gf01';
            if (firstChar === '5') return 'cn_qd01';
            if (firstChar === '6') return 'os_usa';
            if (firstChar === '7') return 'os_euro';
            if (firstChar === '8') return 'os_asia';
            if (firstChar === '9') return 'os_cht';
            break;
        case GameType.HONKAI_STAR_RAIL:
            if (firstChar === '1') return 'prod_gf_cn';
            if (firstChar === '2') return 'prod_qd_cn';
            if (firstChar === '6') return 'prod_official_usa';
            if (firstChar === '7') return 'prod_official_euro';
            if (firstChar === '8') return 'prod_official_asia';
            if (firstChar === '9') return 'prod_official_cht';
            break;
        case GameType.ZENLESS_ZONE_ZERO:
            if (firstChar === '1') return 'prod_gf_cn';
            if (firstChar === '2') return 'prod_qd_cn';
            if (firstChar === '6') return 'prod_official_usa';
            if (firstChar === '7') return 'prod_official_euro';
            if (firstChar === '8') return 'prod_official_asia';
            if (firstChar === '9') return 'prod_official_cht';
            break;
        }
        
        throw new Error(`Could not determine region for UID ${uid} in game ${game}`);
    }

    private async makeRequest<T>(
        url: string, 
        method: string, 
        data?: any, 
        params?: any
    ): Promise<ApiResponse<T>> {
        // Fixed: Convert AuthHeaders to a compatible type for Axios
        const config: AxiosRequestConfig = {
        method,
        url,
        headers: this.headers as unknown as RawAxiosRequestHeaders,
        params,
        data
        };

        try {
        const response = await axios(config);
        return response.data;
        } catch (error) {
        console.error('API request failed:', error);
        throw error;
        }
    }
    }

    async function name() {
        const api = new HoyolabAPI('mi18nLang=en-us; _HYVUUID=986c504e-f7a7-4cbf-9919-1c0b84d1411b; _MHYUUID=68b72dec-59ba-4f77-a086-a4a32b7ddd61; cookie_token_v2=v2_CAQSDGM5b3FhcTNzM2d1OBokOTg2YzUwNGUtZjdhNy00Y2JmLTk5MTktMWMwYjg0ZDE0MTFiIPTnvrwGKKqwyYkEMJyOsyxCC2Jic19vdmVyc2Vh.9LOPZwAAAAAB.MEQCIBHc_rlDqwmxBrX4bauw_2Tj-D0xPJ3zD2fVgfVu2tLFAiAStxBI0Zmd8EvHHOCPRsFqwCBZbW_HrTaZj_F3xfOhCA; account_mid_v2=1goqwou5uu_hy; account_id_v2=93112092; ltoken_v2=v2_CAISDGM5b3FhcTNzM2d1OBokOTg2YzUwNGUtZjdhNy00Y2JmLTk5MTktMWMwYjg0ZDE0MTFiIPTnvrwGKOu70vACMJyOsyxCC2Jic19vdmVyc2Vh.9LOPZwAAAAAB.MEQCIExD7xvvahBWihL2JEXc_Ueq0LPhW5-VlTlrk7GeUavVAiAgMo6By9zxNqWURJGjNXwa9tccHshbTAxNUtk2phIYMw; ltmid_v2=1goqwou5uu_hy; ltuid_v2=93112092; HYV_LOGIN_PLATFORM_OPTIONAL_AGREEMENT={%22content%22:[]}; HYV_LOGIN_PLATFORM_LOAD_TIMEOUT={}; HYV_LOGIN_PLATFORM_TRACKING_MAP={}; HYV_LOGIN_PLATFORM_LIFECYCLE_ID={%22value%22:%22223756da-f288-4690-8962-a38ee7f37412%22}; DEVICEFP_SEED_ID=3ee1932242c90399; DEVICEFP_SEED_TIME=1741873081018; DEVICEFP=38d7f4dea7722');
        console.log(api)

        // Get user's game accounts
        const accounts = await api.getGameAccounts();
        console.log(accounts);

        // Check in for Genshin Impact
        await api.performDailyCheckIn('615203407', GameType.GENSHIN_IMPACT);

        // Get Spiral Abyss data
        const spiralAbyss = await api.getGenshinSpiralAbyss('615203407');
        console.log(spiralAbyss);
        
    }

    name()
