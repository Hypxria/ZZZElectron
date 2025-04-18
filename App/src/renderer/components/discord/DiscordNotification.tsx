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
  const [message, setMessage] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('')

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);

  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout when component unmounts
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Function to handle showing and hiding notification
  const showNotification = useCallback(() => {
    setIsVisible(true);
    // Only set the hide timeout if not currently hovered
    if (!isHovered) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // 5 seconds
    }
  }, [isHovered]);


  useEffect(() => {
    let mounted = true;

    const handleNotification = (notification: DiscordNotificationType) => {
      console.log('Notification received:', notification);
      setAvatarUrl(notification.data.icon_url);
      setAuthor(notification.data.title);
      setChannelId(notification.data.channel_id.toString())

      const date = new Date(notification.data.message.timestamp);
      setTimestamp(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      setMessage(notification.data.body);

      showNotification()
    };

    const connectToDiscord = async () => {
      try {
        window.discord.onData((data: any) => {
          // Getting values that we need
          if (data.evt === 'NOTIFICATION_CREATE') handleNotification(data)
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Clear the hide timeout when mouse enters
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Start the hide timeout when mouse leaves
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const handleNotiClick = () => {
    window.discord.selectTextChannel(message)
  }

  return (
    <div className={`notification-container ${isVisible ? 'visible' : ''}`} onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="profile-picture">
        {avatarUrl ? (
          <img src={avatarUrl} alt={author} />
        ) : (
          <div className="default-avatar" />
        )}
      </div>

      <div className="notification-content" onClick={handleNotiClick}>
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
