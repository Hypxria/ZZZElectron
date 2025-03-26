import React from 'react'
import './Styles/DiscordNotification.css'

interface NotificationProps {
  isEnabled: boolean
}

const DiscordNotification: React.FC<NotificationProps> = ({isEnabled}) => {

  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
    };
  }, []);

  return (
      <div className={`notification-container ${isEnabled}`}></div>
  );
};

export default DiscordNotification;