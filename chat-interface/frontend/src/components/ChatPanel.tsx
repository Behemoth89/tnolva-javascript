import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { type Project, listProjects } from '../api/projects';

const TITLE_MAX_LENGTH = 200;

export function ChatPanel() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [pendingUserMessageId, setPendingUserMessageId] = useState<number | null>(null);
  const [newChatPending, setNewChatPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [titlePending, setTitlePending] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const refreshChats = useCallback(async (): Promise<Chat[]> => {
    const list = (await listChatsApi()) as Chat[];
    const safeList = Array.isArray(list) ? list : [];
    setChats(safeList);
    return safeList;
  }, []);

  const refreshProjects = useCallback(async (): Promise<Project[]> => {
    setProjectsLoading(true);
    try {
      const list = await listProjects();
      const safe = Array.isArray(list) ? list : [];
      setProjects(safe);
      return safe;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load projects');
      return [];
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [list, models, projectList] = await Promise.all([
          refreshChats(),
          listAvailableModels().catch(() => [] as AvailableModel[]),
          refreshProjects(),
        ]);
        if (cancelled) return;
        setAvailableModels(models);
        if (list.length > 0 && list[0]) {
          setActiveChatId(list[0].id);
        }
        const defaultProj = projectList.find((p) => p.is_user_default === 1);
        if (defaultProj) {
          setActiveProjectId((prev) => prev ?? defaultProj.id);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load chats');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshChats, refreshProjects]);

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
        if (data.chat && data.chat.project_id) {
          setActiveProjectId(data.chat.project_id);
        }
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
    setIsEditingTitle(false);
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

  const handleStartEditTitle = useCallback(() => {
    if (!activeChat) return;
    setTitleDraft(activeChat.title ?? '');
    setIsEditingTitle(true);
  }, [activeChat]);

  const handleCancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
    setTitleDraft('');
  }, []);

  const handleSaveTitle = useCallback(
    async (rawValue: string) => {
      if (activeChatId === null || titlePending) return;
      const trimmed = rawValue.trim();
      const currentTitle = activeChat?.title ?? '';
      if (trimmed === currentTitle) {
        setIsEditingTitle(false);
        setTitleDraft('');
        return;
      }
      const next: string | null = trimmed.length === 0 ? null : trimmed;
      setTitlePending(true);
      const previous = activeChat;
      setActiveChat((prev) => (prev ? { ...prev, title: next } : prev));
      try {
        const updated = await updateChatApi(activeChatId, { title: next });
        setActiveChat(updated);
        setChats((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
        );
        setIsEditingTitle(false);
        setTitleDraft('');
      } catch (err) {
        setActiveChat(previous);
        setSendError(err instanceof Error ? err.message : 'Failed to update title');
        setIsEditingTitle(false);
        setTitleDraft('');
      } finally {
        setTitlePending(false);
      }
    },
    [activeChat, activeChatId, titlePending],
  );

  const handleTitleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void handleSaveTitle(event.currentTarget.value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelEditTitle();
      }
    },
    [handleCancelEditTitle, handleSaveTitle],
  );

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      setIsEditingTitle(false);
      setTitleDraft('');
    }
  }, [activeChatId]);

  const displayTitle = activeChat?.title && activeChat.title.length > 0
    ? activeChat.title
    : 'Untitled chat';

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
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                data-testid="chat-title-input"
                aria-label="Chat title"
                className={styles.panel__title}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={(e) => {
                  void handleSaveTitle(e.currentTarget.value);
                }}
                onKeyDown={handleTitleKeyDown}
                maxLength={TITLE_MAX_LENGTH}
                disabled={titlePending}
                placeholder="Untitled chat"
              />
            ) : (
              <button
                type="button"
                data-testid="chat-title"
                className={`${styles.panel__title} ${styles.panel__titleButton}`}
                onClick={handleStartEditTitle}
                disabled={!activeChat}
                aria-label={`Chat title: ${displayTitle}. Click to edit.`}
                title="Click to rename"
              >
                <span className={styles.panel__titleText}>{displayTitle}</span>
                {activeChat && (
                  <span
                    data-testid="chat-title-edit"
                    className={styles.panel__titleEdit}
                    aria-hidden="true"
                  >
                    Edit
                  </span>
                )}
              </button>
            )}
            {activeChat && (
              <span
                data-testid="chat-project-name"
                className={styles.panel__projectName}
                aria-label={`Project: ${activeChat.project_name}`}
              >
                {activeChat.project_name}
              </span>
            )}
            <label className={styles.panel__model}>
              <span className={styles.panel__modelLabel}>Project</span>
              <select
                data-testid="chat-project-select"
                value={activeProjectId ?? ''}
                onChange={(e) => {
                  setActiveProjectId(Number(e.target.value));
                }}
                disabled={projectsLoading || projects.length === 0}
              >
                {projectsLoading && <option value="">Loading…</option>}
                {!projectsLoading && projects.length === 0 && <option value="">(no projects)</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.is_user_default === 1 ? ' (default)' : ''}
                  </option>
                ))}
              </select>
            </label>
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
