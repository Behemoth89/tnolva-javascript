import { initDb, closeDb } from '../../src/db';
import {
  REDACTED_API_KEY,
  createProvider,
  deleteProvider,
  getProviderById,
  listProviders,
  updateProvider,
} from '../../src/admin/llmProvidersRepo';
import { createModel, listModels } from '../../src/admin/llmProviderModelsRepo';

const TEST_DB_PATH = ':memory:';

describe('llmProvidersRepo (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
  });

  afterAll(() => {
    closeDb();
  });

  it('creates, lists, gets, updates, and deletes a provider; api_key is redacted', () => {
    const created = createProvider({
      name: 'openai-prod',
      url: 'https://api.openai.com/v1',
      api_key: 'sk-secret-123',
      type: 'openai_completions',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.name).toBe('openai-prod');
    expect(created.value.api_key).toBe(REDACTED_API_KEY);
    expect(created.value.type).toBe('openai_completions');

    const list = listProviders();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('openai-prod');
    expect(list[0].api_key).toBe(REDACTED_API_KEY);

    const fetched = getProviderById(created.value.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.api_key).toBe(REDACTED_API_KEY);

    const updated = updateProvider(created.value.id, { name: 'openai-renamed' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.name).toBe('openai-renamed');
    expect(updated.value.api_key).toBe(REDACTED_API_KEY);

    const deleted = deleteProvider(created.value.id);
    expect(deleted.ok).toBe(true);
    expect(listProviders()).toHaveLength(0);
    expect(getProviderById(created.value.id)).toBeNull();
  });

  it('returns a conflict when creating with a duplicate name', () => {
    createProvider({
      name: 'dup',
      url: 'https://example.com',
      api_key: 'k',
      type: 'anthropic',
    });
    const second = createProvider({
      name: 'dup',
      url: 'https://example.com',
      api_key: 'k2',
      type: 'anthropic',
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.code).toBe('conflict');
  });

  it('returns not_found for get/update/delete on missing id', () => {
    expect(getProviderById(999)).toBeNull();
    const update = updateProvider(999, { name: 'x' });
    expect(update.ok).toBe(false);
    if (update.ok) return;
    expect(update.code).toBe('not_found');
    const del = deleteProvider(999);
    expect(del.ok).toBe(false);
    if (del.ok) return;
    expect(del.code).toBe('not_found');
  });

  it('update preserves the existing api_key when omitted', () => {
    const created = createProvider({
      name: 'preserve',
      url: 'https://example.com',
      api_key: 'original-secret',
      type: 'openai_responses',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const updated = updateProvider(created.value.id, { name: 'preserve-2' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    const fetched = getProviderById(created.value.id);
    expect(fetched?.name).toBe('preserve-2');
    expect(fetched?.api_key).toBe(REDACTED_API_KEY);
  });

  it('deleting a provider cascades to its models', () => {
    const provider = createProvider({
      name: 'cascade',
      url: 'https://example.com',
      api_key: 'k',
      type: 'anthropic',
    });
    expect(provider.ok).toBe(true);
    if (!provider.ok) return;
    createModel({ llm_provider_id: provider.value.id, name: 'm1' });
    createModel({ llm_provider_id: provider.value.id, name: 'm2' });
    expect(listModels()).toHaveLength(2);
    const del = deleteProvider(provider.value.id);
    expect(del.ok).toBe(true);
    expect(listModels()).toHaveLength(0);
  });
});
