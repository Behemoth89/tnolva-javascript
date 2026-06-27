import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /api/health (integration)', () => {
  const app = createApp();

  it('returns 200 with the expected JSON body', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      }),
    );
    expect(Number.isNaN(new Date(res.body.timestamp).getTime())).toBe(false);
  });

  it('POST /api/health returns 405 with Allow: GET', async () => {
    const res = await request(app).post('/api/health');
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe('GET');
  });
});
