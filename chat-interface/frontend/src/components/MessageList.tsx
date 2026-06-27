import { useEffect, useRef } from 'react';
import styles from './MessageList.module.css';
import MessageBubble from './MessageBubble';
import type { Message } from '../chat/types';

interface MessageListProps {
  messages: Message[];
}

const CASCADE_BASE_DELAY_MS = 600;
const CASCADE_STEP_MS = 60;

export function MessageList({ messages }: MessageListProps) {
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (mountedAtRef.current === null) {
      mountedAtRef.current = performance.now();
    }
  }, []);

  if (messages.length === 0) {
    return (
      <div data-testid="message-list" className={styles.list}>
        <p className={styles.empty}>No messages yet. Say hi to start the conversation.</p>
      </div>
    );
  }

  return (
    <div data-testid="message-list" className={styles.list}>
      {messages.map((message, index) => {
        const delay = `${CASCADE_BASE_DELAY_MS + index * CASCADE_STEP_MS}ms`;
        return (
          <div
            key={message.id}
            className="anim-message-cascade"
            style={{ animationDelay: delay, display: 'flex' }}
          >
            <MessageBubble message={message} />
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
