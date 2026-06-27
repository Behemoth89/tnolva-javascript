import type { Chat, Message } from './types';

// TODO(chat-backend): replace with real fetch from /api/chats
export const seedChats: Chat[] = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'design-review', title: 'Design review' },
  { id: 'roadmap', title: 'Roadmap notes' },
];

// TODO(chat-backend): replace with real fetch from /api/chats/:id/messages
export const seedMessages: Message[] = [
  {
    id: 'm-welcome-1',
    chatId: 'welcome',
    author: 'assistant',
    text: 'Hi! This is a local mock chat — the design system is wired up, the real backend will plug in here.',
  },
  {
    id: 'm-welcome-2',
    chatId: 'welcome',
    author: 'user',
    text: 'Got it. The glass effect looks great.',
  },
  {
    id: 'm-welcome-3',
    chatId: 'welcome',
    author: 'assistant',
    text: 'Thanks — sidebar and input bar are the only two surfaces with backdrop blur.',
  },
];

const cannedReplies = [
  "That's noted — the design system is doing the heavy lifting.",
  'Sounds good. Anything else you want to tweak?',
  'Logged. The cascade animation will play for new bubbles only.',
  'Acknowledged. The cursor glow is rAF-throttled.',
];

export function pickCannedReply(): string {
  const idx = Math.floor(Math.random() * cannedReplies.length);
  return cannedReplies[idx] ?? cannedReplies[0]!;
}
