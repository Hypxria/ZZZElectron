"""
Dynamic secret generation.
I stole this from https://github.com/thesadru/genshin.py/blob/master/genshin/utility/ds.py#L33 and just combined it into one file
All credits to them
"""

import enum
import hashlib
import json
import random
import string
import time
import typing
from datetime import datetime, timedelta, timezone

__all__ = [
    "generate_cn_dynamic_secret",
    "generate_dynamic_secret",
    "generate_geetest_ds",
    "generate_passport_ds",
    "get_ds_headers",
]

# Types from genshin.types
class Region(str, enum.Enum):
    """Region to get data from."""
    OVERSEAS = "os"  # Applies to all overseas APIs
    CHINESE = "cn"   # Applies to all chinese mainland APIs


class Game(str, enum.Enum):
    """Hoyoverse game."""
    GENSHIN = "genshin"     # Genshin Impact
    HONKAI = "honkai3rd"    # Honkai Impact 3rd
    STARRAIL = "hkrpg"      # Honkai Star Rail
    ZZZ = "nap"             # Zenless Zone Zero
    TOT = "tot"             # Tears of Themis


# Constants from genshin.constants
CN_TIMEZONE = timezone(timedelta(hours=8))

DS_SALT = {
    Region.OVERSEAS: "6s25p5ox5y14umn1p61aqyyvbvvl3lrt",
    Region.CHINESE: "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs",
    "app_login": "IZPgfb0dRPtBeLuFkdDznSZ6f4wWt6y2",
    "cn_signin": "LyD1rXqMv2GJhnwdvCBjFOKGiKuLY3aO",
    "cn_passport": "JwYDpKvLj6MrMqqYU6jTKF17KNO2PXoS",
}

GEETEST_RETCODES = {10035, 5003, 10041, 1034}

APP_KEYS = {
    Game.GENSHIN: {
        Region.OVERSEAS: "6a4c78fe0356ba4673b8071127b28123",
        Region.CHINESE: "d0d3a7342df2026a70f650b907800111",
    },
    Game.STARRAIL: {
        Region.OVERSEAS: "d74818dabd4182d4fbac7f8df1622648",
        Region.CHINESE: "4650f3a396d34d576c3d65df26415394",
    },
    Game.HONKAI: {
        Region.OVERSEAS: "243187699ab762b682a2a2e50ba02285",
        Region.CHINESE: "0ebc517adb1b62c6b408df153331f9aa",
    },
    Game.ZZZ: {
        Region.OVERSEAS: "ff0f2776bf515d79d1f8ff1fb98b2a06",
        Region.CHINESE: "4650f3a396d34d576c3d65df26415394",
    },
}

APP_IDS = {
    Game.GENSHIN: {
        Region.OVERSEAS: "4",
        Region.CHINESE: "4",
    },
    Game.STARRAIL: {
        Region.OVERSEAS: "11",
        Region.CHINESE: "8",
    },
    Game.HONKAI: {
        Region.OVERSEAS: "8",
        Region.CHINESE: "1",
    },
    Game.ZZZ: {
        Region.OVERSEAS: "15",
        Region.CHINESE: "12",
    },
}

GEETEST_RECORD_KEYS = {
    Game.GENSHIN: "genshin_game_record",
    Game.STARRAIL: "hkrpg_game_record",
    Game.HONKAI: "bh3_game_record",
    Game.ZZZ: "nap_game_record",
}

GAME_BIZS = {
    Region.OVERSEAS: {
        Game.GENSHIN: "hk4e_global",
        Game.STARRAIL: "hkrpg_global",
        Game.HONKAI: "bh3_os",
        Game.ZZZ: "nap_global",
    },
    Region.CHINESE: {
        Game.GENSHIN: "hk4e_cn",
        Game.STARRAIL: "hkrpg_cn",
        Game.HONKAI: "bh3_cn",
        Game.ZZZ: "nap_cn",
    },
}

WEB_EVENT_GAME_IDS = {
    Game.GENSHIN: 2,
    Game.STARRAIL: 6,
    Game.HONKAI: 1,
    Game.ZZZ: 8,
    Game.TOT: 4,
}

# The original functions

def generate_dynamic_secret(salt: str = DS_SALT[Region.OVERSEAS]) -> str:
    """Create a new overseas dynamic secret."""
    t = int(time.time())
    r = "".join(random.choices(string.ascii_letters, k=6))
    h = hashlib.md5(f"salt={salt}&t={t}&r={r}".encode()).hexdigest()
    return f"{t},{r},{h}"


def generate_cn_dynamic_secret(
    body: typing.Any = None,
    query: typing.Optional[typing.Mapping[str, typing.Any]] = None,
    *,
    salt: str = DS_SALT[Region.CHINESE],
) -> str:
    """Create a new chinese dynamic secret."""
    t = int(time.time())
    r = random.randint(100001, 200000)
    b = json.dumps(body) if body else ""
    q = "&".join(f"{k}={v}" for k, v in sorted(query.items())) if query else ""

    h = hashlib.md5(f"salt={salt}&t={t}&r={r}&b={b}&q={q}".encode()).hexdigest()
    return f"{t},{r},{h}"


def get_ds_headers(
    region: Region,
    data: typing.Any = None,
    params: typing.Optional[typing.Mapping[str, typing.Any]] = None,
    lang: typing.Optional[str] = None,
) -> dict[str, typing.Any]:
    """Get ds http headers."""
    if region == Region.OVERSEAS:
        ds_headers = {
            "x-rpc-app_version": "1.5.0",
            "x-rpc-client_type": "5",
            "x-rpc-language": lang,
            "x-rpc-lang": lang,
            "ds": generate_dynamic_secret(),
        }
    elif region == Region.CHINESE:
        ds_headers = {
            "x-rpc-app_version": "2.11.1",
            "x-rpc-client_type": "5",
            "ds": generate_cn_dynamic_secret(data, params),
        }
    else:
        raise TypeError(f"{region!r} is not a valid region.")
    return ds_headers


def generate_passport_ds(body: typing.Mapping[str, typing.Any]) -> str:
    """Create a dynamic secret for Miyoushe passport API."""
    salt = DS_SALT["cn_passport"]
    t = int(time.time())
    r = "".join(random.sample(string.ascii_letters, 6))
    b = json.dumps(body)
    h = hashlib.md5(f"salt={salt}&t={t}&r={r}&b={b}&q=".encode()).hexdigest()
    result = f"{t},{r},{h}"
    return result


def generate_geetest_ds(region: Region) -> str:
    """Create a dynamic secret for geetest API endpoint."""
    t = int(time.time())
    r = random.randint(100000, 200000)
    h = hashlib.md5(f"salt={DS_SALT[region]}&t={t}&r={r}&b=&q=is_high=false".encode()).hexdigest()
    return f"{t},{r},{h}"