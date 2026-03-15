import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../../common/services/tenant.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, let AuthGuard handle it
    if (!user) {
      return true;
    }

    // Validate tenant access - companyId is required for tenant isolation
    if (!user.companyId) {
      throw new ForbiddenException('Tenant access required. Company ID is missing.');
    }

    // Set tenant context for the request
    this.tenantService.setCurrentTenant(user.companyId);

    return true;
  }
}
