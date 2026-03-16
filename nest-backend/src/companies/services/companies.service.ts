import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CompanyRepository } from '../repositories/company.repository';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { Company } from '../entities/company.entity';

export interface CompanyWithRole extends Company {
  role?: string;
}

/**
 * Generate a URL-friendly slug from a company name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userCompanyRepository: UserCompanyRepository,
  ) {}

  /**
   * Get all companies the user has access to
   */
  async findAll(userCompanyIds: string[]): Promise<Company[]> {
    return this.companyRepository.findActiveByIds(userCompanyIds);
  }

  /**
   * Get a company by ID if the user has access
   */
  async findOne(id: string, userCompanyIds: string[]): Promise<Company> {
    const company = await this.companyRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user has access to this company
    if (!userCompanyIds.includes(id)) {
      throw new ForbiddenException('You do not have access to this company');
    }

    return company;
  }

  /**
   * Create a new company
   */
  async create(
    data: {
      name: string;
      slug?: string;
      settings?: Record<string, unknown>;
      isActive?: boolean;
    },
    adminUserId: string,
  ): Promise<Company> {
    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check for duplicate slug
    const existing = await this.companyRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Company slug already exists');
    }

    // Create the company
    const company = await this.companyRepository.create({
      name: data.name,
      slug,
      settings: data.settings || null,
      isActive: data.isActive ?? true,
    });

    // Associate the admin user with the company
    await this.userCompanyRepository.addUserToCompany(
      adminUserId,
      company.id,
      'admin',
    );

    return company;
  }

  /**
   * Update a company
   */
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      settings?: Record<string, unknown>;
      isActive?: boolean;
    },
    userCompanyIds: string[],
  ): Promise<Company> {
    // Check if user has access
    if (!userCompanyIds.includes(id)) {
      throw new ForbiddenException('You do not have access to this company');
    }

    const company = await this.companyRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check for slug uniqueness if slug is being changed
    if (data.slug && data.slug !== company.slug) {
      const existing = await this.companyRepository.findBySlug(data.slug);
      if (existing) {
        throw new ConflictException('Company slug already exists');
      }
    }

    // If name is changed but no slug provided, regenerate slug
    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    return this.companyRepository.update(id, data) as Promise<Company>;
  }

  /**
   * Soft delete a company
   */
  async delete(id: string, userCompanyIds: string[]): Promise<void> {
    // Check if user has access
    if (!userCompanyIds.includes(id)) {
      throw new ForbiddenException('You do not have access to this company');
    }

    const company = await this.companyRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.softDelete(id);
  }

  /**
   * Restore a soft-deleted company
   */
  async restore(id: string, userCompanyIds: string[]): Promise<Company> {
    // Check if user has access
    if (!userCompanyIds.includes(id)) {
      throw new ForbiddenException('You do not have access to this company');
    }

    const company = await this.companyRepository.findOneWithDeleted(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!company.deletedAt) {
      throw new ConflictException('Company is not deleted');
    }

    await this.companyRepository.restore(id);
    return this.companyRepository.findOne(id) as Promise<Company>;
  }

  /**
   * Check if user has admin role for a company
   */
  async isUserAdmin(userId: string, companyId: string): Promise<boolean> {
    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      userId,
      companyId,
    );
    return userCompany?.role === 'admin';
  }

  /**
   * Create company during user registration
   */
  async createWithUser(companyName: string, userId: string): Promise<Company> {
    const slug = generateSlug(companyName);

    // Handle duplicate slug by appending a random suffix
    let finalSlug = slug;
    let counter = 0;
    let existing = await this.companyRepository.findBySlug(finalSlug);

    while (existing) {
      counter++;
      finalSlug = `${slug}-${counter}`;
      existing = await this.companyRepository.findBySlug(finalSlug);
    }

    const company = await this.companyRepository.create({
      name: companyName,
      slug: finalSlug,
      settings: null,
      isActive: true,
    });

    // Associate user as admin
    await this.userCompanyRepository.addUserToCompany(
      userId,
      company.id,
      'admin',
    );

    return company;
  }
}
