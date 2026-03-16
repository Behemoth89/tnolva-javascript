import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../guards/roles/role.guard';

export const ADMIN_GUARD_KEY = 'adminGuard';

/**
 * Decorator to require admin or owner role for the X-Company-Id header
 * Owner inherits admin permissions
 * Usage: @AdminGuard()
 */
export const AdminGuard = () => SetMetadata(ADMIN_GUARD_KEY, UserRole.ADMIN);
