import { FormEvent, useState } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <form
      data-testid="message-input-form"
      className={`${styles.form} glass`}
      onSubmit={handleSubmit}
    >
      <div className={styles.form__field}>
        <label htmlFor="message-input" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
          Message
        </label>
        <input
          id="message-input"
          data-testid="message-input"
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
        data-testid="message-send"
        className={styles.send}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
      >
        ➤
      </button>
    </form>
  );
}

export default MessageInput;
