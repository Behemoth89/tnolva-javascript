import styles from './Sidebar.module.css';
import type { Chat } from '../chat/types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  newChatPending?: boolean;
}

export function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  newChatPending = false,
}: SidebarProps) {
  return (
    <aside
      data-testid="chat-sidebar"
      className={`${styles.sidebar} glass anim-sidebar-slide`}
      aria-label="Chat list"
    >
      <div className={styles.sidebar__header}>
        <h2 className={styles.sidebar__title}>Chats</h2>
        <button
          type="button"
          data-testid="chat-new"
          onClick={onNewChat}
          disabled={newChatPending}
          className={styles.sidebar__new}
          aria-label="New chat"
        >
          {newChatPending ? '…' : '+'}
        </button>
      </div>
      {chats.length === 0 ? (
        <p data-testid="chat-sidebar-empty" className={styles.sidebar__empty}>
          No chats yet.
        </p>
      ) : (
        <ul className={styles.sidebar__list}>
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const label = chat.title && chat.title.length > 0 ? chat.title : '(untitled)';
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  data-testid="sidebar-chat-item"
                  data-chat-id={chat.id}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => onSelectChat(chat.id)}
                  className={`${styles.sidebar__item}${
                    isActive ? ` ${styles['sidebar__item--active']}` : ''
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

export default Sidebar;
