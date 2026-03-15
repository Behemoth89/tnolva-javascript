import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  private repository: Repository<User>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithDeleted(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id }, withDeleted: true });
  }

  async findAllWithDeleted(): Promise<User[]> {
    return this.repository.find({ withDeleted: true });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async findAllByCompany(companyId: string): Promise<User[]> {
    return this.repository.find({ where: { companyId } });
  }

  /**
   * Soft delete a user by setting deletedAt timestamp
   */
  async softDelete(id: string): Promise<{ affected?: number }> {
    return this.repository.softDelete(id);
  }

  /**
   * Restore a soft-deleted user
   */
  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  /**
   * Hard delete a user permanently
   */
  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Find only soft-deleted users
   */
  async findOnlyDeleted(): Promise<User[]> {
    return this.repository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.deletedAt IS NOT NULL')
      .getMany();
  }
}
