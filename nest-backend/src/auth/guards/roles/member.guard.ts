import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasRolePermission } from './role.guard';

@Injectable()
export class MemberGuard implements CanActivate {
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

    const companyRole = user.companies.find(
      (c: { companyId: string }) => c.companyId === companyId,
    );

    if (!companyRole) {
      return false;
    }

    // MemberGuard requires member, admin, or owner role
    if (!hasRolePermission(companyRole.role, UserRole.MEMBER)) {
      return false;
    }

    // Set the company role on the request for downstream use
    request.companyRole = companyRole.role;

    return true;
  }
}
