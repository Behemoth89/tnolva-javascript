import { describe, expect, it, beforeEach, afterAll } from '@jest/globals';
import { initDb, closeDb } from '../../src/db';
import {
  createProvider,
} from '../../src/admin/llmProvidersRepo';
import { createModel } from '../../src/admin/llmProviderModelsRepo';
import { createUser } from '../../src/auth/usersRepo';
import {
  getChatWithMessagesForUser,
  resolveEffectiveProviderModel,
  sendMessage,
} from '../../src/chats/chatService';
import { createChat, getChatByIdForUser } from '../../src/chats/chatsRepo';
import { listMessagesForChat } from '../../src/chats/chatMessagesRepo';
import {
  LlmError,
  type LlmClient,
  type LLMProviderType,
} from '../../src/llm/client';

const TEST_DB_PATH = ':memory:';

function seedCatalog() {
  const openai = createProvider({
    name: 'openai',
    url: 'https://api.openai.com/v1',
    api_key: 'sk-secret',
    type: 'openai_completions',
  });
  if (!openai.ok) {
    throw new Error('seed openai failed');
  }
  createModel({ llm_provider_id: openai.value.id, name: 'gpt-x' });
  const anthropic = createProvider({
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1',
    api_key: 'sk-ant',
    type: 'anthropic',
  });
  if (!anthropic.ok) {
    throw new Error('seed anthropic failed');
  }
  createModel({ llm_provider_id: anthropic.value.id, name: 'claude-x' });
}

function seedUser() {
  const result = createUser({ email: 'svc@example.com', passwordHash: 'h' });
  return result.user.id;
}

function seedChat(userId: number, providerModel: string) {
  const created = createChat({
    user_id: userId,
    title: 'svc',
    default_llm_provider_model: providerModel,
  });
  if (!created.ok) {
    throw new Error('seed chat failed');
  }
  return created.value.id;
}

function fixedClient(behavior: (req: unknown) => 'ok' | 'fail'): LlmClient {
  return {
    async complete(req) {
      const result = behavior(req);
      if (result === 'fail') {
        throw new LlmError({ kind: 'http', status: 500, message: 'boom' });
      }
      return {
        text: 'hello back',
        usage: { inputTokens: 1, outputTokens: 2 },
        finishReason: 'stop',
        raw: { ok: true },
      };
    },
  };
}

function factoryOf(client: LlmClient) {
  return (_type: LLMProviderType) => client;
}

describe('chatService.sendMessage (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  afterAll(() => {
    closeDb();
  });

  it('persists the user message, dispatches, persists the assistant reply, and returns the updated chat', async () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const client = fixedClient(() => 'ok');
    const result = await sendMessage(userId, chatId, 'hi there', {
      clientFactory: factoryOf(client),
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.value.messages).toHaveLength(2);
    expect(result.value.messages[0]?.role).toBe('user');
    expect(result.value.messages[0]?.content).toBe('hi there');
    expect(result.value.messages[0]?.provider_model).toBe('openai:gpt-x');
    expect(result.value.messages[1]?.role).toBe('assistant');
    expect(result.value.messages[1]?.content).toBe('hello back');
    expect(result.value.messages[1]?.provider_model).toBe('openai:gpt-x');
  });

  it('persists the user message but not the assistant when the LLM throws; returns llm_failed with the partial chat', async () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const client = fixedClient(() => 'fail');
    const result = await sendMessage(userId, chatId, 'help', {
      clientFactory: factoryOf(client),
    });
    expect(result.kind).toBe('llm_failed');
    if (result.kind !== 'llm_failed') return;
    expect(result.error).toMatch(/Upstream LLM failed/);
    expect(result.chat.messages).toHaveLength(1);
    expect(result.chat.messages[0]?.role).toBe('user');
    expect(result.chat.messages[0]?.content).toBe('help');
    const stored = listMessagesForChat(chatId);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.role).toBe('user');
  });

  it('uses the per-message provider_model override when provided and persists it on both rows', async () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const client = fixedClient(() => 'ok');
    const result = await sendMessage(userId, chatId, 'hi', {
      clientFactory: factoryOf(client),
      providerModelOverride: 'anthropic:claude-x',
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.value.messages[0]?.provider_model).toBe('anthropic:claude-x');
    expect(result.value.messages[1]?.provider_model).toBe('anthropic:claude-x');
    const chat = getChatByIdForUser(chatId, userId);
    expect(chat?.default_llm_provider_model).toBe('openai:gpt-x');
  });

  it('returns not_found when the chat does not belong to the user', async () => {
    const userA = seedUser();
    const chatId = seedChat(userA, 'openai:gpt-x');
    const other = createUser({ email: 'other@example.com', passwordHash: 'h' });
    const result = await sendMessage(other.user.id, chatId, 'hi', {
      clientFactory: factoryOf(fixedClient(() => 'ok')),
    });
    expect(result.kind).toBe('not_found');
  });

  it('returns llm_failed when the resolved provider_model is not in the catalog', async () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const result = await sendMessage(userId, chatId, 'hi', {
      providerModelOverride: 'mystery:model',
      clientFactory: factoryOf(fixedClient(() => 'ok')),
    });
    expect(result.kind).toBe('llm_failed');
    if (result.kind !== 'llm_failed') return;
    expect(result.error).toMatch(/Unknown provider|not registered/);
    expect(result.chat.messages).toHaveLength(0);
  });
});

describe('resolveEffectiveProviderModel', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  it('uses the chat default when no override is given', () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const chat = getChatByIdForUser(chatId, userId);
    expect(chat).not.toBeNull();
    if (!chat) return;
    const resolved = resolveEffectiveProviderModel(chat, undefined);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.providerName).toBe('openai');
    expect(resolved.value.modelName).toBe('gpt-x');
  });

  it('uses the override when given', () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const chat = getChatByIdForUser(chatId, userId);
    expect(chat).not.toBeNull();
    if (!chat) return;
    const resolved = resolveEffectiveProviderModel(chat, 'anthropic:claude-x');
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.providerName).toBe('anthropic');
  });
});

describe('getChatWithMessagesForUser', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  it('returns null for a non-owned chat id', () => {
    const userA = seedUser();
    const chatId = seedChat(userA, 'openai:gpt-x');
    const userB = createUser({ email: 'b@example.com', passwordHash: 'h' });
    const result = getChatWithMessagesForUser(chatId, userB.user.id);
    expect(result).toBeNull();
  });

  it('returns the chat and an empty messages array for an owned chat with no messages', () => {
    const userId = seedUser();
    const chatId = seedChat(userId, 'openai:gpt-x');
    const result = getChatWithMessagesForUser(chatId, userId);
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.chat.id).toBe(chatId);
    expect(result.messages).toEqual([]);
  });
});
