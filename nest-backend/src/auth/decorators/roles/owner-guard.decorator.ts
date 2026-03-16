import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../guards/roles/role.guard';

export const OWNER_GUARD_KEY = 'ownerGuard';

/**
 * Decorator to require owner role for the X-Company-Id header
 * Usage: @OwnerGuard()
 */
export const OwnerGuard = () => SetMetadata(OWNER_GUARD_KEY, UserRole.OWNER);
