import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Company Switching (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test data for multi-company user
  const testUser = {
    email: `switch${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Switch',
    lastName: 'Test',
  };

  let authToken: string;
  let company1Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    // Register user with first company
    const registerResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        companyName: 'Switch Company 1',
      });

    authToken = registerResponse.body.accessToken;
    company1Id = registerResponse.body.user.companies[0].companyId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/switch-company', () => {
    it('should reject switch without authorization', async () => {
      await request(server)
        .post('/api/v1/auth/switch-company')
        .send({ companyId: company1Id })
        .expect(401);
    });

    it('should reject switch to company user does not belong to', async () => {
      const fakeCompanyId = '00000000-0000-0000-0000-000000000999';

      await request(server)
        .post('/api/v1/auth/switch-company')
        .send({ companyId: fakeCompanyId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });

    it('should reject switch with invalid company id format', async () => {
      await request(server)
        .post('/api/v1/auth/switch-company')
        .send({ companyId: 'invalid-uuid' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Company Context in Requests', () => {
    it('should work with X-Company-Id header', async () => {
      const response = await request(server)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', company1Id)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject X-Company-Id user does not have access to', async () => {
      const fakeCompanyId = '00000000-0000-0000-0000-000000000999';

      await request(server)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', fakeCompanyId)
        .expect(403);
    });
  });
});
