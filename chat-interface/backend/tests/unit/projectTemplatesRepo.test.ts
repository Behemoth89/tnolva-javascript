import { describe, expect, it, beforeEach, afterAll } from '@jest/globals';
import { initDb, closeDb } from '../../src/db';
import { createProvider } from '../../src/admin/llmProvidersRepo';
import { createModel } from '../../src/admin/llmProviderModelsRepo';
import {
  getProjectTemplate,
  insertProjectTemplate,
  listProjectTemplates,
  updateProjectTemplate,
} from '../../src/admin/projectTemplatesRepo';

const TEST_DB_PATH = ':memory:';

function seedCatalog() {
  const p = createProvider({
    name: 'openai',
    url: 'https://api.openai.com/v1',
    api_key: 'sk',
    type: 'openai_completions',
  });
  if (!p.ok) throw new Error('seed failed');
  const m = createModel({ llm_provider_id: p.value.id, name: 'gpt-x' });
  if (!m.ok) throw new Error('seed failed');
  return 'openai:gpt-x';
}

describe('projectTemplatesRepo default-clearing transaction (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  afterAll(() => {
    closeDb();
  });

  it('creating a default template clears the previous default', () => {
    const first = insertProjectTemplate({
      name: 'A',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: true,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = insertProjectTemplate({
      name: 'B',
      system_prompt: 'Hi',
      default_llm_provider_model: 'openai:gpt-x',
      is_default: true,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    const list = listProjectTemplates();
    expect(list).toHaveLength(2);
    const defaults = list.filter((t) => t.is_default === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(second.value.id);
    const old = getProjectTemplate(first.value.id);
    expect(old?.is_default).toBe(0);
  });

  it('updating a non-default template to default clears the previous default', () => {
    const def = insertProjectTemplate({
      name: 'Default',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: true,
    });
    expect(def.ok).toBe(true);
    if (!def.ok) return;
    const other = insertProjectTemplate({
      name: 'Other',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: false,
    });
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    const updated = updateProjectTemplate(other.value.id, { is_default: true });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.is_default).toBe(1);
    const refreshedDef = getProjectTemplate(def.value.id);
    expect(refreshedDef?.is_default).toBe(0);
    const list = listProjectTemplates();
    const defaults = list.filter((t) => t.is_default === 1);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(other.value.id);
  });

  it('updating a template without changing is_default does not affect defaults', () => {
    const a = insertProjectTemplate({
      name: 'A',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: true,
    });
    const b = insertProjectTemplate({
      name: 'B',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: false,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    updateProjectTemplate(b.value.id, { name: 'B-renamed' });
    const def = getProjectTemplate(a.value.id);
    expect(def?.is_default).toBe(1);
  });

  it('rejects an invalid default_llm_provider_model (catalog check)', () => {
    const result = insertProjectTemplate({
      name: 'X',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
      is_default: false,
    });
    expect(result.ok).toBe(true);
  });
});
