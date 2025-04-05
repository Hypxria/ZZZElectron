// GameZenless.tsx
import React from 'react';
import './Styles/GameZenless.scss';

interface MissionItemProps {
    name: string;
    value?: string;
    status?: string;
    isHighlight?: boolean;
}

const MissionItem: React.FC<MissionItemProps> = ({ name, value, status, isHighlight }) => (
    <div className="mission-item">
        <div className="mission-name">{name}</div>
        {value && <div className={`mission-progress ${isHighlight ? 'highlight' : ''}`}>{value}</div>}
        {status && <div className={`mission-status ${status.toLowerCase()}`}>{status}</div>}
    </div>
);



const BatterySection: React.FC = () => (
    <div className="battery-section">
        <div className="battery-icon-container">
            <div className="battery-icon">
                <img src="/battery-icon.png" alt="Battery" className="battery-img" />
            </div>
        </div>
        <h2 className="battery-title">Battery Charge</h2>
        <div className="battery-value">240/240</div>
        <div className="battery-status">Fully Recovered</div>
        <div className="battery-bar"></div>
    </div>
);

const MissionsSection: React.FC = () => (
    <div className="menu-right">
        <div className="missions-section">
            <div className="daily-missions">
                <div className="section-header">
                    <h2>Daily Missions</h2>
                </div>
                <div className="mission-items">
                    <MissionItem
                        name="Engagement Today"
                        value="400/400" />
                    <MissionItem
                        name="Scratch Card Mania"
                        status="Complete" />
                    <MissionItem
                        name="Video Store Management"
                        status="Currently Open" />
                </div>
            </div>

            <div className="season-missions">
                <div className="section-header">
                    <h2>Season Missions</h2>
                </div>
                <div className="mission-items">
                    <MissionItem
                        name="Bounty Commission Progress"
                        value="4/4" />
                    <MissionItem
                        name="Ridu Weekly Points"
                        value="900/1300"
                        isHighlight={true} />
                </div>
            </div>
        </div>
    </div>
);

const GameZenless: React.FC = () => {
    return (
        <div className="game-menu-container">
            <div className="menu-panel">
                <div className="menu-left">
                    <BatterySection />
                </div>

                <MissionsSection />
            </div>
        </div>
    );
};

export default GameZenless;
