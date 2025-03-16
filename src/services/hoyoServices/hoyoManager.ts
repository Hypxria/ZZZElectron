import { CookieManager } from './CookieManager';
import { generateDynamicSecret, generateCnDynamicSecret, DS_SALT } from './ds';
import { Region, Game, GameRecord, DSHeaders } from './types';
import axios, { AxiosResponse } from 'axios';

const CN_REGIONS = ['prod_gf_sg', 'prod_official_cht', 'os_cht'];

export class HoyoManager {
  // API endpoints
  public readonly userInfoUrl = "https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard";
  public readonly zzzInfoUrl = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/index";
  public readonly zzzBatteryUrl = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/note";
  public readonly deadlyAssaultUrl = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/mem_detail";
  public readonly shiyuUrl = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/challenge";
  public readonly hollowUrl = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/abyss_abstract";
  public readonly giInfoUrl = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/index";
  public readonly giSpiralUrl = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/spiralAbyss";
  public readonly starrailInfoUrl = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/index";
  public readonly starrailBatteryUrl = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/note";
  public readonly starrailShiyuUrl = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge";

  public readonly zenless: ZenlessManager;
  public readonly starrail: StarrailManager;
  public readonly genshin: GenshinManager;

  private cookieManager: CookieManager;
  private uid: string;
  
  // Game properties
  public _genshinUid?: string;
  public _genshinRegion?: string;
  public _starrailUid?: string;
  public _starrailRegion?: string;
  public _zenlessUid?: string;
  public _zenlessRegion?: string;

  private isInitialized = false;

  constructor(cookieString: string, uid: string) {
    this.cookieManager = new CookieManager();
    this.cookieManager.setCookies(cookieString);
    this.uid = uid;
  
    // Initialize managers after base details load
    this.zenless = new ZenlessManager(this);
    this.starrail = new StarrailManager(this);
    this.genshin = new GenshinManager(this);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.getBaseDetails();
    this.isInitialized = true;
  }

  private async getBaseDetails(): Promise<void> {
    try {
      const response = await this.makeRequest(this.userInfoUrl, { uid: this.uid });
      if (response?.data?.list) {
        response.data.list.forEach((entry: GameRecord) => {
          switch (entry.game_id) {
            case 2: // Genshin
              this._genshinUid = entry.game_role_id;
              this._genshinRegion = entry.region;
              console.log(this._genshinUid, this._genshinRegion)
              break;
            case 6: // Starrail
              this._starrailUid = entry.game_role_id;
              this._starrailRegion = entry.region;
              console.log(this._starrailUid, this._starrailRegion)
              break;
            case 8: // Zenless
              this._zenlessUid = entry.game_role_id;
              this._zenlessRegion = entry.region;
              console.log(this._zenlessUid, this._zenlessRegion)
              break;
          }
        });
      }
    } catch (error) {
      console.error('Failed to get base details:', error);
    }
  }

  public async makeRequest<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    region?: string
  ): Promise<T | null> {
    const ds = region && CN_REGIONS.includes(region)
      ? generateCnDynamicSecret(params, params, DS_SALT[Region.CHINESE])
      : generateDynamicSecret();

    const baseHeaders = {
      Cookie: this.cookieManager.formatForHeader(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
      Referer: 'https://act.hoyolab.com',
      'x-rcp-platform': '4',
      'Accept-language': 'en-US,en;q=0.5',
    };
  
    // Create DS headers with proper typing
    const dsHeaders: DSHeaders = {
      'x-rpc-app_version': '2.11.1',
      'x-rpc-client_type': '5',
      ds,
      ...(region && CN_REGIONS.includes(region) ? {} : {
        'x-rpc-language': 'en-us',
        'x-rpc-lang': 'en-us'
      })
    };
  
    // Combine headers
    const headers = {
      ...baseHeaders,
      ...dsHeaders
    };

    // Generate appropriate DS
    if (region && CN_REGIONS.includes(region)) {
      headers.ds = generateCnDynamicSecret(params, params, DS_SALT[Region.CHINESE]);
    } else {
      headers.ds = generateDynamicSecret();
    }

    try {
      const response: AxiosResponse<T> = await axios.get(endpoint, {
        headers,
        params
      });
      return response.data;
    } catch (error) {
      console.error(`Request to ${endpoint} failed:`, error);
      return null;
    }
  }

  // Getters for game properties
  get genshinUid(): string | undefined { return this._genshinUid; }
  get genshinRegion(): string | undefined { return this._genshinRegion; }
  get starrailUid(): string | undefined { return this._starrailUid; }
  get starrailRegion(): string | undefined { return this._starrailRegion; }
  get zenlessUid(): string | undefined { return this._zenlessUid; }
  get zenlessRegion(): string | undefined { return this._zenlessRegion; }
}

