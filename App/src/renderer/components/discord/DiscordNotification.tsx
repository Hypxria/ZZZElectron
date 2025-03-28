import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Styles/DiscordNotification.scss';
import { DiscordNotificationType } from './../../../services/discordServices/types';

interface NotificationProps {
  author: string;
  message: string;
  timestamp: string;
  avatarUrl?: string;
  isVisible?: boolean;
}

declare global {
  interface Window {
    discord: {
      connect: () => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<void>;
      onNotification: (callback: (notification: any) => void) => void;
      removeNotificationListener: () => void;
    }
  }
}


const DiscordNotification: React.FC = ({

}) => {

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [messageTime, setMessageTime] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('');

  const [isVisible, setIsVisible] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Function to handle showing and hiding notification
  const showNotification = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show the notification
    setIsVisible(true);

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    let mounted = true;

    const connectToDiscord = async () => {
      try {
        const result = await window.discord.connect();
        if (!mounted) return;

        if (!result.success) {
          console.error('Failed to connect to Discord:', result.error);
          return;
        }

        window.discord.onNotification((notification: DiscordNotificationType) => {
          if (!mounted) return;
          // Getting values that we need
          console.log('Notification received:', notification);
          setAvatarUrl(notification.icon_url);
          setAuthor(notification.message.author.global_name);
          
          const date = new Date(notification.message.timestamp);
          setMessageTime(date)
          setTimestamp(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          /*
          }
          Notification received: {
            channel_id: '1354222328267149373',
            message: {
              id: '1354987275741564928',
              content: '',
              nick: 'Eleuthia',
              timestamp: '2025-03-28T01:15:40.983000+00:00',
              tts: false,
              mentions: [],
              mention_roles: [],
              embeds: [],
              attachments: [ [Object] ],
              author: {
                id: '1250111229582643232',
                username: 'femboyeleuthia',
                discriminator: '0',
                global_name: 'Eleuthia',
                avatar: '8ff6e5631d4588748ba11b1611d84223',
                avatar_decoration_data: null,
                bot: false,
                flags: 0,
                premium_type: 0
              },
              pinned: false,
              type: 0
            },
            icon_url: 'https://cdn.discordapp.com/avatars/1250111229582643232/8ff6e5631d4588748ba11b1611d84223.webp?size=240',
            title: 'Eleuthia',
            body: 'Uploaded digital_art_drawing_illustrati3.webp'
          }
          */
          
          setMessage(notification.body);

          showNotification()
        });
      } catch (error) {
        if (!mounted) return;
        console.error('Error connecting to Discord:', error);
      }
    };

    connectToDiscord();

    return () => {
      mounted = false;
      window.discord.disconnect();
    };
  }, [showNotification]);











  return (
    <div className={`notification-container ${isVisible ? 'visible' : ''}`}>
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
