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
  getSystemPromptForChat,
  type PublicChat,
} from './chatsRepo';
import {
  insertMessage,
  listMessagesForChat,
  type PublicChatMessage,
} from './chatMessagesRepo';
import { getProjectFileAccess } from '../projects/container';
import {
  attachFileToMessage,
  getProjectFileRaw,
  setMessageFirstFile,
} from '../projects/projectFilesRepo';

export interface ChatWithMessages {
  chat: PublicChat;
  messages: PublicChatMessage[];
}

export type SendMessageResult =
  | { kind: 'ok'; value: ChatWithMessages }
  | { kind: 'not_found' }
  | { kind: 'file_not_found'; chat: ChatWithMessages; missingFileIds: number[] }
  | { kind: 'llm_failed'; error: string; chat: ChatWithMessages };

export interface SendMessageOptions {
  providerModelOverride?: string;
  clientFactory?: (type: LLMProviderType) => LlmClient;
  contextOverride?: Partial<LlmClientContext>;
  fileIds?: number[];
  projectFileAccessFactory?: () => ReturnType<typeof getProjectFileAccess>;
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

function validateFileIdsForChat(
  fileIds: number[],
  projectId: number,
): { ok: true } | { ok: false; missing: number[] } {
  const missing: number[] = [];
  for (const id of fileIds) {
    const row = getProjectFileRaw(id);
    if (!row || row.project_id !== projectId) {
      missing.push(id);
    }
  }
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true };
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

  if (options.fileIds && options.fileIds.length > 0) {
    const validation = validateFileIdsForChat(options.fileIds, chat.project_id);
    if (!validation.ok) {
      return {
        kind: 'file_not_found',
        chat: {
          chat,
          messages: listMessagesForChat(chatId),
        },
        missingFileIds: validation.missing,
      };
    }
  }

  const userMessage = insertMessage({
    chat_id: chatId,
    role: 'user',
    content,
    provider_model: userMessageProviderModel,
  });

  if (options.fileIds && options.fileIds.length > 0) {
    setMessageFirstFile({
      messageId: userMessage.id,
      fileId: options.fileIds[0] ?? null,
    });
    options.fileIds.forEach((id, position) => {
      attachFileToMessage({ messageId: userMessage.id, fileId: id, position });
    });
  }

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
  const systemPrompt = getSystemPromptForChat(chatId);

  const projectFileAccess = options.projectFileAccessFactory
    ? options.projectFileAccessFactory()
    : getProjectFileAccess();
  const projectFiles = await projectFileAccess.resolveForLlm({
    projectId: chat.project_id,
    chatId,
    userMessage: content,
  });

  try {
    const response = await client.complete(
      {
        model: resolved.modelName,
        messages: llmMessages,
        system: systemPrompt,
        projectFiles,
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