// Helper Classes
class GenshinManager {
  constructor(private mainApi: HoyoManager) {}

  async getInfo(): Promise<void> {
    if (!this.mainApi.genshinUid || !this.mainApi.genshinRegion) {
      console.log("No Genshin account found");
      return;
    }

    const data = await this.mainApi.makeRequest(
      this.mainApi.giInfoUrl,
      {
        server: this.mainApi.genshinRegion,
        role_id: this.mainApi.genshinUid,
        avatar_list_type: 0
      },
      this.mainApi.genshinRegion
    );

    console.log("\nGenshin Info Response:");
    console.log(data);
  }

  async getSpiralAbyss(scheduleType: number = 1): Promise<void> {
    if (!this.mainApi.genshinUid || !this.mainApi.genshinRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.giSpiralUrl,
      {
        server: this.mainApi.genshinRegion,
        role_id: this.mainApi.genshinUid,
        schedule_type: scheduleType
      },
      this.mainApi.genshinRegion
    );

    console.log("\nSpiral Abyss Response:");
    console.log(data);
  }
}

class StarrailManager {
  constructor(private mainApi: HoyoManager) {}

  async getInfo(): Promise<void> {
    if (!this.mainApi.starrailUid || !this.mainApi.starrailRegion) {
      console.log("No Starrail account found");
      return;
    }

    const data = await this.mainApi.makeRequest(
      this.mainApi.starrailInfoUrl,
      {
        server: this.mainApi.starrailRegion,
        role_id: this.mainApi.starrailUid
      },
      this.mainApi.starrailRegion
    );

    console.log("\nStarrail Info Response:");
    console.log(data);
  }

  async getStamina(): Promise<void> {
    if (!this.mainApi.starrailUid || !this.mainApi.starrailRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.starrailBatteryUrl,
      {
        server: this.mainApi.starrailRegion,
        role_id: this.mainApi.starrailUid
      },
      this.mainApi.starrailRegion
    );

    console.log("\nStamina Response:");
    console.log(data);
  }

  async getForgottenHall(needAll: boolean = true, scheduleType: number = 1): Promise<void> {
    if (!this.mainApi.starrailUid || !this.mainApi.starrailRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.starrailShiyuUrl,
      {
        server: this.mainApi.starrailRegion,
        role_id: this.mainApi.starrailUid,
        need_all: needAll.toString(),
        schedule_type: scheduleType
      },
      this.mainApi.starrailRegion
    );

    console.log("\nForgotten Hall Response:");
    console.log(data);
  }
}

class ZenlessManager {
  constructor(private mainApi: HoyoManager) {}

  async getInfo(): Promise<void> {
    console.log("Zenless UID:", this.mainApi.zenlessUid);
    if (!this.mainApi.zenlessUid || !this.mainApi.zenlessRegion) {
      console.log("No Zenless account found");
      return;
    }

    const data = await this.mainApi.makeRequest(
      this.mainApi.zzzInfoUrl,
      {
        server: this.mainApi.zenlessRegion,
        role_id: this.mainApi.zenlessUid
      },
      this.mainApi.zenlessRegion
    );

    console.log("\nZenless Info Response:");
    console.log(data);
  }

  async getBatteryInfo(): Promise<void> {
    if (!this.mainApi.zenlessUid || !this.mainApi.zenlessRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.zzzBatteryUrl,
      {
        server: this.mainApi.zenlessRegion,
        role_id: this.mainApi.zenlessUid
      },
      this.mainApi.zenlessRegion
    );

    console.log("\nBattery Info Response:");
    console.log(data);
  }

  async getDeadlyAssault(scheduleType: number = 1): Promise<void> {
    if (!this.mainApi.zenlessUid || !this.mainApi.zenlessRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.deadlyAssaultUrl,
      {
        region: this.mainApi.zenlessRegion,
        uid: this.mainApi.zenlessUid,
        schedule_type: scheduleType
      },
      this.mainApi.zenlessRegion
    );

    console.log("\nDeadly Assault Response:");
    console.log(data);
  }

  async getHollowZero(): Promise<void> {
    if (!this.mainApi.zenlessUid || !this.mainApi.zenlessRegion) return;

    const data = await this.mainApi.makeRequest(
      this.mainApi.hollowUrl,
      {
        server: this.mainApi.zenlessRegion,
        role_id: this.mainApi.zenlessUid
      },
      this.mainApi.zenlessRegion
    );

    console.log("\nHollow Zero Response:");
    console.log(data);
  }
}