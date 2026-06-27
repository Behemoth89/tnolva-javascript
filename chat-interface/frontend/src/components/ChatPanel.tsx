import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ChatPanel.module.css';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Chat, Message } from '../chat/types';
import {
  createChat,
  deleteChat as deleteChatApi,
  getChat as getChatApi,
  listAvailableModels,
  listChats as listChatsApi,
  sendMessage as sendMessageApi,
  updateChat as updateChatApi,
  type AvailableModel,
} from '../api/chats';

export function ChatPanel() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [pending, setPending] = useState(false);
  const [pendingUserMessageId, setPendingUserMessageId] = useState<number | null>(null);
  const [newChatPending, setNewChatPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const refreshChats = useCallback(async (): Promise<Chat[]> => {
    const list = (await listChatsApi()) as Chat[];
    const safeList = Array.isArray(list) ? list : [];
    setChats(safeList);
    return safeList;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await refreshChats();
        const models = await listAvailableModels().catch(() => []);
        if (cancelled) return;
        setAvailableModels(models);
        if (list.length > 0 && list[0]) {
          setActiveChatId(list[0].id);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load chats');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshChats]);

  useEffect(() => {
    if (activeChatId === null) {
      setActiveChat(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await getChatApi(activeChatId);
        if (cancelled) return;
        setActiveChat(data.chat);
        setMessages(data.messages);
        setSendError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && /not found/i.test(err.message)) {
          setActiveChat(null);
          setMessages([]);
          return;
        }
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load chat');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChatId]);

  const activeMessages = useMemo(() => messages, [messages]);
  const defaultModel = activeChat?.default_llm_provider_model ?? '';

  const handleSelectChat = useCallback((id: number) => {
    setActiveChatId(id);
  }, []);

  const handleNewChat = useCallback(async () => {
    const fallbackModel =
      activeChat?.default_llm_provider_model ??
      availableModels[0]?.provider_model ??
      '';
    if (!fallbackModel) {
      setSendError('No LLM provider+model is registered. Ask an admin to add one.');
      return;
    }
    setNewChatPending(true);
    try {
      const created = await createChat({ default_llm_provider_model: fallbackModel });
      const list = await refreshChats();
      setActiveChatId(created.id);
      if (!list.some((c) => c.id === created.id)) {
        setChats([created, ...(chats ?? [])]);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to create chat');
    } finally {
      setNewChatPending(false);
    }
  }, [activeChat, availableModels, chats, refreshChats]);

  const handleSend = useCallback(
    async (text: string) => {
      if (activeChatId === null) return;
      const optimisticId = -Date.now();
      const optimistic: Message = {
        id: optimisticId,
        chat_id: activeChatId,
        role: 'user',
        content: text,
        provider_model: defaultModel,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setPending(true);
      setPendingUserMessageId(optimisticId);
      setSendError(null);
      try {
        const result = await sendMessageApi(activeChatId, { content: text });
        if (result.ok) {
          setActiveChat(result.value.chat);
          setMessages(result.value.messages);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? { ...m, content: `${m.content} (failed)` } : m)),
          );
          setActiveChat(result.chat.chat);
          setMessages((prev) => {
            const persisted = result.chat.messages;
            const without = prev.filter((m) => m.id !== optimisticId);
            const ids = new Set(persisted.map((m) => m.id));
            return [...without.filter((m) => !ids.has(m.id)), ...persisted];
          });
          setSendError(result.error);
        }
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setPending(false);
        setPendingUserMessageId(null);
      }
    },
    [activeChatId, defaultModel],
  );

  const handleModelChange = useCallback(
    async (next: string) => {
      if (activeChatId === null) return;
      const previous = activeChat?.default_llm_provider_model;
      setActiveChat((prev) =>
        prev ? { ...prev, default_llm_provider_model: next } : prev,
      );
      try {
        const updated = await updateChatApi(activeChatId, { default_llm_provider_model: next });
        setActiveChat(updated);
        setChats((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
        );
      } catch (err) {
        if (previous) {
          setActiveChat((prev) =>
            prev ? { ...prev, default_llm_provider_model: previous } : prev,
          );
        }
        setSendError(err instanceof Error ? err.message : 'Failed to update model');
      }
    },
    [activeChat, activeChatId],
  );

  const handleDeleteChat = useCallback(
    async (id: number) => {
      try {
        await deleteChatApi(id);
        const list = await refreshChats();
        if (activeChatId === id) {
          setActiveChatId(list[0]?.id ?? null);
        }
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Failed to delete chat');
      }
    },
    [activeChatId, refreshChats],
  );

  return (
    <section
      data-testid="chat-panel"
      className={`${styles.panel} anim-panel-scale`}
      aria-label="Chat"
    >
      <div className={styles.panel__inner}>
        <Sidebar
          chats={chats ?? []}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={() => {
            void handleNewChat();
          }}
          newChatPending={newChatPending}
        />
        <div className={styles.panel__main}>
          <header className={styles.panel__header}>
            <h1 className={styles.panel__title} data-testid="chat-title">
              {activeChat?.title && activeChat.title.length > 0 ? activeChat.title : 'Chat'}
            </h1>
            <label className={styles.panel__model}>
              <span className={styles.panel__modelLabel}>Model</span>
              <select
                data-testid="chat-model-select"
                value={defaultModel}
                onChange={(e) => {
                  void handleModelChange(e.target.value);
                }}
                disabled={availableModels.length === 0 || activeChatId === null}
              >
                {availableModels.length === 0 && <option value="">(no models)</option>}
                {availableModels.map((m) => (
                  <option key={m.provider_model} value={m.provider_model}>
                    {m.provider_model}
                  </option>
                ))}
              </select>
            </label>
            {activeChat && (
              <button
                type="button"
                data-testid="chat-delete"
                className={styles.panel__delete}
                onClick={() => {
                  void handleDeleteChat(activeChat.id);
                }}
              >
                Delete
              </button>
            )}
          </header>
          {loadError && (
            <p
              role="alert"
              data-testid="chat-load-error"
              className={styles.panel__loadError}
            >
              {loadError}
            </p>
          )}
          <MessageList messages={activeMessages} pendingUserMessageId={pendingUserMessageId} />
          <MessageInput
            onSend={(t) => {
              void handleSend(t);
            }}
            disabled={pending || activeChatId === null}
            error={sendError}
            onDismissError={() => setSendError(null)}
          />
        </div>
      </div>
    </section>
  );
}

export default ChatPanel;
