## 1. Configure NestJS API Versioning

- [ ] 1.1 Enable API versioning in `src/main.ts` using `app.enableVersioning()`
- [ ] 1.2 Configure URL versioning type with default version '1'
- [ ] 1.3 Update global prefix from `/api` to include versioning consideration

## 2. Update Swagger Configuration

- [ ] 2.1 Configure Swagger to generate versioned documentation at `/api/docs/v1`
- [ ] 2.2 Add version discriminator to OpenAPI document
- [ ] 2.3 Verify Swagger UI shows correct version prefix in endpoint paths

## 3. Apply Versioning to Controllers

- [ ] 3.1 Add `@Version('1')` decorator to AuthController in `src/auth/controllers/auth.controller.ts`
- [ ] 3.2 Add `@Version('1')` decorator to UsersController in `src/users/controllers/users.controller.ts`
- [ ] 3.3 Add `@Version('1')` decorator to HealthController in `src/health/health.controller.ts`
- [ ] 3.4 Add `@Version('1')` decorator to AppController in `src/app.controller.ts`

## 4. Testing

- [ ] 4.1 Verify v1 endpoints work at `/api/v1/*` (e.g., `/api/v1/auth/login`)
- [ ] 4.2 Verify unversioned requests return 404 at `/api/*`
- [ ] 4.3 Verify Swagger documentation is accessible at `/api/docs/v1`
- [ ] 4.4 Run existing E2E tests and update base URLs to use v1 prefix

## 5. Documentation Updates

- [ ] 5.1 Update README.md with new API versioned endpoint examples
- [ ] 5.2 Update .env.example with API versioning configuration options
