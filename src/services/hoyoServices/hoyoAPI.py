import requests
from typing import Dict
import pprint
from dotenv import load_dotenv
import os
import time
import random
import string
import hashlib

import ds

load_dotenv()

class CookieManager:
    def __init__(self):
        self.cookie_data: Dict[str, str] = {}

    def set_cookies(self, cookie_string: str):
        """Set cookies for all services since they share the same login"""
        self.cookie_data = self._parse_cookie_string(cookie_string)

    def _parse_cookie_string(self, cookie_string: str) -> Dict[str, str]:
        cookie_dict = {}
        cookie_pairs = cookie_string.split(";")

        for pair in cookie_pairs:
            pair = pair.strip()
            if "=" in pair:
                key, value = pair.split("=", 1)
                cookie_dict[key.strip()] = value.strip()

        return cookie_dict

    def get_essential_cookies(self) -> Dict[str, str]:
        """Get essential cookies for API requests"""
        essential_keys = [
            "cookie_token_v2",
            "account_mid_v2",
            "account_id_v2",
            "ltoken_v2",
            "ltmid_v2",
            "ltuid_v2",
        ]

        return {k: self.cookie_data[k] for k in essential_keys if k in self.cookie_data}

    def format_for_header(self) -> str:
        """Format cookies for HTTP header"""
        cookies = self.get_essential_cookies()
        return "; ".join(f"{k}={v}" for k, v in cookies.items())


"""
https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard?uid=93112092 (all games mini-details)

HSR
https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/index?server={server}&role_id={roleid} (HSR Details)
https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/note?server=prod_official_usa&role_id=615855534 (HSR Battery Charge)
https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (HSR Equivalent for Shiyu/Spiral)
https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge_story?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (also something?)
https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge_boss?schedule_type=1&server=prod_official_usa&role_id=615855534&need_all=false (???)


GI
https://sg-public-api.hoyolab.com/event/game_record/genshin/api/index?avatar_list_type=0&server={server}&role_id={roleid} (Genshin Details?)


ZZZ
https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/index?server={server}&role_id={roleid} (ZZZ Details)
https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/note?server=prod_gf_us&role_id=1000278659 (ZZZ Battery Charge)
https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/mem_detail?uid=1000278659&region=prod_gf_us&schedule_type=1 (ZZZ Deadly Assault)
https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/challenge?server=prod_gf_us&role_id=1000278659&schedule_type=1 (ZZZ Shiyu (Only Last four?))
https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/abyss_abstract?server=prod_gf_us&role_id=1000278659 (ZZZ HZ)
"""

def generate_os_dynamic_secret(salt_type):
    # Generate random string of 6 characters
    r = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
    # Get current timestamp in seconds
    t = int(time.time())
    
    # Create the hash string
    message = f"salt={salt_type}&t={t}&r={r}"
    # Generate MD5 hash
    hash_value = hashlib.md5(message.encode()).hexdigest()
    
    return f"{t},{r},{hash_value}"



