// src/hoyolab-auth.ts
import axios from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { config } from 'dotenv';
import crypto from 'crypto'
import base64 from 'base64-js'

config();

tough.Cookie

interface AuthResult {
    cookies: Record<string, string>;
    uid?: string;
}

interface LoginResponse {
    data: {
        uid: string;
        // Add other relevant fields from the login response
    };
    message: string;
    retcode: number;
}

interface UserInfoResponse {
    data: {
        uid: string;
        // Add other user info fields
    };
    message: string;
    retcode: number;
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
    private cookieJar: tough.CookieJar;

    constructor() {
        const cookieJar = new tough.CookieJar();
        this.cookieJar = cookieJar;
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

    private async sendLoginRequest(account: string, password: string): Promise<string> {
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

        const response = await axios.post<any>(url, requestData, {
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
                'Referer': 'https://account.hoyolab.com/'
            }
        });

        if (response.status !== 200) {
            throw new Error(`Login failed with status: ${response.status}`);
        }

        const cookies = this.parseCookies(response.headers['set-cookie'] ?? []);

        console.log(`cookies: ${cookies}`)

        const uid = response.data.data.user_info.aid;
        if (!uid) {
            throw new Error('UID not found in response');
        }

        return uid; // Return the UID as a string

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

        return cookies;
    }


    public async login(account: string, password: string): Promise<AuthResult> {
        try {
            // Initialize session
            await this.getLoginPage();
            console.log('Login page loaded successfully');

            // Perform login
            const uid = await this.sendLoginRequest(account, password);
            console.log('Login request sent successfully');
            console.log('UID retrieved successfully:', uid);

            // Get UID


            // Extract cookies
            const cookies = await this.getCookies();
            console.log('Cookies extracted successfully:', cookies);

            return { cookies, uid };
        } catch (error) {
            throw new Error(`${error.response}`);
        }
    }

    private async getCookies(): Promise<Record<string, string>> {
        const cookies = await this.client.get('https://account.hoyoverse.com/');
        const cookieHeader = cookies.headers['set-cookie'];

        console.log(cookies.headers)

        const cookieDict: Record<string, string> = {};
        cookieHeader?.forEach((cookie: string) => {
            const parsed = tough.parse(cookie);
            if (parsed) {
                cookieDict[parsed.key] = parsed.value;
            }
        });

        return cookieDict;
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
