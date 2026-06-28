import { FormEvent, useCallback, useState } from 'react';
import {
  FileAttachmentItem,
  FileAttachmentPicker,
  uploadPendingAttachments,
} from './FileAttachmentPicker';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (text: string, fileIds?: number[]) => void;
  disabled?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  projectId?: number;
  onAttachmentError?: (message: string) => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  error = null,
  onDismissError,
  projectId,
  onAttachmentError,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<FileAttachmentItem[]>([]);

  const handleAttachmentsError = useCallback(
    (message: string) => {
      onAttachmentError?.(message);
    },
    [onAttachmentError],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (projectId === undefined || attachments.length === 0) {
      // No attachments: fire-and-forget so the parent can do async work
      // (network, state updates) without us blocking the form submit.
      onSend(trimmed);
      setValue('');
      return;
    }
    void (async () => {
      try {
        const result = await uploadPendingAttachments(
          projectId,
          attachments,
          (next) => setAttachments(next),
          handleAttachmentsError,
        );
        if (
          result.uploadedIds.length === 0 &&
          attachments.some((a) => a.status === 'failed')
        ) {
          return;
        }
        setAttachments(result.items.filter((a) => a.status === 'uploaded'));
        onSend(trimmed, result.uploadedIds);
        setValue('');
      } catch (err) {
        handleAttachmentsError(
          err instanceof Error ? err.message : 'Upload failed',
        );
      }
    })();
  }

  const anyUploading = attachments.some((a) => a.status === 'uploading');
  const submitDisabled =
    disabled || anyUploading || value.trim().length === 0;

  return (
    <div className={styles.wrapper}>
      {error && (
        <div
          role="alert"
          data-testid="chat-error-banner"
          className={styles.error}
        >
          <span className={styles.error__text}>{error}</span>
          {onDismissError && (
            <button
              type="button"
              data-testid="chat-error-dismiss"
              className={styles.error__dismiss}
              onClick={onDismissError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          )}
        </div>
      )}
      {projectId !== undefined && (
        <FileAttachmentPicker
          projectId={projectId}
          attachments={attachments}
          onChange={setAttachments}
          disabled={disabled}
          onError={handleAttachmentsError}
        />
      )}
      <form
        data-testid="chat-composer"
        className={`${styles.form} glass`}
        onSubmit={handleSubmit}
      >
        <div className={styles.form__field}>
          <label
            htmlFor="message-input"
            className="sr-only"
            style={{ position: 'absolute', left: -9999 }}
          >
            Message
          </label>
          <input
            id="message-input"
            data-testid="chat-composer-input"
            type="text"
            value={value}
            placeholder="Send a message…"
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          data-testid="chat-composer-submit"
          className={styles.send}
          disabled={submitDisabled}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
