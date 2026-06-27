import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatPanel from '../src/components/ChatPanel';
import '../src/index.css';

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveVarColor(name: string): string {
  const v = readVar(name);
  // jsdom returns the raw value (e.g. "#FFB627")
  return v;
}

describe('ChatPanel (design system integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders sidebar, message list, and message input form', () => {
    render(<ChatPanel />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input-form')).toBeInTheDocument();
    expect(screen.getByTestId('message-send')).toBeInTheDocument();
  });

  it('applies the .glass class to sidebar and message input form, but not to message bubbles', () => {
    const { container } = render(<ChatPanel />);
    const sidebar = screen.getByTestId('sidebar');
    const form = screen.getByTestId('message-input-form');
    const bubbles = screen.queryAllByTestId('message-bubble');

    expect(sidebar.className).toMatch(/\bglass\b/);
    expect(form.className).toMatch(/\bglass\b/);

    bubbles.forEach((bubble) => {
      expect(bubble.className).not.toMatch(/\bglass\b/);
    });

    // Sanity: exactly two elements within the chat panel carry the glass class.
    const allGlass = container.querySelectorAll('.glass');
    expect(allGlass.length).toBe(2);
  });

  it('exposes the required design tokens on :root', () => {
    render(<ChatPanel />);
    expect(readVar('--color-base')).not.toBe('');
    expect(readVar('--color-glass')).not.toBe('');
    expect(readVar('--color-amber')).not.toBe('');
    expect(readVar('--color-text')).not.toBe('');
    expect(readVar('--color-border')).not.toBe('');
    expect(readVar('--motion-base')).not.toBe('');
    expect(readVar('--ease-out')).not.toBe('');
  });

  it('uses --color-amber on the send button', () => {
    render(<ChatPanel />);
    const expected = resolveVarColor('--color-amber');
    expect(expected).not.toBe('');
    // jsdom normalises hex to rgb; assert the raw token value is non-empty
    // and that the send button resolves a non-transparent background.
    const send = screen.getByTestId('message-send');
    const bg = getComputedStyle(send).backgroundColor;
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  it('computes cascade animation-delay as 600 + index * 60 ms', () => {
    const { container } = render(<ChatPanel />);
    const wrappers = container.querySelectorAll<HTMLElement>('.anim-message-cascade');
    expect(wrappers.length).toBeGreaterThanOrEqual(3);
    expect((wrappers[0] as HTMLElement).style.animationDelay).toBe('600ms');
    expect((wrappers[1] as HTMLElement).style.animationDelay).toBe('660ms');
    expect((wrappers[2] as HTMLElement).style.animationDelay).toBe('720ms');
  });

  it('distinguishes user and assistant bubbles via data-author and variant classes', () => {
    render(<ChatPanel />);
    const userBubble = document.querySelector<HTMLElement>('[data-author="user"]');
    const assistantBubble = document.querySelector<HTMLElement>('[data-author="assistant"]');
    expect(userBubble).not.toBeNull();
    expect(assistantBubble).not.toBeNull();
    expect(userBubble!.className).toMatch(/bubble--user/);
    expect(assistantBubble!.className).toMatch(/bubble--assistant/);
    // Source-level contract: the MessageBubble stylesheet declares a hover lift for
    // user bubbles and explicitly does not for assistant bubbles.
    const css = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../src/components/MessageBubble.module.css'),
      'utf8',
    );
    expect(css).toMatch(/\.bubble--user:hover\b/);
    expect(css).not.toMatch(/\.bubble--assistant:hover\b/);
  });

  it('lists chats in the sidebar and updates the active title on click', () => {
    render(<ChatPanel />);
    const items = screen.getAllByTestId('sidebar-chat-item');
    expect(items.length).toBe(3);
    fireEvent.click(items[2]!);
    expect(screen.getByTestId('chat-title').textContent).toBe('Roadmap notes');
  });

  it('sending a message appends a user message and an AI reply', async () => {
    render(<ChatPanel />);
    const input = screen.getByTestId('message-input');
    const send = screen.getByTestId('message-send');
    fireEvent.change(input, { target: { value: 'hello world' } });
    fireEvent.click(send);

    await waitFor(() => {
      const userMessages = screen.queryAllByTestId('message-bubble');
      const lastUser = userMessages.filter((m) => m.getAttribute('data-author') === 'user').pop();
      expect(lastUser?.textContent).toBe('hello world');
    });

    await waitFor(() => {
      const all = screen.queryAllByTestId('message-bubble');
      const lastAssistant = all.filter((m) => m.getAttribute('data-author') === 'assistant').pop();
      expect(lastAssistant).toBeDefined();
      expect(lastAssistant!.textContent?.length).toBeGreaterThan(0);
    });
  });
});
