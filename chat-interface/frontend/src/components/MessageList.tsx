import { useEffect, useRef } from 'react';
import styles from './MessageList.module.css';
import MessageBubble from './MessageBubble';
import type { Message } from '../chat/types';

interface MessageListProps {
  messages: Message[];
  pendingUserMessageId?: number | null;
}

const CASCADE_BASE_DELAY_MS = 600;
const CASCADE_STEP_MS = 60;

export function MessageList({ messages, pendingUserMessageId = null }: MessageListProps) {
  const mountedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (mountedAtRef.current === null) {
      mountedAtRef.current = performance.now();
    }
  }, []);

  if (messages.length === 0) {
    return (
      <div data-testid="chat-message-list" className={styles.list}>
        <p data-testid="chat-empty-state" className={styles.empty}>
          Send a message to start.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="chat-message-list" className={styles.list}>
      {messages.map((message, index) => {
        const delay = `${CASCADE_BASE_DELAY_MS + index * CASCADE_STEP_MS}ms`;
        const isPending = pendingUserMessageId === message.id;
        return (
          <div
            key={message.id}
            className="anim-message-cascade"
            style={{ animationDelay: delay, display: 'flex' }}
          >
            <MessageBubble message={message} />
            {isPending && (
              <span
                data-testid="chat-thinking-indicator"
                className={styles.thinking}
                aria-live="polite"
              >
                thinking…
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MessageList;
