import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Styles/DiscordNotification.scss';
import { DiscordNotificationType } from './../../../services/discordServices/types';
import secureLocalStorage from 'react-secure-storage';

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
      connect: ( id:string, secret:string) => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<void>;
      onNotification: (callback: (notification: any) => void) => void;
      removeNotificationListener: () => void;
    }
  }
}

const parseDiscordFormatting = (text: string) => {
  // First handle double escapes - replace \\ with a temporary marker
  text = text.replace(/\\\\/g, '{{DOUBLE_ESCAPE}}');

  // Handle escaped formatting characters
  text = text
    .replace(/\\\*\*\*/g, '{{ESCAPED_BOLD_ITALIC}}')
    .replace(/\\\*\*/g, '{{ESCAPED_BOLD}}')
    .replace(/\\\*/g, '{{ESCAPED_ITALIC}}')
    .replace(/\\__/g, '{{ESCAPED_UNDERLINE}}')
    .replace(/\\~~/g, '{{ESCAPED_STRIKETHROUGH}}')
    .replace(/\\`/g, '{{ESCAPED_CODE}}');

  // Replace Discord markdown with HTML/React elements
  text = text
    // Bold and Italic (***text***)
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold (**text**)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic (*text*)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Underline (__text__)
    .replace(/__(.*?)__/g, '<u>$1</u>')
    // Strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    // Code blocks (```text```)
    .replace(/```(.*?)```/g, '<code>$1</code>')
    // Inline code (`text`)
    .replace(/`(.*?)`/g, '<code>$1</code>');

  // Restore escaped characters
  text = text
    .replace(/{{DOUBLE_ESCAPE}}/g, '\\')
    .replace(/{{ESCAPED_BOLD_ITALIC}}/g, '***')
    .replace(/{{ESCAPED_BOLD}}/g, '**')
    .replace(/{{ESCAPED_ITALIC}}/g, '*')
    .replace(/{{ESCAPED_UNDERLINE}}/g, '__')
    .replace(/{{ESCAPED_STRIKETHROUGH}}/g, '~~')
    .replace(/{{ESCAPED_CODE}}/g, '`');

  return text;
};

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
        const id = secureLocalStorage.getItem('discord_client_id');
        const secret = secureLocalStorage.getItem('discord_client_secret');
        
        const result = await window.discord.connect(String(id), String(secret));
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
          setAuthor(notification.title);
          
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

        <div 
          className="notification-message"
          dangerouslySetInnerHTML={{ 
            __html: parseDiscordFormatting(message) 
          }}
        />
      </div>
    </div>
  );
};

export default DiscordNotification;
