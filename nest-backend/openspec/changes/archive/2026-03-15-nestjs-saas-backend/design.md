## Context

The project requires building a production-ready NestJS backend from scratch. This is a new application with no existing codebase. The architecture must support multi-tenancy from the beginning, JWT-based authentication, API documentation via Swagger, and Docker-based deployment with PostgreSQL. The system must follow Clean Architecture principles and be ready for scaling.

## Goals / Non-Goals

**Goals:**
- Establish a modular NestJS project structure with Clean Architecture
- Implement JWT authentication with login/register functionality
- Create multi-tenant aware BaseEntity with companyId for tenant isolation
- Configure TypeORM with PostgreSQL for data persistence
- Set up Swagger/OpenAPI documentation for all endpoints
- Configure Docker with multi-stage builds and PostgreSQL database
- Enable CORS, validation, error handling, and logging
- Make the application production-ready with health checks

**Non-Goals:**
- Implementing specific business features beyond authentication
- Setting up separate databases per tenant (prepare architecture for future)
- Implementing row-level security (prepare entity structure only)
- Setting up CI/CD pipelines
- Adding unit/e2e tests (infrastructure will be test-ready)

## Decisions

### 1. NestJS over Express
**Decision:** Use NestJS as the framework
**Rationale:** NestJS provides a mature dependency injection system, modular architecture, and TypeScript-first approach that aligns with Clean Architecture. It has excellent integration with TypeORM, Swagger, and JWT authentication libraries.
**Alternative Considered:** Express.js - Less structured, requires more boilerplate for Clean Architecture

### 2. TypeORM over Prisma
**Decision:** Use TypeORM as the ORM
**Rationale:** TypeORM provides more control over SQL queries, excellent support for migrations, and better integration with NestJS via @nestjs/typeorm. It supports repository pattern natively.
**Alternative Considered:** Prisma - Simpler DX but less flexibility for complex queries and migrations

### 3. JWT over Session-based Auth
**Decision:** Use JWT tokens for authentication
**Rationale:** JWT is stateless, scales better across multiple containers, and works well with SPA/mobile clients. No need for session storage.
**Alternative Considered:** Session-based - Requires sticky sessions or shared session store

### 4. UUID over Auto-increment ID
**Decision:** Use UUID as primary key in BaseEntity
**Rationale:** UUIDs are non-sequential, more secure (can't guess IDs), and work better in distributed systems. Prevents enumeration attacks.
**Alternative Considered:** Auto-increment - Simpler but reveals business volume

### 5. Multi-stage Dockerfile
**Decision:** Use multi-stage Docker build
**Rationale:** Keeps the final image small by excluding dev dependencies, reduces attack surface, and improves deployment speed.
**Alternative Considered:** Single-stage - Simpler but results in larger image

## Risks / Trade-offs

- **Multi-tenancy Implementation** → Start with companyId filtering at repository level; can migrate to RLS or separate databases later
- **JWT Token Storage** → Tokens are stored on client; use HTTP-only cookies for additional security in production
- **TypeORM Performance** → Use proper indexing on companyId and frequently queried fields; monitor query performance
- **Docker Development** → Volume mounting for hot-reload during development; production uses built artifacts
- **Environment Variables** → All secrets come from env vars; never commit .env files

## Migration Plan

Since this is a new application, there is no migration from existing code. The deployment will involve:
1. Building the Docker image
2. Running database migrations
3. Starting the application container with proper environment variables
4. Health check validation

## Open Questions

- Should we implement refresh tokens? (Consider for production: JWT_EXPIRATION should be short)
- Should we add rate limiting? (Can be added as middleware later)
- Should we implement audit logging? (Track data changes per company)
