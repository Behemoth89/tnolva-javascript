import { initDb, closeDb } from '../../src/db';
import { createProvider } from '../../src/admin/llmProvidersRepo';
import {
  createModel,
  deleteModel,
  getModelById,
  listModels,
  updateModel,
} from '../../src/admin/llmProviderModelsRepo';

const TEST_DB_PATH = ':memory:';

function seedProvider(name: string) {
  const result = createProvider({
    name,
    url: 'https://example.com',
    api_key: 'k',
    type: 'openai_completions',
  });
  if (!result.ok) {
    throw new Error('seed failed');
  }
  return result.value;
}

describe('llmProviderModelsRepo (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
  });

  afterAll(() => {
    closeDb();
  });

  it('creates, lists (unfiltered and filtered), gets, updates, and deletes a model', () => {
    const p1 = seedProvider('p1');
    const p2 = seedProvider('p2');
    const m1 = createModel({ llm_provider_id: p1.id, name: 'gpt-4o' });
    expect(m1.ok).toBe(true);
    if (!m1.ok) return;
    const m2 = createModel({ llm_provider_id: p2.id, name: 'claude-3' });
    expect(m2.ok).toBe(true);
    if (!m2.ok) return;

    expect(listModels()).toHaveLength(2);
    expect(listModels(p1.id)).toHaveLength(1);
    expect(listModels(p1.id)[0].name).toBe('gpt-4o');

    const fetched = getModelById(m1.value.id);
    expect(fetched?.name).toBe('gpt-4o');

    const updated = updateModel(m1.value.id, { name: 'gpt-4o-mini' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.name).toBe('gpt-4o-mini');

    const del = deleteModel(m1.value.id);
    expect(del.ok).toBe(true);
    expect(listModels()).toHaveLength(1);
  });

  it('returns conflict when creating a duplicate name on the same provider', () => {
    const p = seedProvider('p');
    createModel({ llm_provider_id: p.id, name: 'dup' });
    const second = createModel({ llm_provider_id: p.id, name: 'dup' });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.code).toBe('conflict');
  });

  it('allows the same model name on different providers', () => {
    const p1 = seedProvider('p1');
    const p2 = seedProvider('p2');
    const a = createModel({ llm_provider_id: p1.id, name: 'shared' });
    const b = createModel({ llm_provider_id: p2.id, name: 'shared' });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it('rejects create with a nonexistent llm_provider_id', () => {
    const result = createModel({ llm_provider_id: 999, name: 'orphan' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
  });

  it('returns not_found for get/update/delete on missing id', () => {
    expect(getModelById(999)).toBeNull();
    const update = updateModel(999, { name: 'x' });
    expect(update.ok).toBe(false);
    if (update.ok) return;
    expect(update.code).toBe('not_found');
    const del = deleteModel(999);
    expect(del.ok).toBe(false);
    if (del.ok) return;
    expect(del.code).toBe('not_found');
  });

  it('updateModel rejects a nonexistent llm_provider_id', () => {
    const p = seedProvider('p');
    const m = createModel({ llm_provider_id: p.id, name: 'm' });
    expect(m.ok).toBe(true);
    if (!m.ok) return;
    const result = updateModel(m.value.id, { llm_provider_id: 999 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
  });
});
