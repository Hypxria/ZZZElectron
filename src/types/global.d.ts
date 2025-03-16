import * as tough from 'tough-cookie';

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: tough.CookieJar;
  }
}