import { useState } from 'react';
import type { AssistantAttachment } from '../chat/types';
import {
  type ProjectFile,
  downloadProjectFileUrl,
  saveLlmGeneratedFile,
} from '../api/projectFiles';
import styles from './LlmFileAttachmentCard.module.css';

export interface LlmFileAttachmentCardProps {
  attachment: AssistantAttachment;
  attachmentIndex: number;
  chatId: number;
  messageId: number;
  projectId: number;
}

type State =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; file: ProjectFile }
  | { kind: 'error'; message: string };

export function LlmFileAttachmentCard({
  attachment,
  attachmentIndex,
  chatId,
  messageId,
  projectId,
}: LlmFileAttachmentCardProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function handleSave() {
    setState({ kind: 'saving' });
    try {
      const file = await saveLlmGeneratedFile(projectId, {
        chat_id: chatId,
        message_id: messageId,
        attachment_index: attachmentIndex,
      });
      setState({ kind: 'saved', file });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to save file',
      });
    }
  }

  return (
    <div
      className={styles.card}
      data-testid="llm-file-attachment-card"
      data-attachment-index={attachmentIndex}
    >
      <span className={styles.title} title={attachment.filename}>
        {attachment.filename}
      </span>
      <span className={styles.mime}>{attachment.mime_type}</span>
      <div className={styles.actions}>
        {state.kind === 'idle' && (
          <button
            type="button"
            className={styles.actionButton}
            data-testid="llm-file-attachment-save"
            onClick={() => {
              void handleSave();
            }}
          >
            Add to project files
          </button>
        )}
        {state.kind === 'saving' && (
          <button
            type="button"
            className={styles.actionButton}
            disabled
            data-testid="llm-file-attachment-saving"
          >
            Saving…
          </button>
        )}
        {state.kind === 'saved' && (
          <>
            <span
              className={styles.badge}
              data-testid="llm-file-attachment-saved-badge"
            >
              Saved
            </span>
            <a
              href={downloadProjectFileUrl(state.file.id)}
              className={styles.downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="llm-file-attachment-download"
              onClick={(event) => {
                event.preventDefault();
                void fetch(downloadProjectFileUrl(state.file.id), {
                  credentials: 'include',
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      const body = (await res.json().catch(() => ({}))) as { error?: string };
                      throw new Error(body.error ?? `Request failed with status ${res.status}`);
                    }
                    return res.blob();
                  })
                  .then((blob) => {
                    const objectUrl = URL.createObjectURL(blob);
                    window.open(objectUrl, '_blank', 'noopener,noreferrer');
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
                  })
                  .catch(() => {
                    // ignore
                  });
              }}
            >
              Download
            </a>
          </>
        )}
        {state.kind === 'error' && (
          <button
            type="button"
            className={styles.actionButton}
            data-testid="llm-file-attachment-save"
            onClick={() => {
              void handleSave();
            }}
          >
            Retry
          </button>
        )}
      </div>
      {state.kind === 'error' && (
        <span className={styles.error} data-testid="llm-file-attachment-error">
          {state.message}
        </span>
      )}
    </div>
  );
}

export default LlmFileAttachmentCard;
