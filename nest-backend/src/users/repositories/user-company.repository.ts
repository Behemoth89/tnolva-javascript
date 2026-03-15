import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserCompany } from '../entities/user-company.entity';

export interface UserCompanyResponse {
  companyId: string;
  role: string;
}

@Injectable()
export class UserCompanyRepository {
  private repository: Repository<UserCompany>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserCompany);
  }

  /**
   * Find all companies a user belongs to
   */
  async findByUserId(userId: string): Promise<UserCompany[]> {
    return this.repository.find({ where: { userId } });
  }

  /**
   * Find a specific user-company association
   */
  async findByUserAndCompany(
    userId: string,
    companyId: string,
  ): Promise<UserCompany | null> {
    return this.repository.findOne({
      where: { userId, companyId },
    });
  }

  /**
   * Check if user belongs to company
   */
  async isUserInCompany(userId: string, companyId: string): Promise<boolean> {
    const association = await this.findByUserAndCompany(userId, companyId);
    return !!association;
  }

  /**
   * Add a user to a company
   */
  async addUserToCompany(
    userId: string,
    companyId: string,
    role: string = 'member',
  ): Promise<UserCompany> {
    const userCompany = this.repository.create({
      userId,
      companyId,
      role,
    });
    return this.repository.save(userCompany);
  }

  /**
   * Remove a user from a company
   */
  async removeUserFromCompany(
    userId: string,
    companyId: string,
  ): Promise<void> {
    await this.repository.delete({ userId, companyId });
  }

  /**
   * Update user's role in a company
   */
  async updateUserRole(
    userId: string,
    companyId: string,
    role: string,
  ): Promise<UserCompany | null> {
    await this.repository.update({ userId, companyId }, { role });
    return this.findByUserAndCompany(userId, companyId);
  }

  /**
   * Get companies with their roles for a user (for JWT payload)
   */
  async getCompaniesForUser(userId: string): Promise<UserCompanyResponse[]> {
    const userCompanies = await this.findByUserId(userId);
    return userCompanies.map((uc) => ({
      companyId: uc.companyId,
      role: uc.role,
    }));
  }
}
