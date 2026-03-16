## 1. Database Migration for Refresh Tokens

- [x] 1.1 Create TypeORM migration to add `refresh_tokens` table with columns: id (UUID), userId (UUID, foreign key to users), token (VARCHAR(64)), expiresAt (TIMESTAMPTZ), createdAt (TIMESTAMPTZ), revokedAt (TIMESTAMPTZ nullable)
- [x] 1.2 Add index on userId for token lookup
- [x] 1.3 Add index on token for validation queries
- [x] 1.4 Add index on expiresAt for cleanup queries
- [x] 1.5 Verify migration runs successfully on database

## 2. Refresh Token Entity

- [x] 2.1 Create `src/auth/entities/refresh-token.entity.ts` extending BaseEntity
- [x] 2.2 Add userId, token, expiresAt, createdAt, revokedAt columns
- [x] 2.3 Add isExpired(), isRevoked(), isValid() helper methods
- [x] 2.4 Verify entity compiles and TypeORM recognizes it

## 3. Refresh Token Repository

- [x] 3.1 Create `src/auth/repositories/refresh-token.repository.ts`
- [x] 3.2 Extend TypeORM Repository<RefreshToken>
- [x] 3.3 Implement findByToken method
- [x] 3.4 Implement findValidTokenByUserId method
- [x] 3.5 Add custom query for finding valid non-revoked tokens

## 4. Refresh Token Service

- [x] 4.1 Create `src/auth/services/refresh-token.service.ts`
- [x] 4.2 Inject RefreshTokenRepository
- [x] 4.3 Implement generateToken() using crypto.randomBytes
- [x] 4.4 Implement hashToken() using SHA-256
- [x] 4.5 Implement createRefreshToken(userId) returning plain token
- [x] 4.6 Implement validateRefreshToken(token) returning entity or null
- [x] 4.7 Implement rotateRefreshToken(token) - invalidate old, create new
- [x] 4.8 Implement revokeRefreshToken(token) - mark as revoked
- [x] 4.9 Implement revokeAllUserTokens(userId) - revoke all tokens

## 5. ApiResponse Interface

- [x] 5.1 Create `src/common/interfaces/api-response.interface.ts`
- [x] 5.2 Define ApiResponse<T> interface with success, data, message, errors
- [x] 5.3 Define ApiErrorResponse type
- [x] 5.4 Export types for use in interceptors and controllers

## 6. ApiResponse Interceptor

- [x] 6.1 Create `src/common/interceptors/api-response.interceptor.ts`
- [x] 6.2 Implement NestInterceptor<T, ApiResponse<T>>
- [x] 6.3 Transform successful responses to ApiResponse format
- [x] 6.4 Handle Observable and map data correctly
- [x] 6.5 Register globally in main.ts

## 7. Update Login DTO

- [x] 7.1 Update `src/auth/dto/login.dto.ts` to include optional companyId

## 8. Update Register DTO

- [x] 8.1 Update `src/auth/dto/register.dto.ts` to accept optional companyId, companyName (already exists)

## 9. Update RefreshToken DTO

- [x] 9.1 Update `src/auth/dto/refresh-token.dto.ts` to include refreshToken field
- [x] 9.2 Add @IsString() validation
- [x] 9.3 Add @IsOptional() to make it optional for backward compat
- [x] 9.4 Add Swagger decorators

## 10. Update AuthService

- [x] 10.1 Inject RefreshTokenService into AuthService
- [x] 10.2 Modify login() to call createRefreshToken() and return refreshToken
- [x] 10.3 Modify register() to call createRefreshToken() and return refreshToken
- [x] 10.4 Add private helper for generating tokens with company context
- [x] 10.5 Ensure proper error handling and logging

## 11. Update AuthController

- [x] 11.1 Inject RefreshTokenService into AuthController
- [x] 11.2 Update POST /login response to include refreshToken
- [x] 11.3 Update POST /register response to include refreshToken
- [x] 11.4 Add POST /auth/refresh endpoint (no JWT guard, uses refresh token)
- [x] 11.5 Add POST /auth/logout endpoint
- [x] 11.6 Add POST /auth/logout-all endpoint
- [x] 11.7 Add Swagger documentation for all new endpoints
- [x] 11.8 Handle token from body or cookie

## 12. Update AuthModule

- [x] 12.1 Import RefreshToken entity
- [x] 12.2 Register RefreshTokenRepository
- [x] 12.3 Register RefreshTokenService
- [x] 12.4 Add to exports if needed

## 13. Register Global Interceptor

- [x] 13.1 Update `src/main.ts` to use global interceptors
- [x] 13.2 Add ApiResponseInterceptor to app.useGlobalInterceptors
- [x] 13.3 Ensure order: filters → interceptors → guards

## 14. Update Swagger Documentation

- [x] 14.1 Update API docs to show wrapped responses
- [x] 14.2 Document new /auth/refresh, /auth/logout, /auth/logout-all endpoints
- [x] 14.3 Add request/response schemas
- [x] 14.4 Include examples for ApiResponse<T> wrapper

## 15. Security Enhancements

- [x] 15.1 Verify crypto.timingSafeEqual is used for token comparison
- [x] 15.2 Add logging for security events (failed refresh, logout)
- [x] 15.3 Consider adding user agent tracking (future enhancement)

## 16. Testing

- [x] 16.1 Write unit tests for RefreshTokenService methods
- [x] 16.2 Write unit tests for RefreshToken entity helpers
- [ ] 16.3 Write integration tests for POST /auth/refresh
- [ ] 16.4 Write integration tests for POST /auth/logout
- [ ] 16.5 Write integration tests for POST /auth/logout-all
- [ ] 16.6 Write integration tests for token rotation behavior
- [ ] 16.7 Test edge cases: expired tokens, revoked tokens, invalid tokens
- [x] 16.8 Test ApiResponseInterceptor with various response types
- [x] 16.9 Test modified login/register endpoints for refreshToken presence
