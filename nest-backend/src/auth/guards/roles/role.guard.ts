import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUserPayload, CompanyUser } from '../../../types/express.d';

/**
 * Role hierarchy: OWNER > ADMIN > MEMBER
 * Each role inherits permissions from lower roles
 */
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

/**
 * Get the minimum role level for authorization
 * Higher number = more permissions
 */
export function getRoleLevel(role: string): number {
  const normalizedRole = role.toLowerCase();
  switch (normalizedRole) {
    case 'owner':
      return 3;
    case 'admin':
      return 2;
    case 'member':
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if a role has sufficient permissions for a required role
 */
export function hasRolePermission(
  userRole: string,
  requiredRole: string,
): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  return userLevel >= requiredLevel;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      user?: AuthUserPayload | null;
      headers: Record<string, string>;
      companyId?: string;
      companyRole?: string;
    }>();
    const user = request.user as AuthUserPayload | undefined;
    const companyId = request.headers['x-company-id'] as string | undefined;

    // X-Company-Id header is required for role-based access
    if (!companyId) {
      throw new BadRequestException('X-Company-Id header is required');
    }

    // If no user, let AuthGuard handle authentication
    if (!user) {
      return true;
    }

    // Get the required role from the decorator
    const requiredRole = this.reflector.get<string>(
      'requiredRole',
      context.getHandler(),
    );

    if (!requiredRole) {
      // No specific role required, allow access
      return true;
    }

    // Find the user's role for this company
    const companyRole = user.companies?.find(
      (c: CompanyUser) => c.companyId === companyId,
    );

    if (!companyRole) {
      throw new ForbiddenException('You do not have access to this company');
    }

    // Check if user's role meets the required role
    if (!hasRolePermission(companyRole.role, requiredRole)) {
      throw new ForbiddenException(`Required role: ${requiredRole}`);
    }

    // Store the company ID for the request
    request.companyId = companyId;
    request.companyRole = companyRole.role;

    return true;
  }
}
