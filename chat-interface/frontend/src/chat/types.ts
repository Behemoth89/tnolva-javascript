export type Role = 'user' | 'assistant';

export interface Chat {
  id: number;
  user_id: number;
  project_id: number;
  project_name: string;
  title: string | null;
  default_llm_provider_model: string;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  role: Role;
  content: string;
  provider_model: string;
  created_at: string;
}
