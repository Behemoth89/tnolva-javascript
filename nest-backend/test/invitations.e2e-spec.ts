import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Invitations Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test tokens and IDs (would be real in actual e2e with db)
  const ownerToken = 'Bearer mock-owner-token';
  const adminToken = 'Bearer mock-admin-token';
  const memberToken = 'Bearer mock-member-token';
  const testCompanyId = '00000000-0000-0000-0000-000000000001';
  const testInvitationId = '00000000-0000-0000-0000-000000000020';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/companies/:companyId/invitations', () => {
    it('should create invitation as owner', () => {
      // In real test, this would create actual invitation
      // Returns 201 for valid request with proper auth
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', ownerToken)
        .set('x-company-id', testCompanyId)
        .send({ email: 'newuser@example.com' })
        .expect(201);
    });

    it('should create invitation as admin', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', adminToken)
        .set('x-company-id', testCompanyId)
        .send({ email: 'anotheruser@example.com' })
        .expect(201);
    });

    it('should reject invitation as member', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', memberToken)
        .set('x-company-id', testCompanyId)
        .send({ email: 'user@example.com' })
        .expect(403);
    });

    it('should reject invitation without auth', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations`)
        .send({ email: 'user@example.com' })
        .expect(401);
    });
  });

  describe('GET /api/v1/companies/:companyId/invitations', () => {
    it('should list invitations as owner', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', ownerToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('should list invitations as admin', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', adminToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('should reject listing as member', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}/invitations`)
        .set('Authorization', memberToken)
        .set('x-company-id', testCompanyId)
        .expect(403);
    });
  });

  describe('DELETE /api/v1/companies/:companyId/invitations/:id', () => {
    it('should cancel invitation as owner', () => {
      return request(server)
        .delete(
          `/api/v1/companies/${testCompanyId}/invitations/${testInvitationId}`,
        )
        .set('Authorization', ownerToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('should cancel invitation as admin', () => {
      return request(server)
        .delete(
          `/api/v1/companies/${testCompanyId}/invitations/${testInvitationId}`,
        )
        .set('Authorization', adminToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('should reject cancellation as member', () => {
      return request(server)
        .delete(
          `/api/v1/companies/${testCompanyId}/invitations/${testInvitationId}`,
        )
        .set('Authorization', memberToken)
        .set('x-company-id', testCompanyId)
        .expect(403);
    });
  });

  describe('POST /api/v1/companies/:companyId/invitations/accept', () => {
    it('should accept valid invitation', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations/accept`)
        .send({
          token: 'valid-invitation-token',
          companyId: testCompanyId,
          email: 'newuser@example.com',
        })
        .expect(201);
    });

    it('should reject invalid token', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations/accept`)
        .send({
          token: 'invalid-token',
          companyId: testCompanyId,
          email: 'user@example.com',
        })
        .expect(404);
    });

    it('should reject invitation for different company', () => {
      return request(server)
        .post(`/api/v1/companies/${testCompanyId}/invitations/accept`)
        .send({
          token: 'valid-token',
          companyId: 'different-company-id',
          email: 'user@example.com',
        })
        .expect(400);
    });
  });
});
