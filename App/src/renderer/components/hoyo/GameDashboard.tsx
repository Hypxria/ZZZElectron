import React, { CSSProperties, useState, useRef, useEffect } from 'react';
import { Clock, Battery, Star, Coins, Award, RefreshCw } from 'lucide-react';
import './Styles/GameAccountDashboard.scss';
import { ViewState } from "../../../types/viewState";

import zzzIcon from "../../../assets/icons/Zenless_Zone_Zero_logo.png"
import genshinIcon from "../../../assets/icons/Genshin-Impact-Logo.png"
import honkaiIcon from "../../../assets/icons/Honkai_Star-Rail_Logo.png"

import { starrailBattery, starrailInfo, zenlessBattery, zenlessInfo, genshinInfo, genshinNotes, baseInfo } from 'src/services/hoyoServices/gameResponseTypes';

interface CustomCSS extends CSSProperties {
  '--accent-color'?: string;
  '--accent-color-light'?: string;
}

interface GameAccountDashboardProps {
  viewState: ViewState;
}

interface GameStats {
  label: string;
  value: string;
  icon: React.ReactElement;
}

interface GameEvent {
  name: string;
  status?: string;
  value?: string;
  isHighlight?: boolean;
}

interface Game {
  title: string;
  logo: string;
  accent: string;
  stats: GameStats[];
  events?: GameEvent[];
}

export interface GameRecord {
  game_id: number;
  game_role_id: string;
  region: string;
  // Add other properties as needed
}

