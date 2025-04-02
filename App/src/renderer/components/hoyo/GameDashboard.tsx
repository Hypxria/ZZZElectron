// components/GameDashboard.tsx
import React, { useState } from 'react';
import { Box, Button, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { starrailInfo, zenlessInfo, genshinInfo, baseInfo} from '../../../services/hoyoServices/gameResponseTypes/index'
import GameZenless from './Games/GameZenless';
import './Styles/GameDashboard.scss'
import { ViewState } from '../../../../src/types/viewState';

// Game type definition
type GameType = 'genshin' | 'starrail' | 'zenless';

interface GameDashboardTypes  {
  viewState: ViewState;
}

const GameDashboard: React.FC<GameDashboardTypes> = (viewState) => {
  

  
  return (
    <div>
        <div className={`zenless-container ${viewState.viewState}`}>
            <GameZenless />
        </div>
    </div>
  );
};

export default GameDashboard;

