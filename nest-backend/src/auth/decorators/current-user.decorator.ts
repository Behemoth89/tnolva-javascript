import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserPayload } from '../../types/express';

function getAuthenticatedRequest(ctx: ExecutionContext): {
  user?: AuthUserPayload | null;
} {
  return ctx.switchToHttp().getRequest();
}

export const CurrentUser = createParamDecorator<AuthUserPayload | null>(
  (data: unknown, ctx: ExecutionContext) => {
    const { user } = getAuthenticatedRequest(ctx);
    return user ?? null;
  },
);
