interface GameDataPoint {
    name: string;
    type: number;
    value: string;
}

// Data switch (privacy settings)
interface DataSwitch {
    switch_id: number;
    is_public: boolean;
    switch_name: string;
}

// Individual game record
interface GameRecordDetail {
    has_role: boolean;
    game_id: number;
    game_role_id: string;
    nickname: string;
    region: string;
    level: number;
    background_image: string;
    is_public: boolean;
    data: GameDataPoint[];
    region_name: string;
    url: string;
    data_switches: DataSwitch[];
    h5_data_switches: any[]; // Appears to be empty array in the data
    background_color: string;
    background_image_v2: string;
    logo: string;
    game_name: string;
}

// Main response interface
interface GameRecordResponse {
    list: GameRecordDetail[];
}



/*
{
  "list": [
    {
      "has_role": true,
      "game_id": 2,
      "game_role_id": "615203407",
      "nickname": "Okizeme",
      "region": "os_usa",
      "level": 50,
      "background_image": "https://upload-os-bbs.hoyolab.com/game_record/game_record_ys_background.png",
      "is_public": true,
      "data": [
        {
          "name": "Days Active",
          "type": 1,
          "value": "261"
        },
        {
          "name": "Characters",
          "type": 1,
          "value": "35"
        },
        {
          "name": "Achievements",
          "type": 1,
          "value": "281"
        },
        {
          "name": "Spiral Abyss",
          "type": 1,
          "value": "-"
        }
      ],
      "region_name": "America Server",
      "url": "https://act.hoyolab.com/app/community-game-records-sea/m.html?bbs_presentation_style=fullscreen&bbs_auth_required=true&gid=2&user_id=93112092&utm_source=hoyolab&utm_medium=gamecard",
      "data_switches": [
        {
          "switch_id": 1,
          "is_public": true,
          "switch_name": "Show my Battle Chronicle on my profile"
        },
        {
          "switch_id": 2,
          "is_public": true,
          "switch_name": "Show your Character Details in the Battle Chronicle?"
        },
        {
          "switch_id": 3,
          "is_public": true,
          "switch_name": "Do you want to enable your \"Real-Time Notes\" to view your in-game data?"
        }
      ],
      "h5_data_switches": [],
      "background_color": "D3BC8E",
      "background_image_v2": "",
      "logo": "https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/12/b700cce2ac4c68a520b15cafa86a03f0_2812765778371293568.png", 
      "game_name": "Genshin Impact"
    },
    {
      "has_role": true,
      "game_id": 6,
      "game_role_id": "615855534",
      "nickname": "Hyperiya",
      "region": "prod_official_usa",
      "level": 20,
      "background_image": "https://upload-os-bbs.hoyolab.com/game_record/rpg_card.png",
      "is_public": false,
      "data": [
        {
          "name": "Time Active",
          "type": 1,
          "value": "21"
        },
        {
          "name": "Characters Unlocked",
          "type": 1,
          "value": "17"
        },
        {
          "name": "Achievements Unlocked",
          "type": 1,
          "value": "54"
        },
        {
          "name": "Treasures Opened",
          "type": 1,
          "value": "63"
        }
      ],
      "region_name": "America Server",
      "url": "https://act.hoyolab.com/app/community-game-records-sea/rpg/m.html?bbs_presentation_style=fullscreen&gid=6&user_id=93112092&utm_source=hoyolab&utm_medium=gamecard#/hsr",
      "data_switches": [
        {
          "switch_id": 1,
          "is_public": false,
          "switch_name": "Show my Battle Chronicle on my profile"
        },
        {
          "switch_id": 4,
          "is_public": false,
          "switch_name": "Show your Character Details in the Battle Chronicle?"
        }
      ],
      "h5_data_switches": [],
      "background_color": "FFC870",
      "background_image_v2": "",
      "logo": "https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/12/74330de1ee71ada37bbba7b72775c9d3_1883015313866544428.png", 
      "game_name": "Honkai: Star Rail"
    },
    {
      "has_role": true,
      "game_id": 8,
      "game_role_id": "1000278659",
      "nickname": "Okizeme",
      "region": "prod_gf_us",
      "level": 57,
      "background_image": "",
      "is_public": true,
      "data": [
        {
          "name": "Days Active",
          "type": 1,
          "value": "206"
        },
        {
          "name": "No. of Achievements Earned",
          "type": 1,
          "value": "291"
        },
        {
          "name": "Agents Recruited",
          "type": 1,
          "value": "26"
        },
        {
          "name": "Bangboo Obtained",
          "type": 1,
          "value": "24"
        }
      ],
      "region_name": "America",
      "url": "https://act.hoyolab.com/app/zzz-game-record/m.html?hyl_presentation_style=fullscreen&bbs_auth_required=true&game_id=8&user_id=93112092",
      "data_switches": [
        {
          "switch_id": 1,
          "is_public": true,
          "switch_name": "Show my Battle Chronicle on my profile"
        },
        {
          "switch_id": 6,
          "is_public": true,
          "switch_name": "Show your Character Details in the Battle Chronicle?"
        },
        {
          "switch_id": 7,
          "is_public": true,
          "switch_name": "Do you want to enable your \"Real-Time Notes\" to view your in-game data?"
        }
      ],
      "h5_data_switches": [],
      "background_color": "ffc22b",
      "background_image_v2": "",
      "logo": "https://fastcdn.hoyoverse.com/static-resource-v2/2024/05/20/3c251a9972cde4858b8f122e1a353b50_5932843772477377751.png", 
      "game_name": "Zenless Zone Zero"
    }
  ]
}
*/