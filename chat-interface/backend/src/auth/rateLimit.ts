import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

export interface AuthRateLimiterOptions {
  windowMs?: number;
  max?: number;
}

export function createAuthRateLimiter(
  options: AuthRateLimiterOptions = {},
): RateLimitRequestHandler {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const max = options.max ?? 10;
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
  });
}

export const authRateLimiter: RateLimitRequestHandler = createAuthRateLimiter();
