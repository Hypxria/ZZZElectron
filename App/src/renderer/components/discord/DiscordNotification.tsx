import React, {useState, useEffect} from 'react';
import './Styles/DiscordNotification.scss';
import discordService from './../../../services/discordServices/DiscordService';
import { DiscordNotificationType } from './../../../services/discordServices/types';

interface NotificationProps {
  author: string;
  message: string;
  timestamp: string;
  avatarUrl?: string;
  isVisible?: boolean;
}




const DiscordNotification: React.FC = ({

}) => {

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    
    const discord = new discordService()

    discord.start()

    

    
    
  }, []); // Empty dependency array means this runs once on mount


  return (
    <div className={`notification-container`}>
      <div className="profile-picture">
        {avatarUrl ? (
          <img src={avatarUrl} alt={author} />
        ) : (
          <div className="default-avatar" />
        )}
      </div>

      <div className="notification-content">
        <div className="notification-header">
          <span className="author">{author}</span>
          <span className="timestamp">{timestamp}</span>
        </div>

        <div className="notification-message">
          {message}
        </div>
      </div>
    </div>
  );
};

export default DiscordNotification;
