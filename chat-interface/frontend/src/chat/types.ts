export type Role = 'user' | 'assistant';

export interface Chat {
  id: string;
  title: string;
}

export interface Message {
  id: string;
  chatId: string;
  author: Role;
  text: string;
}
