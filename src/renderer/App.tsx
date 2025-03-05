import React, { useState, useEffect } from 'react';
import SpotifyMain from './components/spotify/SpotifyMain';
import Titlebar from './components/Titlebar';
import CredentialsPopup from './components/CredentialsPopup';
import { spotifyService } from '../services/SpotifyService';
import '../index.css';

const App: React.FC = () => {
  const [showCredentialsPopup, setShowCredentialsPopup] = useState(false);

  

  const handleSaveCredentials = (credentials: { clientId: string; clientSecret: string }) => {
    spotifyService.updateCredentials(credentials.clientId, credentials.clientSecret);
  };


  return (
    <div>
      <Titlebar />
      <div>
        <SpotifyMain />
      </div>
      <CredentialsPopup
        isOpen={showCredentialsPopup}
        onClose={() => setShowCredentialsPopup(false)}
        onSave={handleSaveCredentials}
      />
    </div>
  );
};

export default App;