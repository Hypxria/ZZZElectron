// src/hoyolab-auth.ts
import axios from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { config } from 'dotenv';
import crypto from 'crypto'

config();

interface cookies {
    cookie_token_v2: string
    account_mid_v2: string
    account_id_v2: string
    ltoken_v2: string
    ltmid_v2: string
    ltuid_v2: string
}

interface AuthResult {
    cookies: cookies;
    uid?: string;
}

interface AuthResponse {
    uid: string;
    cookies: cookies;
}


const LOGIN_KEY_TYPE_1 = `
-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4PMS2JVMwBsOIrYWRluY
wEiFZL7Aphtm9z5Eu/anzJ09nB00uhW+ScrDWFECPwpQto/GlOJYCUwVM/raQpAj
/xvcjK5tNVzzK94mhk+j9RiQ+aWHaTXmOgurhxSp3YbwlRDvOgcq5yPiTz0+kSeK
ZJcGeJ95bvJ+hJ/UMP0Zx2qB5PElZmiKvfiNqVUk8A8oxLJdBB5eCpqWV6CUqDKQ
KSQP4sM0mZvQ1Sr4UcACVcYgYnCbTZMWhJTWkrNXqI8TMomekgny3y+d6NX/cFa6
6jozFIF4HCX5aW8bp8C8vq2tFvFbleQ/Q3CU56EWWKMrOcpmFtRmC18s9biZBVR/
8QIDAQAB
-----END PUBLIC KEY-----
`

const LOGIN_KEY_TYPE_2 = `
-----BEGIN PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDvekdPMHN3AYhm/vktJT+YJr7
cI5DcsNKqdsx5DZX0gDuWFuIjzdwButrIYPNmRJ1G8ybDIF7oDW2eEpm5sMbL9zs
9ExXCdvqrn51qELbqj0XxtMTIpaCHFSI50PfPpTFV9Xt/hmyVwokoOXFlAEgCn+Q
CgGs52bFoYMtyi+xEQIDAQAB
-----END PUBLIC KEY-----
`

export class HoyolabAuth {
    private client: axios.AxiosInstance;

    constructor() {
        const cookieJar = new tough.CookieJar();
        this.client = wrapper(axios.create({
            jar: cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://account.hoyoverse.com/',
            },
        }));
    }

    encryptCredentials(text: string, keyType: number): string {
        const publicKey = keyType === 1 ? LOGIN_KEY_TYPE_1 : LOGIN_KEY_TYPE_2;

        const encrypted = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from(text, 'utf8'));

        return encrypted.toString('base64');
    }

    private async getLoginPage(): Promise<string> {
        const response = await this.client.get<string>('https://account.hoyoverse.com/');
        return response.data;
    }

    private async sendLoginRequest(account: string, password: string): Promise<AuthResponse> {
        interface LoginRequest {
            account: string;
            password: string;
            token_type: number;
        }

        const url = `https://sg-public-api.hoyolab.com/account/ma-passport/api/webLoginByPassword`;
        const requestData: LoginRequest = {
            account: this.encryptCredentials(account, 1),
            password: this.encryptCredentials(password, 1),
            token_type: 6
        };

        const response = await this.client.post<any>(url, requestData, {
            headers: {
                'x-rpc-source': 'v2.webLogin',
                'x-rpc-device_fp': '38d7ee588249d',
                'x-rpc-sdk_version': '2.16.1',
                'x-rpc-app_id': "c9oqaq3s3gu8",
                'x-rpc-game_biz': 'bbs_oversea',
                'x-rpc-language': 'en-us',
                'x-rpc-client_type': '4',
                'x-rpc-referrer': 'https://account.hoyolab.com/',
                'Origin': 'https://account.hoyolab.com',
                'Referer': 'https://account.hoyolab.com/',
                'Accept': '*/*',
            }
        });


        // console.log(response.headers['set-cookie']?.[0])

        if (response.status !== 200) {
            throw new Error(`Login failed with status: ${response.status}`);
        }



        const cookies = this.parseCookies(response.headers['set-cookie'] ?? []);

        console.log(`cookies: ${cookies}`)

        const uid = response.data.data.user_info.aid;
        if (!uid) {
            throw new Error('UID not found in response');
        }

        const sortedCookies: cookies = {
            cookie_token_v2: cookies['cookie_token_v2'],
            account_mid_v2: cookies['account_mid_v2'],
            account_id_v2: cookies['account_id_v2'],
            ltoken_v2: cookies['ltoken_v2'],
            ltmid_v2: cookies['ltmid_v2'],
            ltuid_v2: cookies['ltuid_v2'],
        }

        return {
            uid: uid,
            cookies: sortedCookies
        };

        // Access response data

    }

    private parseCookies(setCookieHeaders: string[]): Record<string, string> {
        const cookies: Record<string, string> = {};

        setCookieHeaders?.forEach(header => {

            const cookie = tough.Cookie.parse(header);
            if (cookie) {
                cookies[cookie.key] = cookie.value;
            }
        });


        console.log(cookies)
        return cookies;
    }


    public async login(account: string, password: string): Promise<AuthResult> {
        try {
            // Initialize session
            await this.getLoginPage();
            console.log('Login page loaded successfully');

            // Perform login
            const loginResponse: AuthResponse = await this.sendLoginRequest(account, password);

            const uid = loginResponse.uid
            const cookies = loginResponse.cookies

            console.log('Login request sent successfully');
            console.log('UID retrieved successfully:', uid);
            console.log('Cookies extracted successfully:', cookies);

            return { cookies, uid };
        } catch (error) {
            throw new Error(`${error.response}`);
        }
    }

    
}

// Usage (isolated in separate file)
// src/main.ts


async function main() {
    const auth = new HoyolabAuth();

    try {
        const result = await auth.login(
            process.env.HOYOLAB_EMAIL!,
            process.env.HOYOLAB_PASSWORD!
        );

        console.log('Login successful!');
        console.log('UID:', result.uid);
        console.log('Cookies:', result.cookies);
    } catch (error) {
        console.error('Login failed:', error.message);
    }
}

main();
