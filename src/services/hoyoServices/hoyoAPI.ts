import axios, { AxiosInstance } from 'axios';
import { Region, Game, getDsHeaders } from './ds';

class CookieManager {
    private cookies: Record<string, string> = {};

    setCookies(cookieString: string): void {
        this.cookies = this.parseCookieString(cookieString);
    }

    private parseCookieString(cookieString: string): Record<string, string> {
        const cookies: Record<string, string> = {};
        cookieString.split(';').forEach(cookie => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
                cookies[key] = value;
            }
        });
        return cookies;
    }

    getEssentialCookies(): Record<string, string> {
        const essentialCookies: Record<string, string> = {};
        const requiredCookies = [
            'account_id',
            'cookie_token',
            'ltoken',
            'ltuid'
        ];

        for (const cookie of requiredCookies) {
            if (this.cookies[cookie]) {
                essentialCookies[cookie] = this.cookies[cookie];
            }
        }
        return essentialCookies;
    }

    formatForHeader(): string {
        return Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    }
}

export class HoyoManager {
    private cookieManager: CookieManager;
    private uid: string;
    private axios: AxiosInstance;
    public genshin: GenshinManager;
    public starrail: StarrailManager;
    public zenless: ZenlessManager;

    constructor(cookieString: string, uid: string) {
        this.cookieManager = new CookieManager();
        this.cookieManager.setCookies(cookieString);
        this.uid = uid;
        
        this.axios = axios.create({
            headers: {
                'Cookie': this.cookieManager.formatForHeader(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'x-rpc-language': 'en-us'
            }
        });

        this.genshin = new GenshinManager(this);
        this.starrail = new StarrailManager(this);
        this.zenless = new ZenlessManager(this);
    }

    async getBaseDetails() {
        const params = {
            role_id: this.uid,
            server: 'os_usa'
        };
        return await this.makeRequest('https://api-account.hoyoverse.com/binding/api/getUserGameRolesByStoken', params);
    }

    async makeRequest(endpoint: string, params: Record<string, any> = {}, region: Region = Region.OVERSEAS) {
        try {
            const headers = getDsHeaders(region);
            const response = await this.axios.get(endpoint, {
                params,
                headers
            });
            return response.data;
        } catch (error) {
            console.error('Error making request:', error);
            throw error;
        }
    }
}

class GenshinManager {
    private mainApi: HoyoManager;

    constructor(mainApi: HoyoManager) {
        this.mainApi = mainApi;
    }

    async printStatus(): Promise<void> {
        const info = await this.getInfo();
        console.log('Genshin Impact Status:', info);
    }

    async getInfo() {
        return await this.mainApi.makeRequest('https://bbs-api-os.hoyoverse.com/game_record/genshin/api/index');
    }

    async getSpiral() {
        return await this.mainApi.makeRequest('https://bbs-api-os.hoyoverse.com/game_record/genshin/api/spiralAbyss');
    }
}

class StarrailManager {
    private mainApi: HoyoManager;

    constructor(mainApi: HoyoManager) {
        this.mainApi = mainApi;
    }

    async printStatus(): Promise<void> {
        const info = await this.getInfo();
        console.log('Star Rail Status:', info);
    }

    async getInfo() {
        return await this.mainApi.makeRequest('https://bbs-api-os.hoyoverse.com/game_record/hkrpg/api/index');
    }

    async getStamina() {
        return await this.mainApi.makeRequest('https://bbs-api-os.hoyoverse.com/game_record/hkrpg/api/note');
    }

    async getForgottenHall() {
        return await this.mainApi.makeRequest('https://bbs-api-os.hoyoverse.com/game_record/hkrpg/api/challenge');
    }
}

class ZenlessManager {
    private mainApi: HoyoManager;

    constructor(mainApi: HoyoManager) {
        this.mainApi = mainApi;
    }

    async printStatus(): Promise<void> {
        const info = await this.getInfo();
        console.log('Zenless Zone Zero Status:', info);
    }

    async getInfo() {
        return await this.mainApi.makeRequest('https://sg-public-api.hoyoverse.com/zgw/zzz/anonymous/v1/user/info');
    }

    async getBatteryInfo() {
        return await this.mainApi.makeRequest('https://sg-public-api.hoyoverse.com/zgw/zzz/anonymous/v1/user/battery/info');
    }

    async getDeadlyAssault() {
        return await this.mainApi.makeRequest('https://sg-public-api.hoyoverse.com/zgw/zzz/anonymous/v1/user/deadly_assault/info');
    }

    async getShiyu() {
        return await this.mainApi.makeRequest('https://sg-public-api.hoyoverse.com/zgw/zzz/anonymous/v1/user/shiyu/info');
    }

    async getHZ() {
        return await this.mainApi.makeRequest('https://sg-public-api.hoyoverse.com/zgw/zzz/anonymous/v1/user/hz/info');
    }
}

export default HoyoManager;