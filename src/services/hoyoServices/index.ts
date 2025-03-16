import dotenv from 'dotenv';
import { HoyoManager } from './hoyoManager';
import { pprint } from '../../utils/pprint';

dotenv.config();

async function main(): Promise<void> {
  const cookieString = [
    `cookie_token_v2=${process.env.COOKIE_TOKEN_V2}`,
    `account_mid_v2=${process.env.ACCOUNT_MID_V2}`,
    `account_id_v2=${process.env.ACCOUNT_ID_V2}`,
    `ltoken_v2=${process.env.LTOKEN_V2}`,
    `ltmid_v2=${process.env.LTMID_V2}`,
    `ltuid_v2=${process.env.LTUID_V2}`,
  ].join('; ');

  const api = new HoyoManager(cookieString, '93112092');
  await api.initialize(); // Wait for initialization
  pprint(api.starrail.getInfo(), 8)
}

main();