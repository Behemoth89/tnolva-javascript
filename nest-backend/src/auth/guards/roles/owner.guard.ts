import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasRolePermission } from './role.guard';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.headers['x-company-id'];

    if (!companyId) {
      return false;
    }

    if (!user || !user.companies) {
      return false;
    }

    const companyRole = user.companies.find((c) => c.companyId === companyId);

    if (!companyRole) {
      return false;
    }

    // OwnerGuard requires owner role exactly
    if (!hasRolePermission(companyRole.role, UserRole.OWNER)) {
      return false;
    }

    // Set the company role on the request for downstream use
    request.companyRole = companyRole.role;

    return true;
  }
}
