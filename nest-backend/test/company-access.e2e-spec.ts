import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Company Access Validation (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test tokens
  let userOnlyInCompanyAToken: string;
  let userOnlyInCompanyBToken: string;
  let companyAId: string;
  let companyBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    // User in company A only
    const userAResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `usera${Date.now()}@example.com`,
        password: 'Test1234!',
        firstName: 'User',
        lastName: 'A',
        companyName: 'Company A Access',
      })
      .expect(201);

    userOnlyInCompanyAToken = userAResponse.body.accessToken;
    companyAId = userAResponse.body.user.companies[0].companyId;

    // User in company B only
    const userBResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `userb${Date.now()}@example.com`,
        password: 'Test1234!',
        firstName: 'User',
        lastName: 'B',
        companyName: 'Company B Access',
      })
      .expect(201);

    userOnlyInCompanyBToken = userBResponse.body.accessToken;
    companyBId = userBResponse.body.user.companies[0].companyId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/companies/:id - Access Control', () => {
    it('should allow access to company user belongs to', () => {
      return request(server)
        .get(`/api/v1/companies/${companyAId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyAToken}`)
        .set('x-company-id', companyAId)
        .expect(200);
    });

    it('should deny access to company user does not belong to', () => {
      return request(server)
        .get(`/api/v1/companies/${companyBId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyAToken}`)
        .set('x-company-id', companyAId)
        .expect(403);
    });
  });

  describe('x-company-id Header Validation', () => {
    it('should require x-company-id header', () => {
      return request(server)
        .get(`/api/v1/companies/${companyAId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyAToken}`)
        .expect(400);
    });

    it('should validate x-company-id matches company in path', () => {
      return request(server)
        .get(`/api/v1/companies/${companyAId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyAToken}`)
        .set('x-company-id', companyBId)
        .expect(403);
    });

    it('should reject invalid UUID format', () => {
      return request(server)
        .get('/api/v1/companies/invalid-uuid')
        .set('Authorization', `Bearer ${userOnlyInCompanyAToken}`)
        .set('x-company-id', companyAId)
        .expect(400);
    });
  });

  describe('Tenant Isolation', () => {
    it('should not leak company data across tenants', () => {
      return request(server)
        .get(`/api/v1/companies/${companyAId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyBToken}`)
        .set('x-company-id', companyBId)
        .expect(403);
    });

    it('should not allow cross-company updates', () => {
      return request(server)
        .put(`/api/v1/companies/${companyAId}`)
        .set('Authorization', `Bearer ${userOnlyInCompanyBToken}`)
        .set('x-company-id', companyBId)
        .send({ name: 'Cross Company Update Attempt' })
        .expect(403);
    });
  });
});
