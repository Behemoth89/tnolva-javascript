## Context

The current authentication system uses short-lived JWT access tokens (1 day expiration) with no mechanism to maintain sessions beyond this period. Users must re-login daily, and there is no way to invalidate active sessions. Additionally, all API endpoints return raw data without a consistent wrapper structure.

**Current state:**
- `/auth/login` returns `{ user, accessToken }` only
- `/auth/refresh` is used to refresh access tokens but doesn't handle refresh tokens
- No logout capability exists
- Each endpoint returns raw data directly

## Goals / Non-Goals

**Goals:**
- Implement refresh token authentication with PostgreSQL storage
- Add logout and logout-all functionality
- Create standardized API response wrapper for all endpoints
- Implement token rotation for security

**Non-Goals:**
- OAuth2 / SSO integration (future capability)
- Two-factor authentication (future capability)
- Rate limiting implementation (handled separately)
- Redis or external caching for tokens (PostgreSQL only)

## Decisions

### Decision 1: Refresh Token Storage

**Choice**: Store refresh tokens in PostgreSQL with SHA-256 hashing

**Rationale:**
- SHA-256 produces 64-character hex strings, fitting VARCHAR(64)
- One-way hash prevents token theft from database compromise
- PostgreSQL is already the primary database, no new infrastructure needed
- Token rotation provides fresh tokens on each use

**Alternative Considered**: JWT-based refresh tokens without storage
- Rejected: No way to revoke compromised tokens

### Decision 2: Token Rotation Strategy

**Choice**: Invalidate old token and issue new token on each refresh request

**Rationale:**
- Reduces window of opportunity for token theft
- Each refresh provides a fresh credential
- Simple to implement and understand

**Alternative Considered**: Sliding window expiration
- Rejected: More complex, harder to reason about

### Decision 3: API Response Wrapper Scope

**Choice**: Wrap all controller responses with ApiResponse<T>

**Rationale:**
- Consistent client-side handling
- Clear success/failure indication
- Standardized error format

**Alternative Considered**: Wrapper only for authenticated endpoints
- Rejected: Public endpoints also benefit from consistency

### Decision 4: Refresh Token Acceptance

**Choice**: Accept refresh token from request body or cookie

**Rationale:**
- Body: Simple for API clients
- Cookie: Better security for browser clients, HttpOnly flag

**Alternative Considered**: Authorization header
- Rejected: Confuses with access token, different semantics

## Technical Design

### 1. Database Schema

```sql
CREATE TABLE "refresh_tokens" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL,
  "token" varchar(64) NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "revokedAt" timestamptz,
  CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
  CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId");
CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token");
CREATE INDEX "IDX_refresh_tokens_expiresAt" ON "refresh_tokens" ("expiresAt");
```

### 2. RefreshToken Entity

```typescript
// src/auth/entities/refresh-token.entity.ts
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ type: 'uuid', name: 'userId' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'timestamptz' })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null && this.revokedAt !== undefined;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }
}
```

### 3. RefreshTokenService

```typescript
// src/auth/services/refresh-token.service.ts
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly TOKEN_EXPIRY_DAYS = 7;
  private readonly TOKEN_LENGTH = 32; // bytes

  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // Generate secure random token
  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  // Hash token with SHA-256
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Create new refresh token for user
  async createRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateToken();
    const hashedToken = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    await this.refreshTokenRepository.save({
      userId,
      token: hashedToken,
      expiresAt,
    });

    // Return plain token to client (hashed version stored in DB)
    return { token, expiresAt };
  }

  // Validate refresh token
  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);
    
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    if (!refreshToken.isValid()) {
      return null;
    }

    return refreshToken;
  }

  // Rotate refresh token (invalidate old, create new)
  async rotateRefreshToken(token: string): Promise<{ newToken: string; expiresAt: Date } | null> {
    const refreshToken = await this.validateRefreshToken(token);
    
    if (!refreshToken) {
      return null;
    }

    // Invalidate old token
    await this.revokeRefreshToken(token);

    // Create new token
    return this.createRefreshToken(refreshToken.userId);
  }

  // Revoke a refresh token
  async revokeRefreshToken(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);
    
    const result = await this.refreshTokenRepository.update(
      { token: hashedToken },
      { revokedAt: new Date() },
    );

    return (result.affected ?? 0) > 0;
  }

  // Revoke all tokens for a user
  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return result.affected ?? 0;
  }
}
```

### 4. ApiResponse Interface

```typescript
// src/common/interfaces/api-response.interface.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  errors?: string[];
}
```

### 5. ApiResponse Interceptor

