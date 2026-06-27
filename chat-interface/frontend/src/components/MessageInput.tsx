import { FormEvent, useState } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function MessageInput({
  onSend,
  disabled = false,
  error = null,
  onDismissError,
}: MessageInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

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
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
