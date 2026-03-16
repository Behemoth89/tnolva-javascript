import { Injectable } from '@nestjs/common';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import {
  UserRole,
  hasRolePermission,
} from '../../auth/guards/roles/role.guard';

@Injectable()
export class RolesService {
  constructor(private userCompanyRepository: UserCompanyRepository) {}

  /**
   * Get user's role for a specific company
   */
  async getUserRole(userId: string, companyId: string): Promise<string | null> {
    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      userId,
      companyId,
    );
    return userCompany?.role || null;
  }

  /**
   * Check if user has the required role for a company
   */
  async hasRole(
    userId: string,
    companyId: string,
    requiredRole: string,
  ): Promise<boolean> {
    const userRole = await this.getUserRole(userId, companyId);
    if (!userRole) {
      return false;
    }
    return hasRolePermission(userRole, requiredRole);
  }

  /**
   * Check if user is owner of a company
   */
  async isOwner(userId: string, companyId: string): Promise<boolean> {
    return this.hasRole(userId, companyId, UserRole.OWNER);
  }

  /**
   * Check if user is admin or owner of a company
   */
  async isAdmin(userId: string, companyId: string): Promise<boolean> {
    return this.hasRole(userId, companyId, UserRole.ADMIN);
  }

  /**
   * Check if user is a member (or higher role) of a company
   */
  async isMember(userId: string, companyId: string): Promise<boolean> {
    return this.hasRole(userId, companyId, UserRole.MEMBER);
  }

  /**
   * Get all owners for a company
   */
  async getCompanyOwners(companyId: string): Promise<string[]> {
    const userCompanies =
      await this.userCompanyRepository.findByCompanyId(companyId);
    return userCompanies
      .filter((uc) => uc.role === (UserRole.OWNER as string))
      .map((uc) => uc.userId);
  }

  /**
   * Check if this is the last owner of a company
   */
  async isLastOwner(userId: string, companyId: string): Promise<boolean> {
    const owners = await this.getCompanyOwners(companyId);
    return owners.length === 1 && owners[0] === userId;
  }
}
