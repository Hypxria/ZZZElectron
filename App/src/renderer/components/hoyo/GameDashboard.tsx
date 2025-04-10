import React, { CSSProperties, useState, useRef, useEffect } from 'react';
import { Clock, Battery, Star, Coins, Award, RefreshCw } from 'lucide-react';
import './Styles/GameAccountDashboard.scss';
import { ViewState } from "../../../types/viewState";

import zzzIcon from "../../../assets/icons/Zenless_Zone_Zero_logo.png"
import genshinIcon from "../../../assets/icons/Genshin-Impact-Logo.png"
import honkaiIcon from "../../../assets/icons/Honkai_Star-Rail_Logo.png"

import { starrailBattery, starrailInfo, zenlessBattery, zenlessInfo, genshinInfo, genshinNotes } from 'src/services/hoyoServices/gameResponseTypes';

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
  events: GameEvent[];
}

const GameAccountDashboard: React.FC<GameAccountDashboardProps> = ({ viewState }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>("Zenless Zone Zero");
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game[] | null>(null)
  const [zzzBatteryData, setZzzBatteryData] = useState<zenlessBattery.zenlessBattery | null>(null);

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
    const refreshStats = async () => {
      
      // const zzzBattery: zenlessBattery.zenlessBattery = await window.hoyoAPI.callMethod('zenless.getBattery', '');
      // const zzzInfo: zenlessInfo.zenlessInfo = await window.hoyoAPI.callMethod('zenless.getInfo', '')

      // const starrailInfo: starrailInfo.starrailInfo = await window.hoyoAPI.callMethod('starrail.getInfo', '')
      // const starrailBattery: starrailBattery.starrailBattery = await window.hoyoAPI.callMethod('starrail.getStamina', '')

      // const genshinInfo: genshinInfo.genshinInfo = await window.hoyoAPI.callMethod('genshin.getInfo', '')
      const genshinNotes: genshinNotes.genshinNotes = await window.hoyoAPI.callMethod('genshin.getNotes', '')

      console.log(`GenshinNotes: ${genshinNotes?.data?.max_resin}`)

      const games: Game[] = [
        {
          title: "Zenless Zone Zero",
          logo: zzzIcon,
          accent: "#6B46C1",
          stats: [
            { label: "Master Level", value: "45", icon: <Star size={18} /> },
            { label: "Energy", value: "120/150", icon: <Battery size={18} /> },
            { label: "Currency", value: "8,450", icon: <Coins size={18} /> },
            { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> },
            { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> },
          ],
          events: [
    
          ]
        },
        {
          title: "Honkai Star Rail",
          logo: honkaiIcon,
          accent: "#3182CE",
          stats: [
            { label: "Trailblaze Level", value: "62", icon: <Star size={18} /> },
            { label: "Trailblaze Power", value: "180/240", icon: <Battery size={18} /> },
            { label: "Stellar Jade", value: "15,620", icon: <Coins size={18} /> },
            { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> },
            { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> }
          ],
          events: [
            { name: "Video Store Management", status: "Currently Open" },
            { name: "Ridu Weekly Points", value: "900/1300", isHighlight: true }
          ]
        },
        {
          title: "Genshin Impact",
          logo: genshinIcon,
          accent: "#48BB78",
          stats: [
            { label: "Adventure Rank", value: "58", icon: <Star size={18} /> },
            { label: "Resin", value: "120/160", icon: <Battery size={18} /> },
            { label: "Primogems", value: "12,350", icon: <Coins size={18} /> },
            { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> }
          ],
          events: [
            { name: "Video Store Management", status: "Currently Open" },
            { name: "Ridu Weekly Points", value: "900/1300", isHighlight: true }
          ]
        }
      ];

      return games
    }
    

    
    setInterval(() => {
      refreshStats();
    }, 1000);
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
              <img src={game.logo} alt={`${game.title} logo`} className={`game-logo ${
                game.title === "Zenless Zone Zero" ? "zzz" :
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
                {(game.events[0]) && (
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