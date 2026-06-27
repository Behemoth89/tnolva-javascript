import styles from './MessageBubble.module.css';
import type { Message } from '../chat/types';

interface MessageBubbleProps {
  message: Message;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const variant = isUser ? styles['bubble--user'] : styles['bubble--assistant'];
  return (
    <div
      data-testid="chat-message"
      data-message-id={message.id}
      data-message-role={message.role}
      className={`${styles.bubble} ${variant}`}
    >
      <div className={styles.bubble__text}>{message.content}</div>
      <div className={styles.bubble__meta}>
        <span className={styles.bubble__time}>{formatTimestamp(message.created_at)}</span>
        <span className={styles.bubble__model} data-testid="chat-message-model">
          {message.provider_model}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;
