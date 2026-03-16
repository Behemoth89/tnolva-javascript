import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUserPayload } from '../../../types/express.d';

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
  switch (role.toLowerCase()) {
    case UserRole.OWNER:
      return 3;
    case UserRole.ADMIN:
      return 2;
    case UserRole.MEMBER:
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if a role has sufficient permissions for a required role
 */
export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);
  return userLevel >= requiredLevel;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUserPayload | undefined = request.user;
    const companyId = request.headers['x-company-id'];

    // X-Company-Id header is required for role-based access
    if (!companyId) {
      throw new BadRequestException('X-Company-Id header is required');
    }

    // If no user, let AuthGuard handle authentication
    if (!user) {
      return true;
    }

    // Get the required role from the decorator
    const requiredRole = this.reflector.get<string>('requiredRole', context.getHandler());

    if (!requiredRole) {
      // No specific role required, allow access
      return true;
    }

    // Find the user's role for this company
    const companyRole = user.companies?.find((c) => c.companyId === companyId);

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
