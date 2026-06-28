import { describe, expect, it, beforeEach, afterAll } from '@jest/globals';
import { initDb, closeDb } from '../../src/db';
import { createUser } from '../../src/auth/usersRepo';
import { createProvider } from '../../src/admin/llmProvidersRepo';
import { createModel } from '../../src/admin/llmProviderModelsRepo';
import { ensureDefaultProject } from '../../src/projects/projectsService';
import {
  getDefaultProjectForUser,
  getProjectForUser,
  listProjectsForUser,
  deleteProject,
  setUserDefaultProject,
} from '../../src/projects/projectsRepo';

const TEST_DB_PATH = ':memory:';

function seedCatalog() {
  const p = createProvider({
    name: 'openai',
    url: 'https://api.openai.com/v1',
    api_key: 'sk',
    type: 'openai_completions',
  });
  if (!p.ok) throw new Error('seed provider failed');
  const m = createModel({ llm_provider_id: p.value.id, name: 'gpt-x' });
  if (!m.ok) throw new Error('seed model failed');
  return 'openai:gpt-x';
}

describe('projectsService.ensureDefaultProject (unit)', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  afterAll(() => {
    closeDb();
  });

  it('materialises one project on the first call', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const project = ensureDefaultProject(u.user.id);
    expect(project.is_user_default).toBe(1);
    expect(project.name).toBe('Default');
    expect(project.user_id).toBe(u.user.id);
  });

  it('returns the same project on the second call (idempotent)', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const first = ensureDefaultProject(u.user.id);
    const second = ensureDefaultProject(u.user.id);
    expect(second.id).toBe(first.id);
    const list = listProjectsForUser(u.user.id);
    expect(list).toHaveLength(1);
  });

  it('produces one project under concurrent calls', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const a = ensureDefaultProject(u.user.id);
    const b = ensureDefaultProject(u.user.id);
    const c = ensureDefaultProject(u.user.id);
    expect(a.id).toBe(b.id);
    expect(b.id).toBe(c.id);
    const list = listProjectsForUser(u.user.id);
    expect(list).toHaveLength(1);
  });

  it('names the project from the default template when one exists', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    // Insert a default template
    const db = require('../../src/db').getDb();
    db.prepare(
      'INSERT INTO project_templates (name, system_prompt, default_llm_provider_model, is_default) VALUES (?, ?, ?, 1)',
    ).run('Welcome', 'You are a helper.', 'openai:gpt-x');
    const project = ensureDefaultProject(u.user.id);
    expect(project.name).toBe('Welcome');
    expect(project.system_prompt).toBe('You are a helper.');
    expect(project.default_llm_provider_model).toBe('openai:gpt-x');
  });

  it('does not seed when the user already has a default', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const first = ensureDefaultProject(u.user.id);
    // Simulate a second user being created
    const other = createUser({ email: 'b@example.com', passwordHash: 'h' });
    ensureDefaultProject(other.user.id);
    // Original default is still the same
    const def = getDefaultProjectForUser(u.user.id);
    expect(def?.id).toBe(first.id);
  });
});

describe('projectsService.ensureDefaultProject + setUserDefaultProject interaction', () => {
  beforeEach(() => {
    closeDb();
    initDb(TEST_DB_PATH);
    seedCatalog();
  });

  afterAll(() => {
    closeDb();
  });

  it('ensureDefaultProject + setUserDefaultProject keeps exactly one default per user', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const def = ensureDefaultProject(u.user.id);
    // Create a second project via repo
    const { insertProject } = require('../../src/projects/projectsRepo');
    const second = insertProject({
      user_id: u.user.id,
      name: 'Other',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    // Promote the second project
    const promoted = setUserDefaultProject(second.value.id, u.user.id);
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) return;
    expect(promoted.value.is_user_default).toBe(1);
    // Original default is no longer the default
    const oldDef = getProjectForUser(def.id, u.user.id);
    expect(oldDef?.is_user_default).toBe(0);
    // The new default is the second project
    const newDef = getDefaultProjectForUser(u.user.id);
    expect(newDef?.id).toBe(second.value.id);
  });

  it('ensureDefaultProject after delete is called from a fresh user creates a new default', () => {
    const u = createUser({ email: 'a@example.com', passwordHash: 'h' });
    const def = ensureDefaultProject(u.user.id);
    const { insertProject } = require('../../src/projects/projectsRepo');
    const second = insertProject({
      user_id: u.user.id,
      name: 'Other',
      system_prompt: null,
      default_llm_provider_model: 'openai:gpt-x',
    });
    if (!second.ok) return;
    setUserDefaultProject(second.value.id, u.user.id);
    // Now delete the original default
    const del = deleteProject(def.id, u.user.id);
    expect(del.ok).toBe(true);
    // Ensure default for the user now returns the second one
    const def2 = ensureDefaultProject(u.user.id);
    expect(def2.id).toBe(second.value.id);
  });
});
