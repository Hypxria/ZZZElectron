// src/hoyolab-auth.ts
import axios from 'axios';
import * as tough from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import { config } from 'dotenv';
import crypto from 'crypto'
import { generateDynamicSecret, generateCnDynamicSecret, DS_SALT } from './ds';

import * as fs from 'fs';

import * as path from 'path';


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
        /*
        Good god this one pissed me off.
        So. Hoyoverse decided to do CLIENTSIDE RSA key encryption on what you put into the page.
        I found this key from... *checks notes*... DevTools debugger?
        I mean- I found this url (https://account.hoyolab.com/login-platform/chunk-common.93dbfffd.js) from debugger, of which this file contains the RSA key.
        I'll be honest again and say that I stole the code from a repo (https://github.com/TukanDev/qingyi)(Thanks Tukan!!!) and I don't completely understand everything.
        */

        // Determining what key to use. Redundant, as it always gets "1", but it's here anyway
        const publicKey = keyType === 1 ? LOGIN_KEY_TYPE_1 : LOGIN_KEY_TYPE_2;

        const encrypted = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from(text, 'utf8'));

        return encrypted.toString('base64');
    }

    private async getLoginPage(): Promise<string> {
        /*
        I wrote this at some time in the night and I don't know why I wrote this. I think we don't need it but
        if it's not broken, don't fix it.
        */
        const response = await this.client.get<string>('https://account.hoyoverse.com/');
        return response.data;
    }

    public async getSToken(account: string, password: string): Promise<string> {
        /*
        Hi! Hyperiya here.
        This ones... really weird.
        I'm... not quite sure why there are multiple logins and I'm not quite keen on finding out
        Just know that sToken is in this endpoint for some reason and we need it for code redemption.
        */ 


        const url = `https://sg-public-api.hoyoverse.com/account/ma-passport/api/appLoginByPassword`;
        const requestData = {
            account: this.encryptCredentials(account, 1),
            password: this.encryptCredentials(password, 1),
        };

        let response

        try {
            response = await this.client.post<any>(url, requestData, {
                headers: {
                    // Headers are INCREDIBLY sensitive, stolen from https://github.com/thesadru/genshin.py.
                    'x-rpc-source': 'v2.webLogin',
                    'x-rpc-device_fp': '38d7ee588249d',
                    'x-rpc-sdk_version': '2.16.1',
                    'x-rpc-app_id': "c9oqaq3s3gu8",
                    'x-rpc-game_biz': 'bbs_oversea',
                    'x-rpc-language': 'en-us',
                    'x-rpc-client_type': '2',
                    'x-rpc-referrer': 'https://account.hoyolab.com/',
                    'Origin': 'https://account.hoyolab.com',
                    'Referer': 'https://account.hoyolab.com/',
                    'Accept': '*/*',
                }
            });
            
            
        }
        catch (error) {
            console.error('Error during login:', error);
        }
        // This is the path of the stoken. Yeah- it looks stupid.
        return response?.data.data.token.token
    }

    private async sendLoginRequest(account: string, password: string): Promise<AuthResponse> {
        /*
        Hyperiya again!
        This one is a bit weird too.
        Once again, I'm not sure why there are multiple logins and I'm not quite keen on finding out.
        Just know that this endpoint is for logging in and we need to get the UID from the response.
        We get the cookies from appLoginByPassword too, but the different endpoint stuff here is so confusing I think its safer to stay as is right now.
        */


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

        if (response.status !== 200) {
            throw new Error(`Login failed with status: ${response.status}`);
        }

        
        const cookies = this.parseCookies(response.headers['set-cookie'] ?? []);


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

    }

    private parseCookies(setCookieHeaders: string[]): Record<string, string> {
        /*
        I can't explain myself here. I just coded without thinking and I guess it does something?
        */

        const cookies: Record<string, string> = {};

        setCookieHeaders?.forEach(header => {

            const cookie = tough.Cookie.parse(header);
            if (cookie) {
                cookies[cookie.key] = cookie.value;
            }
        });


        // console.log(cookies)
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

            

            return { cookies, uid };
        } catch (error) {
            throw new Error(`${error.response}`);
        }
    }

    
}


// Usage (isolated in separate file)
// Example
// src/main.ts


async function main() {
    const auth = new HoyolabAuth();

    try {
        const result = await auth.login(
            process.env.HOYOLAB_EMAIL!,
            process.env.HOYOLAB_PASSWORD!
        );

        const stoken = await auth.getSToken(
            process.env.HOYOLAB_EMAIL!,
            process.env.HOYOLAB_PASSWORD!
        );

        console.log(stoken)

        console.log('Login successful!');
        console.log('UID:', result.uid);
        console.log('Cookies:', result.cookies);

    } catch (error) {
        console.error('Login failed:', error.message);
    }
}


