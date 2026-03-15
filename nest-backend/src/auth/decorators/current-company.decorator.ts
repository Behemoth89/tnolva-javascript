import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserPayload } from '../../types/express';

function getAuthenticatedRequest(ctx: ExecutionContext): {
  user?: AuthUserPayload | null;
  companyId?: string | null;
} {
  return ctx.switchToHttp().getRequest();
}

/**
 * Decorator to extract the current company ID from the request.
 * The company ID is set by the TenantGuard or CompanyContextMiddleware.
 */
export const CurrentCompany = createParamDecorator<string | null>(
  (_data: unknown, ctx: ExecutionContext) => {
    const { user, companyId } = getAuthenticatedRequest(ctx);
    return companyId || user?.companyId || null;
  },
);
