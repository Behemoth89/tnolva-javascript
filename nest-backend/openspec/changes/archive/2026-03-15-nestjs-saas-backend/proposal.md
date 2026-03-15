## Why

The project requires a production-ready NestJS backend that provides a scalable, secure foundation for a multi-tenant SaaS application. Starting with proper architecture, authentication, and infrastructure from the beginning prevents costly refactoring later and enables rapid development of business features.

## What Changes

- Initialize a new NestJS project with TypeScript and proper configuration
- Configure Docker with multi-stage Dockerfile and docker-compose.yml for PostgreSQL
- Set up environment-based configuration with .env.example
- Implement Clean Architecture with Controllers, Services, Repositories, Entities, and DTOs layers
- Create BaseEntity with UUID primary key, timestamps, and companyId for multi-tenancy
- Configure TypeORM with PostgreSQL connection using environment variables
- Implement JWT authentication with bcrypt password hashing
- Set up Swagger/OpenAPI documentation with @nestjs/swagger
- Enable CORS, DTO validation, error handling, and logging
- Configure health checks and production-ready deployment

## Capabilities

### New Capabilities

- `user-auth`: JWT-based authentication with login/register functionality, password hashing, JWT strategy and guards
- `multi-tenancy`: BaseEntity with companyId field for tenant isolation, supporting future row-level security or separate database per tenant
- `api-documentation`: Swagger UI at /api/docs with OpenAPI decorators, tags, and descriptions
- `docker-infrastructure`: Docker configuration with multi-stage build, PostgreSQL database, health checks
- `clean-architecture`: Modular NestJS structure with Controllers, Services, Repositories, Entities, and DTOs following best practices

### Modified Capabilities

None - this is a new backend foundation.

## Impact

- New NestJS application in src/ directory with TypeScript
- Docker configuration files (Dockerfile, docker-compose.yml, .dockerignore)
- Environment configuration (.env.example)
- Auth module with JWT strategy
- Base entity and multi-tenant architecture
- Swagger setup for API documentation
- Production build configuration
