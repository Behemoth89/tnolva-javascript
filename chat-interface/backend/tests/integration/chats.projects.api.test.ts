import request from 'supertest';
import { newTestApp } from '../testDb';

async function seedAdmin() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-projects@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin };
}

async function seedAdminAndUser() {
  const { app, admin } = await seedAdmin();
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'user-projects@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin, user };
}

async function seedCatalog(admin: request.Agent) {
  await admin
    .post('/api/admin/llm-providers')
    .send({
      name: 'openai',
      url: 'https://api.openai.com/v1',
      api_key: 'sk-secret-123',
      type: 'openai_completions',
    })
    .expect(201);
  const list = await admin.get('/api/admin/llm-providers');
  const providerId = (list.body as Array<{ id: number; name: string }>).find(
    (p) => p.name === 'openai',
  )?.id;
  if (!providerId) {
    throw new Error('seed catalog failed');
  }
  await admin
    .post('/api/admin/llm-provider-models')
    .send({ llm_provider_id: providerId, name: 'gpt-x' })
    .expect(201);
}

describe('POST /api/chats (integration) with project_id', () => {
  it('places the chat in the user default when project_id is omitted (lazy seed)', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const defList = await user.get('/api/projects');
    expect(defList.status).toBe(200);
    const defaultProject = (defList.body as Array<{ is_user_default: number; id: number }>).find(
      (p) => p.is_user_default === 1,
    );
    expect(defaultProject).toBeDefined();
    const res = await user
      .post('/api/chats')
      .send({ title: 'no pid', default_llm_provider_model: 'openai:gpt-x' });
    expect(res.status).toBe(201);
    expect(res.body.project_id).toBe(defaultProject?.id);
    expect(res.body.project_name).toBe('Default');
  });

  it('places the chat in the explicit project_id when owned by the caller', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/projects')
      .send({ name: 'Research', default_llm_provider_model: 'openai:gpt-x' });
    expect(create.status).toBe(201);
    const projectId = create.body.id as number;
    const res = await user
      .post('/api/chats')
      .send({
        title: 'mine',
        default_llm_provider_model: 'openai:gpt-x',
        project_id: projectId,
      });
    expect(res.status).toBe(201);
    expect(res.body.project_id).toBe(projectId);
    expect(res.body.project_name).toBe('Research');
  });

  it('returns 404 when project_id is owned by another user', async () => {
    const { app, admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    // admin creates a project (the first one, which is the user default; let's just create another)
    const adminProject = await admin
      .post('/api/projects')
      .send({ name: 'Admins', default_llm_provider_model: 'openai:gpt-x' });
    // The admin's default project exists; let's use that
    const adminDefaults = await admin.get('/api/projects');
    const adminDefault = (adminDefaults.body as Array<{ is_user_default: number; id: number }>).find(
      (p) => p.is_user_default === 1,
    );
    expect(adminDefault).toBeDefined();
    const targetId = adminDefault?.id ?? adminProject.body.id;
    const res = await user
      .post('/api/chats')
      .send({
        title: 'mine',
        default_llm_provider_model: 'openai:gpt-x',
        project_id: targetId,
      });
    expect(res.status).toBe(404);
    expect(app);
  });

  it('returns 400 for missing body', async () => {
    const { user } = await seedAdminAndUser();
    const res = await user.post('/api/chats').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid project_id type', async () => {
    const { user } = await seedAdminAndUser();
    const res = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x', project_id: 'not-a-number' });
    expect(res.status).toBe(400);
  });
});
