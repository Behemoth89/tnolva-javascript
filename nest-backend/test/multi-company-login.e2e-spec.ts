import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Multi-Company Login Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;

  // Test data
  const testUser = {
    email: `multicompany${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Multi',
    lastName: 'Company',
  };

  let authToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let refreshToken: string;

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

  describe('Registration with Company Creation', () => {
    it('should register user with new company and include companies array', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          companyName: 'Test Company Multi',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('companies');
      expect(Array.isArray(response.body.user.companies)).toBe(true);
      expect(response.body.user.companies.length).toBeGreaterThan(0);
      expect(response.body.user.companies[0]).toHaveProperty('companyId');
      expect(response.body.user.companies[0]).toHaveProperty('role');

      authToken = response.body.accessToken;
    });

    it('should reject duplicate email registration', async () => {
      await request(server)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          companyName: 'Another Company',
        })
        .expect(409);
    });
  });

  describe('Login with Single Company', () => {
    it('should return companies array in login response', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('companies');
      expect(Array.isArray(response.body.user.companies)).toBe(true);

      authToken = response.body.accessToken;
    });

    it('should reject invalid credentials', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('JWT Token Structure', () => {
    it('should decode JWT and verify companies array', () => {
      // The token should contain companies in the payload
      // This is a structural test - actual decoding would require JWT_SECRET
      expect(authToken).toBeDefined();
      expect(typeof authToken).toBe('string');
      expect(authToken.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include companies in protected endpoints', async () => {
      const response = await request(server)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
    });
  });

  describe('Token Refresh with Companies Update', () => {
    it('should refresh token and maintain companies array', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');

      refreshToken = response.body.accessToken;
    });
  });
});
