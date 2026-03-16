## Context

The API currently has no formal versioning mechanism. While Swagger documents API version "1.0", all endpoints are served at `/api/*` without version prefixes. This creates challenges when making breaking changes, as existing clients would be affected immediately.

NestJS provides built-in API versioning support that can be configured globally. The current setup uses:
- Global prefix: `/api`
- Swagger at: `/api/docs`
- No explicit version in URLs

## Goals / Non-Goals

**Goals:**
- Implement URL-based API versioning using NestJS versioning feature
- Prefix all API routes with `/api/v1/` for the initial version
- Configure Swagger to generate versioned documentation
- Support multiple API versions simultaneously during transition periods
- Add deprecation headers for future version transitions

**Non-Goals:**
- Header-based versioning (URL versioning only for v1)
- Automatic version migration tools
- Version-specific business logic (logic stays the same across versions initially)
- Deprecation of existing v1 endpoints in this change

## Decisions

### Decision 1: URL-based versioning over header-based versioning
**Rationale:** URL versioning is more explicit and cache-friendly. Clients can easily see which version they're using. It's also the most common approach in REST APIs (e.g., GitHub, Stripe).

**Alternative considered:** Header-based versioning (Accept: application/vnd.api.v1+json) - more complex for clients to implement, less visible in browser URLs.

### Decision 2: Use NestJS built-in versioning
**Rationale:** NestJS provides `@Version()` decorator and `app.enableVersioning()` out of the box. No additional dependencies needed.

**Alternative considered:** Custom middleware - unnecessary complexity when NestJS provides this natively.

### Decision 3: Global versioning configuration
**Rationale:** Applying versioning globally ensures consistency across all controllers. Individual controllers can opt-out using `@Version(undefined)`.

**Alternative considered:** Per-controller versioning - would require modifying every controller, more error-prone.

## Risks / Trade-offs

- **[Risk]** Breaking existing client integrations that don't use versioned URLs
  - **Mitigation:** Document the change clearly, provide migration guide. Consider a redirect from `/api/*` to `/api/v1/*` temporarily.

- **[Risk]** Swagger documentation needs to show versioned APIs
  - **Mitigation:** Configure SwaggerModule with version discriminator to show all versions or filter by version.

- **[Risk]** Multiple versions increase testing surface area
  - **Mitigation:** Initially support only v1, add v2 only when needed with full test coverage.
