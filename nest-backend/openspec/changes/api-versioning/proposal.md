## Why

The API currently has no formal versioning strategy. While Swagger documents API version "1.0", there is no URL-based versioning (e.g., `/api/v1/`, `/api/v2/`) to support breaking changes safely. As the SaaS platform evolves, we need the ability to introduce breaking changes without disrupting existing clients. Without versioning, any API change risks breaking client integrations.

## What Changes

- Implement URL-based API versioning using NestJS versioning feature
- Prefix all API routes with `/api/v1/` for the initial version
- Configure Swagger/OpenAPI to generate versioned API documentation at `/api/docs/v1`
- Add version negotiation middleware to handle Accept headers
- Implement deprecation headers (`Sunset`, `Deprecation`) for future version transitions
- Support simultaneous multiple API versions during transition periods

## Capabilities

### New Capabilities
- `api-versioning`: Core capability to version REST API endpoints with URL-based versioning, Swagger documentation per version, and deprecation handling

### Modified Capabilities
- (none - initial implementation)

## Impact

- All existing controllers will need the `@Version('1')` decorator
- Swagger setup needs to generate separate documentation per version
- Client applications will need to update to use `/api/v1/` prefix
- Global prefix configuration will change from `/api` to `/api/v1`
