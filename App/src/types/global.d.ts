import * as tough from 'tough-cookie';

declare module 'discord-rpc-electron';

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: tough.CookieJar;
  }
}