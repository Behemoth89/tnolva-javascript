/**
 * Permission utilities for role-based access control
 *
 * Provides helper functions for comparing user roles against required roles.
 */

export type UserRole = 'owner' | 'admin' | 'member'

/**
 * Role level mapping for comparison
 * Higher number = more permissions
 */
export const roleLevel: Record<UserRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

/**
 * Check if a user can perform an action based on their role
 *
 * @param userRole - The user's current role
 * @param requiredRole - The role required to perform the action
 * @returns true if user has sufficient permissions, false otherwise
 */
export function canPerformAction(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (userRole === null) {
    return false
  }

  const userLevel = roleLevel[userRole]
  const requiredLevel = roleLevel[requiredRole]

  return userLevel >= requiredLevel
}

/**
 * Check if user has exact role (not including higher roles)
 *
 * @param userRole - The user's current role
 * @param expectedRole - The expected role
 * @returns true if user has exactly the expected role
 */
export function hasExactRole(userRole: UserRole | null, expectedRole: UserRole): boolean {
  return userRole === expectedRole
}