const GameAccountDashboard: React.FC<GameAccountDashboardProps> = ({ viewState }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>("Zenless Zone Zero");
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game[] | null>(null)

  useEffect(() => {
    const calculateHeights = () => {
      if (!containerRef.current || !cardsContainerRef.current) return;

      const containerHeight = containerRef.current.clientHeight;
      const headerHeight = containerRef.current.querySelector('.dashboard-header')?.clientHeight || 0;
      const containerPadding = 32; // 16px top + 16px bottom
      const gapBetweenCards = 16;

      // Get number of visible (non-hidden) cards
      const visibleCards = cardsContainerRef.current.querySelectorAll('.game-card:not(.hidden-card)').length;

      // Calculate total gaps (number of gaps = number of cards - 1)
      const totalGaps = (visibleCards - 1) * gapBetweenCards;

      // Calculate available height for cards
      const availableHeight = containerHeight - headerHeight - containerPadding - totalGaps;

      // Calculate height per card
      const heightPerCard = Math.floor(availableHeight / visibleCards);

      // Set the CSS variables
      containerRef.current.style.setProperty('--available-height', `${availableHeight}px`);
      containerRef.current.style.setProperty('--card-height', `${heightPerCard}px`);
    };

    // Initial calculation
    calculateHeights();

    // Recalculate on window resize
    window.addEventListener('resize', calculateHeights);

    // Recalculate when cards are shown/hidden
    const observer = new MutationObserver(calculateHeights);
    if (cardsContainerRef.current) {
      observer.observe(cardsContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => {
      window.removeEventListener('resize', calculateHeights);
      observer.disconnect();
    };
  }, [viewState]);



  // Sample game data


  useEffect(() => {
    var baseInfo: baseInfo.baseInfo

    var zzzName: string, zzzLevel: number, starrailName: string, starrailLevel: number, genshinName: string, genshinLevel: number, genshinRg: string, zzzRg: string, starrailRg: string;

    const fetchBaseInfo = async () => {
      baseInfo = await window.hoyoAPI.callMethod('HoyoManager', 'getBaseDetails');
      baseInfo.data.list.forEach((game: baseInfo.GameRecordDetail) => {
        switch (game.game_id) {
          case 2: // Genshin
            genshinName = game.nickname
            genshinLevel = game.level
            genshinRg = game.region
            break;
          case 6: // Starrail
            starrailName = game.nickname;
            starrailLevel = game.level;
            starrailRg = game.region
            break;
          case 8: // Zenless
            zzzName = game.nickname;
            zzzLevel = game.level;
            zzzRg = game.region
            console.log(`ZZZ REG = ${zzzRg}`)
            break;
        }
      })
    }

    fetchBaseInfo()
    const calculateTimeUntilReset = (region: string) => {
      // Get current time in user's timezone
      const now = new Date();

      // Create reset time based on region
      let resetTime: Date;

      switch (region) {
        // Asia regions (UTC+8)
        case 'prod_official_asia':
        case 'os_asia':
        case 'prod_gf_jp':
          // JST/KST: 5:00 AM
          resetTime = getResetTimeInTimezone('Asia/Tokyo', 5); // Using Tokyo for JST
          break;

        case 'os_cht':
        case 'prod_official_cht':
        case 'prod_gf_sg':
          // HKT/CST: 4:00 AM (HK, TW, MO)
          resetTime = getResetTimeInTimezone('Asia/Shanghai', 4);
          break;

        // America regions (UTC-5)

        case 'prod_official_usa':
        case 'prod_gf_us':
        case 'os_usa':
          // Using America/New_York for EST/EDT: 4:00 AM/5:00 AM
          resetTime = getResetTimeInTimezone('America/New_York', 4);
          break;

        // Europe regions (UTC+1)
        case 'prod_gf_eu':
        case 'prod_official_eur':
        case 'os_euro':
          // CET: 5:00 AM, BST: 4:00 AM - Using Europe/London for BST
          resetTime = getResetTimeInTimezone('Europe/London', 4);
          break;

        default:
          // Default to Asia/Shanghai 4:00 AM if region not recognized
          console.log(`Region not recognized: ${region}`);
          resetTime = getResetTimeInTimezone('Asia/Shanghai', 4);
      }

      // If we're past reset time, add a day
      if (now > resetTime) {
        resetTime.setDate(resetTime.getDate() + 1);
      }

      // Get difference in milliseconds
      const diff = resetTime.getTime() - now.getTime();

      // Convert to hours
      const hours = Math.floor(diff / (1000 * 60 * 60));

      // Return just hours as string
      return `${hours}`;
    };

    // Helper function to create a reset time in specified timezone
    const getResetTimeInTimezone = (timezone: string, resetHour: number): Date => {
      // Create formatter for the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });

      // Create a date object for now
      const now = new Date();

      // Format the current time in target timezone
      const parts = formatter.formatToParts(now);
      const timeParts: Record<string, string> = {};
      parts.forEach(part => {
        if (part.type !== 'literal') {
          timeParts[part.type] = part.value;
        }
      });

      // Create reset time in target timezone
      const resetTime = new Date();
      resetTime.setFullYear(
        parseInt(timeParts.year),
        parseInt(timeParts.month) - 1, // months are 0-indexed
        parseInt(timeParts.day)
      );
      resetTime.setHours(resetHour, 0, 0, 0);

      // Convert to local time
      const resetTimeStr = formatter.format(resetTime);
      const resetParts = formatter.formatToParts(resetTime);
      const resetTimeParts: Record<string, string> = {};
      resetParts.forEach(part => {
        if (part.type !== 'literal') {
          resetTimeParts[part.type] = part.value;
        }
      });

      // Set the local time equivalent
      const localResetTime = new Date();
      localResetTime.setFullYear(
        parseInt(resetTimeParts.year),
        parseInt(resetTimeParts.month) - 1,
        parseInt(resetTimeParts.day)
      );
      localResetTime.setHours(
        parseInt(resetTimeParts.hour),
        parseInt(resetTimeParts.minute),
        0,
        0
      );

      return localResetTime;
    };

    const refreshStats = async () => {

      const zzzBattery: zenlessBattery.zenlessBattery = await window.hoyoAPI.callMethod('zenless.getBattery', '');
      const zzzInfo: zenlessInfo.zenlessInfo = await window.hoyoAPI.callMethod('zenless.getInfo', '');

      const starrailInfo: starrailInfo.starrailInfo = await window.hoyoAPI.callMethod('starrail.getInfo', '');
      const starrailBattery: starrailBattery.starrailBattery = await window.hoyoAPI.callMethod('starrail.getStamina', '');

      const genshinInfo: genshinInfo.genshinInfo = await window.hoyoAPI.callMethod('genshin.getInfo', '');
      const genshinNotes: genshinNotes.genshinNotes = await window.hoyoAPI.callMethod('genshin.getNotes', '');


      const games: Game[] = [
        {
          title: "Zenless Zone Zero",
          logo: zzzIcon,
          accent: "#6B46C1",
          stats: [
            { label: "Proxy Level", value: `${zzzLevel}`, icon: <Star size={18} /> },
            { label: "Battery", value: `${zzzBattery.data.energy?.progress.current}/240`, icon: <Battery size={18} /> },
            { label: "Engagement", value: `${zzzBattery.data.vitality?.current}/${zzzBattery.data.vitality?.max}`, icon: <Coins size={18} /> },
            { label: "Ridu Weekly", value: `${zzzBattery.data.weekly_task?.cur_point}/${zzzBattery.data.weekly_task?.max_point}`, icon: <Clock size={18} /> },
            { label: "Daily Reset", value: `${calculateTimeUntilReset(zzzRg)} hours`, icon: <Clock size={18} /> },
          ],
          events: [

          ]
        },
        {
          title: "Honkai Star Rail",
          logo: honkaiIcon,
          accent: "#3182CE",
          stats: [
            { label: "Trailblaze Level", value: `${starrailLevel}`, icon: <Star size={18} /> },
            { label: "Stamina", value: `${starrailBattery?.data?.current_stamina}/${starrailBattery?.data?.max_stamina}`, icon: <Battery size={18} /> },
            { label: "Backup Stamina", value: `${starrailBattery?.data?.current_reserve_stamina}/${starrailBattery?.data?.current_reserve_stamina}`, icon: <Coins size={18} /> },
            { label: "Echo Of War", value: `${starrailBattery?.data?.current_rogue_score}/${starrailBattery?.data?.max_rogue_score}`, icon: <Clock size={18} /> },
            { label: "Daily Reset", value: `${calculateTimeUntilReset(starrailRg)} hours`, icon: <Clock size={18} /> },
          ]
        },
        {
          title: "Genshin Impact",
          logo: genshinIcon,
          accent: "#48BB78",
          stats: [
            { label: "Adventure Rank", value: `${genshinLevel}`, icon: <Star size={18} /> },
            { label: "Resin", value: `${genshinNotes.data.current_resin}/${genshinNotes.data.max_resin}`, icon: <Battery size={18} /> },
            { label: "Commisions", value: `${genshinNotes.data.daily_task.finished_num}/${genshinNotes.data.daily_task.total_num}`, icon: <Coins size={18} /> },
            { label: "Daily Reset", value: `${calculateTimeUntilReset(genshinRg)} hours`, icon: <Clock size={18} /> },
          ],
        }
      ];

      return games
    }



    setInterval(async () => {
      setGame(await refreshStats());
    }, 4000);
  }, [])



  return (
    <div ref={containerRef} className={`dashboard-container ${viewState === ViewState.RIGHT_FULL ? 'full' : 'neutral'}`}>
      <div className="dashboard-header">
        <h1 className={`dashboard-title ${viewState === ViewState.RIGHT_FULL ? 'full' : 'neutral'}`}>Game Account Status</h1>
        <button className="refresh-button">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div ref={cardsContainerRef} className="game-cards-container">
        {game?.map((game) => (
          <div
            key={game.title}
            className={`game-card ${viewState === ViewState.NEUTRAL && selectedGame !== game.title ? 'hidden-card' : viewState === ViewState.SPOTIFY_FULL && selectedGame !== game.title ? 'hidden-card' : ''}`}
            style={{
              '--accent-color': game.accent,
              '--accent-color-light': `${game.accent}20`
            } as CustomCSS}
          >
            {/* Game title section */}
            <div
              className="game-info-section"
              onClick={() => viewState === ViewState.NEUTRAL && setSelectedGame(game.title)}
              role="button"
              tabIndex={0}
            >
              <img src={game.logo} alt={`${game.title} logo`} className={`game-logo ${game.title === "Zenless Zone Zero" ? "zzz" :
                game.title === "Honkai Star Rail" ? "honkai" :
                  game.title === "Genshin Impact" ? "genshin" :
                    "zzz"
                }`}
              />
              <h2 className="game-title">{game.title}</h2>
              <span className="update-time">Updated: 10m ago</span>
            </div>

            {/* Stats section */}
            {(viewState !== ViewState.NEUTRAL || selectedGame === game.title) && (
              <>
                <div className="stats-section">
                  <div className="stats-grid">
                    {game.stats.map((stat) => (
                      <div key={stat.label} className="stat-card">
                        <div className="stat-icon-container">
                          <div className="stat-icon">{stat.icon}</div>
                        </div>
                        <div className="stat-details">
                          <p className="stat-label">{stat.label}</p>
                          <p className="stat-value">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action section */}
                {(game?.events?.[0]) && (
                  <div className="action-section">
                    <div className="missions-indicator">
                      <Award size={16} color='white' />
                      <span className="missions-count">Active Events: 3</span>
                    </div>
                    <button className="details-button">
                      View Details
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameAccountDashboard;