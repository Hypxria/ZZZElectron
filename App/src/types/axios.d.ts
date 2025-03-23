// src/types/global.d.ts
import { CookieJar } from 'tough-cookie';

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: CookieJar;
  }
}