class hoyoManager:  
    def __init__(self, cookie_string, uid):
        
        # URLS
        
        self.user_info = "https://bbs-api-os.hoyolab.com/game_record/card/wapi/getGameRecordCard"
        
        self.zzz_info = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/index"
        self.zzz_battery = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/note"
        self.deadly_assault = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/mem_detail"
        self.shiyu = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/challenge"
        self.hollow = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/abyss_abstract"
        
        self.gi_info = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/index"
        self.gi_spiral = "https://sg-public-api.hoyolab.com/event/game_record/genshin/api/spiralAbyss"
        
        self.starrail_info =  "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/index"
        self.starrail_battery = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/note"
        self.starrail_shiyu = "https://sg-public-api.hoyolab.com/event/game_record/hkrpg/api/challenge"
        
        # Vars
        
        self.cookie_manager = CookieManager()
        self.uid = uid
        self.cookie_manager.set_cookies(cookie_string)
        
        self._zenless_uid = None
        self._zenless_region = None
        
        # CN Failsafe
        self.cn_regions = ['prod_gf_sg', 'prod_official_cht', 'os_cht']
        
        self.get_base_details()
        
        self.zenless = self.zenlessManager(self)
        self.starrail = self.starrailManager(self)
        self.genshin = self.genshinManager(self)
        
        
    
    def get_base_details(self):
        user_data = self.make_request(
            endpoint=self.user_info,
            params={"uid": self.uid},
            region = None
        )

        if user_data:
            print("\nUser Data Response:")
            # pprint.pprint(user_data)
            
        for entry in user_data["data"]["list"]:
            if entry["game_id"] == 2:
                self._genshin_uid = entry["game_role_id"]
                self._genshin_region = entry["region"]
                print(self._genshin_uid, self._genshin_region)
            if entry["game_id"] == 6:
                self._starrail_uid = entry["game_role_id"]
                self._starrail_region = entry["region"]
                print(self._starrail_uid, self._starrail_region)
            if entry["game_id"] == 8:
                self._zenless_uid = entry["game_role_id"]
                self._zenless_region = entry["region"]
                print(self._zenless_uid, self._zenless_region)
    
    def make_request(self, endpoint: str, params: Dict = None, region = None):
        """Make API request with proper headers"""
        self.headers = {
            "Cookie": self.cookie_manager.format_for_header(),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
            "Referer": "https://act.hoyolab.com",
            'x-rpc-lang': "en-us", 
            'x-rpc-language': "en-us",
            'x-rpc-app_version': "2.11.1",
            'x-rpc-client_type': "5", 
            'x-rcp-platform': "4",
            'Accept-language': "en-US,en;q=0.5",
            'DS': ds.generate_cn_dynamic_secret(params, params) if region in self.cn_regions else ds.generate_dynamic_secret()
        }
        
        if region in self.cn_regions:
            self.headers['DS'] = ds.generate_cn_dynamic_secret()
        elif region is not None:
            self.headers['DS'] = ds.generate_dynamic_secret()



        try:
            response = requests.get(endpoint, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error making request: {e}")
            return None
    
    class genshinManager():
        def __init__(self, main_api):
            self.api = main_api

            # Getting back vars that I need
            self.genshin_uid = main_api._genshin_uid
            self.genshin_region = main_api._genshin_region
            
            self.gi_info = main_api.gi_info
            self.gi_spiral = main_api.gi_spiral

        def print_status(self):
            print(self.genshin_uid)
            if self.genshin_uid and self.genshin_region:
                print(f"Genshin UID: {self.genshin_uid}, Region: {self.genshin_region}")
            else:
                print("No Genshin account found")

        def get_info(self):
            user_data = self.api.make_request(
                region = self.genshin_region,
                endpoint = self.gi_info,
                params={"server": f"{self.genshin_region}", "role_id": f"{self.genshin_uid}"},
            )
            print("\nUser Data Response:")
            pprint.pprint(user_data)
        
        def get_spiral(self):
            user_data = self.api.make_request(
                region = self.genshin_region,
                endpoint = self.gi_spiral,
                params={"server": f"{self.genshin_region}", "role_id": f"{self.genshin_uid}", "schedule_type":1},
            )
            print("\nUser Data Response:")
            pprint.pprint(user_data)
            
        
    
    class starrailManager():
        def __init__(self, main_api):
            self.api = main_api

            # Getting back vars that I need
            self.starrail_uid = main_api._starrail_uid
            self.starrail_region = main_api._starrail_region
            
            self.starrail_info = main_api.starrail_info
            self.starrail_shiyu = main_api.starrail_shiyu
            self.starrail_battery = main_api.starrail_battery
            

        def print_status(self):
            print(self.starrail_uid)
            if self.starrail_uid and self.starrail_region:
                print(f"Starrail UID: {self.starrail_uid}, Region: {self.starrail_region}")
            else:
                print("No Starrail account found")

        # Error -10001 occurs because the request is missing required header 'DS'
        # The DS header contains a dynamic signature that HoYoverse uses for API authentication
        # Need to add x-rpc-client_type: '5' and proper DS header calculation
        def get_info(self):
            user_data = self.api.make_request(
                region = self.starrail_region,
                endpoint = self.starrail_info,
                params = {"server": f"{self.starrail_region}", "role_id": f"{self.starrail_uid}"},
            )
            print("\nUser Data Response:")
            pprint.pprint(user_data)
            
        def get_stamina(self):
            user_data = self.api.make_request(
                region = self.starrail_region,
                endpoint = self.starrail_battery,
                params={"server": f"{self.starrail_region}", "role_id": f"{self.starrail_uid}"},
            )
            print("\nUser Data Response:")
            pprint.pprint(user_data)
        
        def getForgottenHall(self):
            user_data = self.api.make_request(
                region = self.starrail_region,
                endpoint = self.starrail_shiyu,
                params={"server": f"{self.starrail_region}", "role_id": f"{self.starrail_uid}", "need_all":"true", "schedule_type":1},
            )
            print(self.starrail_region,self.starrail_uid)
            print("\nUser Data Response:")
            pprint.pprint(user_data)
    
    class zenlessManager():
        def __init__(self, main_api):
            self.api = main_api
            
            # Getting back vars that I need
            self.zenless_uid = main_api._zenless_uid
            self.zenless_region = main_api._zenless_region
            self.cookie_manager = main_api.cookie_manager
            self.zzz_info = main_api.zzz_info
            self.zzz_battery = main_api.zzz_battery
            self.shiyu = main_api.shiyu
            self.deadly_assault = main_api.deadly_assault
            self.hollow_zero = main_api.hollow
            
        
        def print_status(self):
            print(self.zenless_uid)
            if self.zenless_uid and self.zenless_region:
                print(f"Zenless UID: {self.zenless_uid}, Region: {self.zenless_region}")
            else:
                print("No Zenless account found")
            
        def get_info(self):
            user_data = self.api.make_request(
                region = self.zenless_region,
                endpoint = self.zzz_info,
                params={"server": f"{self.zenless_region}", "role_id": f"{self.zenless_uid}"},
            )
            print("\nUser Data Response:")
            pprint.pprint(user_data)
            
        def get_battery_info(self):
            battery_data = self.api.make_request(
                region = self.zenless_region,
                endpoint = self.zzz_battery,
                params={"server": f"{self.zenless_region}", "role_id": f"{self.zenless_uid}"},
            )
            pprint.pprint(battery_data)
        
        def getDeadlyAssault(self):
            assualt_data = self.api.make_request(
                region = self.zenless_region,
                endpoint = self.deadly_assault,
                params={"region": f"{self.zenless_region}", "uid": f"{self.zenless_uid}", "schedule_type":1},
            ) 
            pprint.pprint(assualt_data)
        
        def getShiyu(self):
            shiyu_data = self.api.make_request(
                region = self.zenless_region,
                endpoint = self.shiyu,
                params={"server": f"{self.zenless_region}", "role_id": f"{self.zenless_uid}", "schedule_type":1},
            )
            pprint.pprint(shiyu_data)
            
        def getHZ(self):
            hz_data = self.api.make_request(
                region = self.zenless_region,
                endpoint = self.hollow_zero,
                params={"server": f"{self.zenless_region}", "role_id": f"{self.zenless_uid}"},
            )
            pprint.pprint(hz_data)

        




def main():
    cookie_string = f"""cookie_token_v2={os.getenv('cookie_token_v2')};
                        account_mid_v2={os.getenv('account_mid_v2')};
                        account_id_v2={os.getenv('account_id_v2')};
                        ltoken_v2={os.getenv('ltoken_v2')};
                        ltmid_v2={os.getenv('ltmid_v2')};
                        ltuid_v2={os.getenv('ltuid_v2')}"""
                        
    api = hoyoManager(cookie_string, 93112092)
    api.starrail.print_status()
    api.zenless.get_info()
    
    

if __name__ == "__main__":
    main()
