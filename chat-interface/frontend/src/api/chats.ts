export interface Chat {
  id: number;
  user_id: number;
  project_id: number;
  project_name: string;
  title: string | null;
  default_llm_provider_model: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  provider_model: string;
  created_at: string;
}

export interface ChatWithMessages {
  chat: Chat;
  messages: ChatMessage[];
}

export interface CreateChatInput {
  title?: string;
  default_llm_provider_model: string;
  project_id?: number;
}

export interface UpdateChatInput {
  title?: string | null;
  default_llm_provider_model?: string;
}

export interface SendMessageInput {
  content: string;
  provider_model?: string;
}

export interface LlmFailure {
  ok: false;
  error: string;
  chat: ChatWithMessages;
}

export type SendMessageResult =
  | { ok: true; value: ChatWithMessages }
  | LlmFailure;

export interface AvailableModel {
  provider_model: string;
  provider_name: string;
  model_name: string;
  type: string;
}

const JSON_HEADERS: HeadersInit = {
  'content-type': 'application/json',
};

const FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // fall through
  }
  return `Request failed with status ${res.status}`;
}

async function request<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    ...FETCH_OPTIONS,
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return (await res.json()) as T;
}

export async function listChats(): Promise<Chat[]> {
  return request<Chat[]>('/api/chats');
}

export async function listAvailableModels(): Promise<AvailableModel[]> {
  return request<AvailableModel[]>('/api/chats/models');
}

export async function createChat(input: CreateChatInput): Promise<Chat> {
  return request<Chat>('/api/chats', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getChat(id: number): Promise<ChatWithMessages> {
  return request<ChatWithMessages>(`/api/chats/${id}`);
}

export async function updateChat(
  id: number,
  input: UpdateChatInput,
): Promise<Chat> {
  return request<Chat>(`/api/chats/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteChat(id: number): Promise<void> {
  const res = await fetch(`/api/chats/${id}`, {
    ...FETCH_OPTIONS,
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseError(res));
  }
}

export async function sendMessage(
  chatId: number,
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const res = await fetch(`/api/chats/${chatId}/messages`, {
    ...FETCH_OPTIONS,
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (res.status === 502) {
    const data = (await res.json()) as {
      error?: string;
      chat?: ChatWithMessages;
    };
    return {
      ok: false,
      error: data.error ?? 'Upstream LLM failed',
      chat: data.chat ?? { chat: {} as Chat, messages: [] },
    };
  }
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const value = (await res.json()) as ChatWithMessages;
  return { ok: true, value };
}
