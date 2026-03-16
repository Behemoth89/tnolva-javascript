import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../guards/roles/role.guard';

export const MEMBER_GUARD_KEY = 'memberGuard';

/**
 * Decorator to require any role (member, admin, or owner) for the X-Company-Id header
 * Usage: @MemberGuard()
 */
export const MemberGuard = () => SetMetadata(MEMBER_GUARD_KEY, UserRole.MEMBER);
