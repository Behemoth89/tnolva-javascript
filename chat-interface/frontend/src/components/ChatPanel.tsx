import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ChatPanel.module.css';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { pickCannedReply, seedChats, seedMessages } from '../chat/mockData';
import type { Message } from '../chat/types';

const AI_REPLY_DELAY_MS = 400;

function buildSeedByChat(): Record<string, Message[]> {
  const map: Record<string, Message[]> = {};
  for (const chat of seedChats) {
    map[chat.id] = [];
  }
  for (const message of seedMessages) {
    const bucket = map[message.chatId];
    if (bucket) bucket.push(message);
  }
  return map;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ChatPanel() {
  const initialChatId = seedChats[0]?.id ?? '';
  const [activeChatId, setActiveChatId] = useState<string>(initialChatId);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>(
    () => buildSeedByChat(),
  );

  const activeMessages = useMemo(
    () => messagesByChat[activeChatId] ?? [],
    [messagesByChat, activeChatId],
  );
  const activeChat = useMemo(
    () => seedChats.find((c) => c.id === activeChatId) ?? null,
    [activeChatId],
  );

  useEffect(() => {
    return () => {
      // No-op cleanup; placeholder for future stream teardown.
    };
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      const userMessage: Message = {
        id: makeId('m'),
        chatId: activeChatId,
        author: 'user',
        text,
      };
      setMessagesByChat((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] ?? []), userMessage],
      }));

      window.setTimeout(() => {
        const reply: Message = {
          id: makeId('m'),
          chatId: activeChatId,
          author: 'assistant',
          text: pickCannedReply(),
        };
        setMessagesByChat((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] ?? []), reply],
        }));
      }, AI_REPLY_DELAY_MS);
    },
    [activeChatId],
  );

  return (
    <section
      data-testid="chat-panel"
      className={`${styles.panel} anim-panel-scale`}
      aria-label="Chat"
    >
      <div className={styles.panel__inner}>
        <Sidebar
          chats={seedChats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
        />
        <div className={styles.panel__main}>
          <header className={styles.panel__header}>
            <h1 className={styles.panel__title} data-testid="chat-title">
              {activeChat?.title ?? 'Chat'}
            </h1>
          </header>
          <MessageList messages={activeMessages} />
          <MessageInput onSend={handleSend} />
        </div>
      </div>
    </section>
  );
}

export default ChatPanel;
