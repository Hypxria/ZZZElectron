import * as tough from 'tough-cookie';
import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: tough.CookieJar;
  }
}