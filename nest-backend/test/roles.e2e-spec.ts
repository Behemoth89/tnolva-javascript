import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Role Hierarchy (e2e)', () => {
  let app: INestApplication;
  let server: any;

  const testCompanyId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000010';

  // Mock tokens with different roles
  const ownerToken = 'Bearer mock-owner-token';
  const adminToken = 'Bearer mock-admin-token';
  const memberToken = 'Bearer mock-member-token';

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

  describe('Company Management - Owner Only', () => {
    describe('DELETE /api/v1/companies/:id', () => {
      it('should allow owner to delete company', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}`)
          .set('Authorization', ownerToken)
          .set('x-company-id', testCompanyId)
          .expect(200);
      });

      it('should reject admin from deleting company', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}`)
          .set('Authorization', adminToken)
          .set('x-company-id', testCompanyId)
          .expect(403);
      });

      it('should reject member from deleting company', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}`)
          .set('Authorization', memberToken)
          .set('x-company-id', testCompanyId)
          .expect(403);
      });
    });

    describe('POST /api/v1/companies/:id/transfer-ownership', () => {
      it('should allow owner to transfer ownership', () => {
        return request(server)
          .post(`/api/v1/companies/${testCompanyId}/transfer-ownership`)
          .set('Authorization', ownerToken)
          .set('x-company-id', testCompanyId)
          .send({ newOwnerId: testUserId })
          .expect(200);
      });

      it('should reject admin from transferring ownership', () => {
        return request(server)
          .post(`/api/v1/companies/${testCompanyId}/transfer-ownership`)
          .set('Authorization', adminToken)
          .set('x-company-id', testCompanyId)
          .send({ newOwnerId: testUserId })
          .expect(403);
      });

      it('should reject member from transferring ownership', () => {
        return request(server)
          .post(`/api/v1/companies/${testCompanyId}/transfer-ownership`)
          .set('Authorization', memberToken)
          .set('x-company-id', testCompanyId)
          .send({ newOwnerId: testUserId })
          .expect(403);
      });
    });
  });

  describe('User Management - Admin and Above', () => {
    describe('PATCH /api/v1/companies/:id/users/:userId/role', () => {
      it('should allow owner to update user role', () => {
        return request(server)
          .patch(`/api/v1/companies/${testCompanyId}/users/${testUserId}/role`)
          .set('Authorization', ownerToken)
          .set('x-company-id', testCompanyId)
          .send({ role: 'admin' })
          .expect(200);
      });

      it('should allow admin to update user role', () => {
        return request(server)
          .patch(`/api/v1/companies/${testCompanyId}/users/${testUserId}/role`)
          .set('Authorization', adminToken)
          .set('x-company-id', testCompanyId)
          .send({ role: 'member' })
          .expect(200);
      });

      it('should reject member from updating user role', () => {
        return request(server)
          .patch(`/api/v1/companies/${testCompanyId}/users/${testUserId}/role`)
          .set('Authorization', memberToken)
          .set('x-company-id', testCompanyId)
          .send({ role: 'admin' })
          .expect(403);
      });

      it('should prevent non-owner from changing owner role', () => {
        return request(server)
          .patch(`/api/v1/companies/${testCompanyId}/users/${testUserId}/role`)
          .set('Authorization', adminToken)
          .set('x-company-id', testCompanyId)
          .send({ role: 'owner' })
          .expect(403);
      });
    });

    describe('DELETE /api/v1/companies/:id/users/:userId', () => {
      it('should allow owner to remove user', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}/users/${testUserId}`)
          .set('Authorization', ownerToken)
          .set('x-company-id', testCompanyId)
          .expect(200);
      });

      it('should allow admin to remove user', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}/users/${testUserId}`)
          .set('Authorization', adminToken)
          .set('x-company-id', testCompanyId)
          .expect(200);
      });

      it('should reject member from removing user', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}/users/${testUserId}`)
          .set('Authorization', memberToken)
          .set('x-company-id', testCompanyId)
          .expect(403);
      });

      it('should prevent removal of last owner', () => {
        return request(server)
          .delete(`/api/v1/companies/${testCompanyId}/users/${testUserId}`)
          .set('Authorization', ownerToken)
          .set('x-company-id', testCompanyId)
          .expect(400);
      });
    });
  });

  describe('Role Hierarchy Validation', () => {
    it('owner should have access to all endpoints', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', ownerToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('admin should have access to admin-level endpoints', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}/users`)
        .set('Authorization', adminToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });

    it('member should have limited access', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', memberToken)
        .set('x-company-id', testCompanyId)
        .expect(200);
    });
  });

  describe('X-Company-Id Header Validation', () => {
    it('should reject request without x-company-id header', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', ownerToken)
        .expect(400);
    });

    it('should validate company access for user', () => {
      return request(server)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', ownerToken)
        .set('x-company-id', 'different-company-id')
        .expect(403);
    });
  });
});
