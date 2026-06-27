import styles from './Sidebar.module.css';
import type { Chat } from '../chat/types';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
}

export function Sidebar({ chats, activeChatId, onSelectChat }: SidebarProps) {
  return (
    <aside
      data-testid="sidebar"
      className={`${styles.sidebar} glass anim-sidebar-slide`}
      aria-label="Chat list"
    >
      <h2 className={styles.sidebar__title}>Chats</h2>
      <ul className={styles.sidebar__list}>
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId;
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
                {chat.title}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;
