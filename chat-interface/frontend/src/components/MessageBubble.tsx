import styles from './MessageBubble.module.css';
import type { Message } from '../chat/types';
import FileChip from './FileChip';
import LlmFileAttachmentCard from './LlmFileAttachmentCard';

interface MessageBubbleProps {
  message: Message;
  projectId: number;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function MessageBubble({ message, projectId }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const variant = isUser ? styles['bubble--user'] : styles['bubble--assistant'];
  const fileIds = isUser ? message.file_ids : [];
  return (
    <div
      data-testid="chat-message"
      data-message-id={message.id}
      data-message-role={message.role}
      className={`${styles.bubble} ${variant}`}
    >
      {fileIds.length > 0 && (
        <div
          className={styles.bubble__files}
          data-testid="chat-message-files"
        >
          {fileIds.map((fileId) => (
            <FileChip key={fileId} fileId={fileId} filename={`File #${fileId}`} variant="user" />
          ))}
        </div>
      )}
      <div className={styles.bubble__text}>{message.content}</div>
      {!isUser && message.attachments.length > 0 && (
        <div className={styles.bubble__attachments} data-testid="chat-message-attachments">
          {message.attachments.map((attachment, index) => (
            <LlmFileAttachmentCard
              key={`${attachment.filename}-${index}`}
              attachment={attachment}
              attachmentIndex={index}
              chatId={message.chat_id}
              messageId={message.id}
              projectId={projectId}
            />
          ))}
        </div>
      )}
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
