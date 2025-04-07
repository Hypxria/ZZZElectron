import React, { CSSProperties, useState } from 'react';
import { Clock, Battery, Star, Coins, Award, RefreshCw } from 'lucide-react';
import './Styles/GameAccountDashboard.scss';
import { ViewState } from "../../../types/viewState";


interface CustomCSS extends CSSProperties {
  '--accent-color'?: string;
  '--accent-color-light'?: string;
}

interface GameAccountDashboardProps {
  viewState: ViewState;
}

const GameAccountDashboard: React.FC<GameAccountDashboardProps> = ({ viewState }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>("Zenless Zone Zero");

  // Sample game data
  const games = [
    {
      title: "Zenless Zone Zero",
      logo: "/api/placeholder/100/50",
      accent: "#6B46C1",
      stats: [
        { label: "Master Level", value: "45", icon: <Star size={18} /> },
        { label: "Energy", value: "120/150", icon: <Battery size={18} /> },
        { label: "Currency", value: "8,450", icon: <Coins size={18} /> },
        { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> },
        { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> }
      ]
    },
    {
      title: "Honkai Star Rail",
      logo: "/api/placeholder/100/50",
      accent: "#3182CE",
      stats: [
        { label: "Trailblaze Level", value: "62", icon: <Star size={18} /> },
        { label: "Trailblaze Power", value: "180/240", icon: <Battery size={18} /> },
        { label: "Stellar Jade", value: "15,620", icon: <Coins size={18} /> },
        { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> },
        { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> }
      ]
    },
    {
      title: "Genshin Impact",
      logo: "/api/placeholder/100/50",
      accent: "#48BB78",
      stats: [
        { label: "Adventure Rank", value: "58", icon: <Star size={18} /> },
        { label: "Resin", value: "120/160", icon: <Battery size={18} /> },
        { label: "Primogems", value: "12,350", icon: <Coins size={18} /> },
        { label: "Daily Reset", value: "3h 24m", icon: <Clock size={18} /> }
      ]
    }
  ];

  return (
    <div className={`dashboard-container ${viewState === ViewState.RIGHT_FULL ? 'full' : 'neutral'}`}>
      <div className="dashboard-header">
        <h1 className={`dashboard-title ${viewState === ViewState.RIGHT_FULL ? 'full' : 'neutral'}`}>Game Account Status</h1>
        <button className="refresh-button">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="game-cards-container">
        {games.map((game) => (
          <div
            key={game.title}
            className={`game-card ${viewState === ViewState.NEUTRAL && selectedGame !== game.title ? 'hidden-card' : viewState === ViewState.SPOTIFY_FULL && selectedGame !== game.title ? 'hidden-card': '' }`}
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
              <img src={game.logo} alt={`${game.title} logo`} className="game-logo" />
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
                <div className="action-section">
                  <div className="missions-indicator">
                    <Award size={16} />
                    <span className="missions-count">Active Missions: 3</span>
                  </div>
                  <button className="details-button">
                    View Details
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameAccountDashboard;