import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/DiscordNotification.scss';
import { DiscordNotificationType } from './../../../services/discordServices/types.ts';

interface NotificationProps {
  author: string;
  message: string;
  timestamp: string;
  avatarUrl?: string;
  isVisible?: boolean;
}

type TextSegment = {
  type: 'text' | 'bold' | 'italic' | 'bold-italic' | 'underline' | 'strikethrough' | 'code';
  content: string;
};

const parseDiscordFormatting = (text: string): TextSegment[] => {
  // First handle double escapes
  text = text.replace(/\\\\/g, '{{DOUBLE_ESCAPE}}');

  // Handle escaped formatting characters
  text = text
    .replace(/\\\*\*\*/g, '{{ESCAPED_BOLD_ITALIC}}')
    .replace(/\\\*\*/g, '{{ESCAPED_BOLD}}')
    .replace(/\\\*/g, '{{ESCAPED_ITALIC}}')
    .replace(/\\__/g, '{{ESCAPED_UNDERLINE}}')
    .replace(/\\~~/g, '{{ESCAPED_STRIKETHROUGH}}')
    .replace(/\\`/g, '{{ESCAPED_CODE}}');

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  // Regular expressions for different formatting
  const patterns = [
    { regex: /\*\*\*(.*?)\*\*\*/g, type: 'bold-italic' },
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
    { regex: /\*(.*?)\*/g, type: 'italic' },
    { regex: /__(.*?)__/g, type: 'underline' },
    { regex: /~~(.*?)~~/g, type: 'strikethrough' },
    { regex: /```(.*?)```/g, type: 'code' },
    { regex: /`(.*?)`/g, type: 'code' }
  ];

  while (currentIndex < text.length) {
    let match: RegExpExecArray | null = null;
    let earliestMatch = { index: text.length, type: '', content: '' };

    // Find the earliest matching pattern
    for (const pattern of patterns) {
      pattern.regex.lastIndex = currentIndex;
      const m = pattern.regex.exec(text);
      if (m && m.index < earliestMatch.index) {
        earliestMatch = {
          index: m.index,
          type: pattern.type as TextSegment['type'],
          content: m[1]
        };
        match = m;
      }
    }

    if (match && earliestMatch.index === currentIndex) {
      // Add the formatted segment
      segments.push({
        type: earliestMatch.type as TextSegment['type'],
        content: earliestMatch.content
      });
      currentIndex = match.index + match[0].length;
    } else {
      // Add plain text up to the next match or end
      const nextIndex = earliestMatch.index;
      const plainText = text.slice(currentIndex, nextIndex);
      if (plainText) {
        segments.push({ type: 'text', content: plainText });
      }
      currentIndex = nextIndex;
    }
  }

  // Restore escaped characters
  segments.forEach(segment => {
    segment.content = segment.content
      .replace(/{{DOUBLE_ESCAPE}}/g, '\\')
      .replace(/{{ESCAPED_BOLD_ITALIC}}/g, '***')
      .replace(/{{ESCAPED_BOLD}}/g, '**')
      .replace(/{{ESCAPED_ITALIC}}/g, '*')
      .replace(/{{ESCAPED_UNDERLINE}}/g, '__')
      .replace(/{{ESCAPED_STRIKETHROUGH}}/g, '~~')
      .replace(/{{ESCAPED_CODE}}/g, '`');
  });

  return segments;
};

// FormattedText component to render the segments
const FormattedText: React.FC<{ segments: TextSegment[] }> = ({ segments }) => {
  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'bold':
            return <strong key={index}>{segment.content}</strong>;
          case 'italic':
            return <em key={index}>{segment.content}</em>;
          case 'bold-italic':
            return <strong key={index}><em>{segment.content}</em></strong>;
          case 'underline':
            return <u key={index}>{segment.content}</u>;
          case 'strikethrough':
            return <s key={index}>{segment.content}</s>;
          case 'code':
            return <code key={index}>{segment.content}</code>;
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </>
  );
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
    <div className={`notification-container ${isVisible ? 'visible' : 'visible'}`} onMouseEnter={handleMouseEnter}
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
        >
          <FormattedText segments={parseDiscordFormatting(message)} />
        </div>
      </div>
    </div>
  );
};



export default DiscordNotification;
