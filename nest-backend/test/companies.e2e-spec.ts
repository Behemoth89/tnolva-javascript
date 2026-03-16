import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Company CRUD (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test authentication tokens
  let userToken: string;
  let ownerToken: string;
  let testCompanyId: string;

  // Create unique test user
  const testUser = {
    email: `testcompany${Date.now()}@example.com`,
    password: 'Test1234!',
    firstName: 'Test',
    lastName: 'User',
  };

  const ownerUser = {
    email: `owner${Date.now()}@example.com`,
    password: 'Test1234!',
    firstName: 'Owner',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    // Register a test user with company (admin role)
    const registerResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        companyName: 'Test Company CRUD',
      })
      .expect(201);

    userToken = registerResponse.body.accessToken;
    testCompanyId = registerResponse.body.user.companies[0].companyId;

    // Register another user as owner
    const ownerResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...ownerUser,
        companyName: 'Owner Company',
      })
      .expect(201);

    ownerToken = ownerResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/companies', () => {
    it('should create a new company', () => {
      return request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .send({ name: 'New Test Company' })
        .expect(201);
    });

    it('should create company with custom slug', () => {
      return request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .send({
          name: 'Custom Slug Company',
          slug: `custom-slug-${Date.now()}`,
        })
        .expect(201);
    });

    it('should reject duplicate slug', async () => {
      const slug = `duplicate-test-${Date.now()}`;
      
      // First create
      await request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .send({ name: 'Duplicate Company', slug })
        .expect(201);

      // Second should fail
      return request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .send({ name: 'Duplicate Company', slug })
        .expect(409);
    });

    it('should reject without auth', () => {
      return request(server)
        .post('/api/v1/companies')
        .send({ name: 'Test Company' })
        .expect(401);
    });
  });

  describe('GET /api/v1/companies', () => {
    it('should list companies for authenticated user', () => {
      return request(server)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .expect(200);
    });

    it('should reject without auth', () => {
      return request(server).get('/api/v1/companies').expect(401);
    });
  });

  describe('GET /api/v1/companies/:id', () => {
    it('should return company by id', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('should return 404 for non-existent company', () => {
      return request(server)
        .get('/api/v1/companies/00000000-0000-0000-0000-000000000999')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-company-id', testCompanyId)
        .expect(404);
    });

    it('should reject without auth', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/companies/:id', () => {
    it('should update company name', () => {
      return request(server)
        .put(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-company-id', testCompanyId)
        .send({ name: 'Updated Company Name' })
        .expect(200);
    });

    it('should reject without auth', () => {
      return request(server)
        .put(`/api/v1/companies/${testCompanyId}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/companies/:id', () => {
    it('should reject delete without owner role', () => {
      return request(server)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-company-id', testCompanyId)
        .expect(403);
    });

    it('should allow owner to delete company', () => {
      return request(server)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .set('x-company-id', testCompanyId)
        .expect(204);
    });

    it('should reject without auth', () => {
      return request(server)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/companies/:id/restore', () => {
    it('should reject restore without owner role', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/restore`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-company-id', testCompanyId)
        .expect(403);
    });

    it('should reject without auth', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/restore`)
        .expect(401);
    });
  });

  describe('Company Settings', () => {
    it('should create company with settings', () => {
      return request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Company-Id', testCompanyId)
        .send({
          name: 'Company With Settings',
          settings: { theme: 'dark', notifications: true },
        })
        .expect(201);
    });
  });
});
