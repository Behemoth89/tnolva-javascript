import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Soft Delete Queries (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test data
  const testUser = {
    email: 'softdelete@test.com',
    password: 'Password123!',
    firstName: 'Soft',
    lastName: 'Delete',
  };

  let authToken: string;
  let companyId: string;
  let createdCompanyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer();

    // Register user with company
    const registerResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        ...testUser,
        companyName: 'Soft Delete Test Company',
      });

    authToken = registerResponse.body.accessToken;
    companyId = registerResponse.body.user.companies[0].companyId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Company Soft Delete', () => {
    it('should soft delete a company', async () => {
      // First create a new company
      const createResponse = await request(server)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .send({ name: 'Company To Delete' })
        .expect(201);

      createdCompanyId = createResponse.body.id;

      // Soft delete the company
      const deleteResponse = await request(server)
        .delete(`/api/v1/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(204);

      expect(deleteResponse.status).toBe(204);
    });

    it('should not list soft-deleted companies by default', async () => {
      const response = await request(server)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(200);

      const companies = response.body;
      const deletedCompany = companies.find(
        (c: any) => c.id === createdCompanyId,
      );

      expect(deletedCompany).toBeUndefined();
    });

    it('should list soft-deleted companies with includeDeleted', async () => {
      const response = await request(server)
        .get('/api/v1/companies?includeDeleted=true')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(200);

      const companies = response.body;
      const deletedCompany = companies.find(
        (c: any) => c.id === createdCompanyId,
      );

      expect(deletedCompany).toBeDefined();
      expect(deletedCompany).toHaveProperty('deletedAt');
    });

    it('should restore a soft-deleted company', async () => {
      const response = await request(server)
        .post(`/api/v1/companies/${createdCompanyId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.deletedAt).toBeNull();
    });

    it('should reject restoring non-deleted company', async () => {
      await request(server)
        .post(`/api/v1/companies/${companyId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(404);
    });
  });

  describe('User Soft Delete', () => {
    let testUserId: string;

    it('should create a test user', async () => {
      const response = await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .send({
          email: 'todelete@test.com',
          firstName: 'To',
          lastName: 'Delete',
        })
        .expect(Created => Created.status >= 200 && Created.status < 300);

      testUserId = response.body.id;
    });

    it('should soft delete a user', async () => {
      await request(server)
        .delete(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(204);
    });

    it('should not list soft-deleted users by default', async () => {
      const response = await request(server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(200);

      const users = response.body;
      const deletedUser = users.find((u: any) => u.id === testUserId);

      expect(deletedUser).toBeUndefined();
    });
  });

  describe('Invitation Soft Delete', () => {
    let invitationId: string;

    it('should create an invitation', async () => {
      const response = await request(server)
        .post('/api/v1/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .send({
          email: 'invitetodelete@test.com',
          role: 'member',
        })
        .expect(201);

      invitationId = response.body.id;
    });

    it('should soft delete an invitation', async () => {
      await request(server)
        .delete(`/api/v1/invitations/${invitationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(204);
    });

    it('should not list soft-deleted invitations by default', async () => {
      const response = await request(server)
        .get('/api/v1/invitations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Company-Id', companyId)
        .expect(200);

      const invitations = response.body;
      const deletedInvitation = invitations.find(
        (i: any) => i.id === invitationId,
      );

      expect(deletedInvitation).toBeUndefined();
    });
  });
});
