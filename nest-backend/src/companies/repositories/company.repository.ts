import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(companyIds?: string[]): Promise<Company[]> {
    if (companyIds && companyIds.length > 0) {
      return this.companyRepository
        .createQueryBuilder('company')
        .where('company.id IN (:...companyIds)', { companyIds })
        .orderBy('company.createdAt', 'DESC')
        .getMany();
    }

    return this.companyRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { id },
    });
  }

  async findOneWithDeleted(id: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  async create(data: Partial<Company>): Promise<Company> {
    const company = this.companyRepository.create(data);
    return this.companyRepository.save(company);
  }

  async update(id: string, data: Partial<Company>): Promise<Company | null> {
    await this.companyRepository.save({ id, ...data });
    return this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.companyRepository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.companyRepository.restore(id);
  }

  async findBySlug(slug: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { slug },
    });
  }

  async findBySlugWithDeleted(slug: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
  }

  async findActive(): Promise<Company[]> {
    return this.companyRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findActiveByIds(companyIds: string[]): Promise<Company[]> {
    if (companyIds.length === 0) {
      return [];
    }
    return this.companyRepository
      .createQueryBuilder('company')
      .where('company.id IN (:...companyIds)', { companyIds })
      .andWhere('company.isActive = :isActive', { isActive: true })
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Get users by their IDs
   */
  async getUsersByIds(userIds: string[]): Promise<
    Array<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }>
  > {
    if (userIds.length === 0) {
      return [];
    }
    return this.dataSource.query(
      `SELECT id, email, "firstName", "lastName" FROM users WHERE id = ANY($1)`,
      [userIds],
    );
  }
}
