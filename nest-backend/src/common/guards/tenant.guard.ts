import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../../common/services/tenant.service';
import { AuthUserPayload } from '../../types/express';

function getAuthenticatedRequest(ctx: ExecutionContext): {
  user?: AuthUserPayload | null;
  companyId?: string | null;
} {
  return ctx.switchToHttp().getRequest();
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const { user, companyId: requestCompanyId } =
      getAuthenticatedRequest(context);

    // If no user, let AuthGuard handle it
    if (!user) {
      return true;
    }

    // Get company ID from various sources
    const companyId = requestCompanyId || user.companyId;

    // Validate tenant access - companyId is required for tenant isolation
    if (!companyId) {
      throw new ForbiddenException(
        'Tenant access required. Company ID is missing.',
      );
    }

    // Validate user has access to this company (if using multi-company)
    if (user.companies && user.companies.length > 0) {
      const hasAccess = user.companies.some((c) => c.companyId === companyId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this company');
      }
    }

    // Set tenant context for the request
    this.tenantService.setCurrentTenant(companyId);

    return true;
  }
}
