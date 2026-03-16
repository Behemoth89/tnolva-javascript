import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Registration with Company Creation (e2e)', () => {
  let app: INestApplication;
  let server: any;

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

  describe('POST /api/v1/auth/register', () => {
    it('should register user without company', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
    });

    it('should register user and create new company', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `testcompany${Date.now()}@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'New Company from Registration',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.companies).toBeDefined();
          expect(res.body.user.companies.length).toBeGreaterThan(0);
          expect(res.body.user.companies[0].role).toBe('admin');
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('should register user with auto-generated slug', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `testautoslug${Date.now()}@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          companyName: 'Auto Slug Test Company',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.companies).toBeDefined();
        });
    });

    it('should handle duplicate company name with unique slug', () => {
      const companyName = `Duplicate Company ${Date.now()}`;
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `dup1${Date.now()}@example.com`,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
          companyName,
        })
        .expect(201)
        .then(() =>
          request(server)
            .post('/api/v1/auth/register')
            .send({
              email: `dup2${Date.now()}@example.com`,
              password: 'Test1234!',
              firstName: 'Test',
              lastName: 'User',
              companyName,
            })
            .expect(201),
        );
    });

    it('should reject duplicate email', () => {
      const email = `duplicate${Date.now()}@example.com`;
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Test1234!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .then(() =>
          request(server)
            .post('/api/v1/auth/register')
            .send({
              email,
              password: 'Test1234!',
              firstName: 'Test',
              lastName: 'User',
            })
            .expect(409),
        );
    });

    it('should reject invalid email format', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234!',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `testweak${Date.now()}@example.com`,
          password: 'weak',
        })
        .expect(400);
    });

    it('should reject missing required fields', () => {
      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with company', () => {
      const email = `logintest${Date.now()}@example.com`;
      const password = 'Test1234!';

      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          firstName: 'Login',
          lastName: 'Test',
          companyName: 'Login Test Company',
        })
        .expect(201)
        .then(() =>
          request(server)
            .post('/api/v1/auth/login')
            .send({ email, password })
            .expect(201)
            .expect((res) => {
              expect(res.body.accessToken).toBeDefined();
              expect(res.body.user.companies).toBeDefined();
            }),
        );
    });

    it('should reject invalid credentials', () => {
      return request(server)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234!',
        })
        .expect(401);
    });

    it('should reject wrong password', () => {
      const email = `wrongpass${Date.now()}@example.com`;
      const password = 'Test1234!';

      return request(server)
        .post('/api/v1/auth/register')
        .send({
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201)
        .then(() =>
          request(server)
            .post('/api/v1/auth/login')
            .send({ email, password: 'WrongPassword1!' })
            .expect(401),
        );
    });
  });
});
