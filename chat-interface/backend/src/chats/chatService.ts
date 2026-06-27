import {
  createLlmClient,
  isLlmError,
  type LlmClient,
  type LlmClientContext,
  type LLMProviderType,
} from '../llm/client';
import { resolveProviderModel, type ResolvedProvider } from './validation';
import {
  getChatByIdForUser,
  type PublicChat,
} from './chatsRepo';
import {
  insertMessage,
  listMessagesForChat,
  type PublicChatMessage,
} from './chatMessagesRepo';

export interface ChatWithMessages {
  chat: PublicChat;
  messages: PublicChatMessage[];
}

export type SendMessageResult =
  | { kind: 'ok'; value: ChatWithMessages }
  | { kind: 'not_found' }
  | { kind: 'llm_failed'; error: string; chat: ChatWithMessages };

export interface SendMessageOptions {
  providerModelOverride?: string;
  clientFactory?: (type: LLMProviderType) => LlmClient;
  contextOverride?: Partial<LlmClientContext>;
}

const DEFAULT_CLIENT_FACTORY: (type: LLMProviderType) => LlmClient = (type) =>
  createLlmClient(type);

export function getChatWithMessagesForUser(
  chatId: number,
  userId: number,
): ChatWithMessages | null {
  const chat = getChatByIdForUser(chatId, userId);
  if (!chat) {
    return null;
  }
  const messages = listMessagesForChat(chatId);
  return { chat, messages };
}

export function resolveEffectiveProviderModel(
  chat: PublicChat,
  override: string | undefined,
): { ok: true; value: ResolvedProvider } | { ok: false; error: string } {
  const candidate = override ?? chat.default_llm_provider_model;
  return resolveProviderModel(candidate);
}

export async function sendMessage(
  userId: number,
  chatId: number,
  content: string,
  options: SendMessageOptions = {},
): Promise<SendMessageResult> {
  const chat = getChatByIdForUser(chatId, userId);
  if (!chat) {
    return { kind: 'not_found' };
  }
  const providerResolution = resolveEffectiveProviderModel(
    chat,
    options.providerModelOverride,
  );
  if (!providerResolution.ok) {
    return {
      kind: 'llm_failed',
      error: providerResolution.error,
      chat: {
        chat,
        messages: listMessagesForChat(chatId),
      },
    };
  }
  const resolved = providerResolution.value;

  const userMessageProviderModel = `${resolved.providerName}:${resolved.modelName}`;
  insertMessage({
    chat_id: chatId,
    role: 'user',
    content,
    provider_model: userMessageProviderModel,
  });

  const client = (options.clientFactory ?? DEFAULT_CLIENT_FACTORY)(resolved.type);
  const context: LlmClientContext = {
    url: resolved.url,
    apiKey: resolved.apiKey,
    ...(options.contextOverride?.signal
      ? { signal: options.contextOverride.signal }
      : {}),
    ...(options.contextOverride?.fetchImpl
      ? { fetchImpl: options.contextOverride.fetchImpl }
      : {}),
  };

  const history = listMessagesForChat(chatId);
  const llmMessages = history.map((m) => ({ role: m.role, content: m.content }));

  try {
    const response = await client.complete(
      {
        model: resolved.modelName,
        messages: llmMessages,
      },
      context,
    );
    insertMessage({
      chat_id: chatId,
      role: 'assistant',
      content: response.text,
      provider_model: `${resolved.providerName}:${resolved.modelName}`,
    });
    const finalChat = getChatByIdForUser(chatId, userId);
    if (!finalChat) {
      return { kind: 'not_found' };
    }
    return {
      kind: 'ok',
      value: {
        chat: finalChat,
        messages: listMessagesForChat(chatId),
      },
    };
  } catch (err) {
    const errorMessage = isLlmError(err)
      ? `Upstream LLM failed: ${err.kind}`
      : `Upstream LLM failed: unknown`;
    return {
      kind: 'llm_failed',
      error: errorMessage,
      chat: {
        chat: getChatByIdForUser(chatId, userId) ?? chat,
        messages: listMessagesForChat(chatId),
      },
    };
  }
}
