import styles from './MessageBubble.module.css';
import type { Message } from '../chat/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.author === 'user';
  const variant = isUser ? styles['bubble--user'] : styles['bubble--assistant'];
  return (
    <div
      data-testid="message-bubble"
      data-author={message.author}
      data-message-id={message.id}
      className={`${styles.bubble} ${variant}`}
    >
      {message.text}
    </div>
  );
}

export default MessageBubble;