```typescript
// src/common/interceptors/api-response.interceptor.ts
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: undefined,
        errors: undefined,
      })),
    );
  }
}
```

### 6. Updated AuthService.login()

```typescript
async login(loginDto: LoginDto): Promise<{
  user: { id: string; email: string; companies: CompanyInfo[] };
  accessToken: string;
  refreshToken: string;
}> {
  // ... existing validation code ...

  // Generate access token
  const payload = { sub: user.id, email: user.email, companyId: activeCompany, companies };
  const accessToken = this.jwtService.sign(payload);

  // Generate refresh token
  const { token: refreshToken } = await this.refreshTokenService.createRefreshToken(user.id);

  this.logger.log(`User logged in: ${user.email}`);

  return {
    user: { id: user.id, email: user.email, companies },
    accessToken,
    refreshToken,
  };
}
```

### 7. Updated AuthController Endpoints

```typescript
// POST /auth/refresh
@Public() // No JWT required, uses refresh token
@Post('refresh')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Refresh access token using refresh token' })
@ApiResponse({ status: 200, schema: { example: { accessToken: '...', refreshToken: '...' } } })
@ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
async refresh(@Body() dto: RefreshTokenDto) {
  const { refreshToken } = dto;
  if (!refreshToken) {
    throw new BadRequestException('Refresh token is required');
  }

  const rotated = await this.refreshTokenService.rotateRefreshToken(refreshToken);
  if (!rotated) {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  // Get user info and generate new access token
  const refreshTokenEntity = await this.refreshTokenService.validateRefreshToken(rotated.newToken);
  const user = await this.userRepository.findById(refreshTokenEntity.userId);
  
  const companies = await this.userCompanyRepository.getCompaniesForUser(user.id);
  const payload = { sub: user.id, email: user.email, companyId: companies[0]?.companyId, companies };
  const accessToken = this.jwtService.sign(payload);

  return { accessToken, refreshToken: rotated.newToken };
}

// POST /auth/logout
@UseGuards(JwtAuthGuard)
@Post('logout')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Logout and invalidate refresh token' })
@ApiResponse({ status: 200, schema: { example: { message: 'Logged out successfully' } } })
async logout(@Body() dto: RefreshTokenDto, @Req() req: Request) {
  const { refreshToken } = dto;
  const user = req.user as { userId: string };

  if (refreshToken) {
    await this.refreshTokenService.revokeRefreshToken(refreshToken);
  }

  this.logger.log(`User logged out: ${user.userId}`);
  return { message: 'Logged out successfully' };
}

// POST /auth/logout-all
@UseGuards(JwtAuthGuard)
@Post('logout-all')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Logout from all devices' })
@ApiResponse({ status: 200, schema: { example: { message: 'Logged out from all devices', count: 5 } } })
async logoutAll(@Req() req: Request) {
  const user = req.user as { userId: string };
  
  const count = await this.refreshTokenService.revokeAllUserTokens(user.userId);
  
  this.logger.log(`User logged out from all devices: ${user.userId}, tokens revoked: ${count}`);
  return { message: 'Logged out from all devices', count };
}
```

### 8. Global Interceptor Registration

```typescript
// src/main.ts
app.useGlobalInterceptors(
  new ApiResponseInterceptor(),
);
```

## Risks / Trade-offs

- **Risk**: Database load from token validation on every refresh
  - **Mitigation**: Index on token column, short-lived queries
  
- **Risk**: Large number of refresh tokens per user
  - **Mitigation**: Cleanup expired/revoked tokens periodically (cron job - future)

- **Risk**: Timing attacks on token comparison
  - **Mitigation**: Use crypto.timingSafeEqual for comparisons (built into hash comparison)

- **Risk**: Concurrent refresh requests
  - **Mitigation**: First valid request wins, race conditions handled by token rotation

## Migration Plan

1. Create TypeORM migration for refresh_tokens table
2. Create RefreshToken entity
3. Create RefreshTokenRepository
4. Create RefreshTokenService
5. Update AuthService.login() to return refreshToken
6. Add /auth/refresh, /auth/logout, /auth/logout-all endpoints
7. Create ApiResponse interface and interceptor
8. Register interceptor globally
9. Update Swagger documentation
10. Write unit and integration tests

## Open Questions

1. **Q**: Should refresh tokens be device-specific?
   - **A**: Not in MVP - track userId only

2. **Q**: How to handle token cleanup?
   - **A**: PostgreSQL handles expiry checks, manual cleanup via cron job later

3. **Q**: Should we support refresh token via cookie for browser clients?
   - **A**: Future enhancement - body-based for now

4. **Q**: What about concurrent refresh requests?
   - **A**: Accept potential race condition in MVP - first valid request succeeds
