import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Find all users for a company, optionally including soft-deleted ones
   */
  async findAll(companyId: string, includeDeleted = false): Promise<User[]> {
    if (includeDeleted) {
      return this.userRepository.findAllWithDeleted();
    }
    return this.userRepository.findAllByCompany(companyId);
  }

  /**
   * Find a user by ID, optionally including soft-deleted ones
   */
  async findOne(id: string, includeDeleted = false): Promise<User> {
    let user: User | null;
    if (includeDeleted) {
      user = await this.userRepository.findByIdWithDeleted(id);
    } else {
      user = await this.userRepository.findById(id);
    }

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Soft delete a user (mark as deleted)
   */
  async softDelete(id: string): Promise<{ affected?: number }> {
    const result = await this.userRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Restore a soft-deleted user
   */
  async restore(id: string): Promise<void> {
    await this.userRepository.restore(id);
  }

  /**
   * Hard delete a user permanently
   */
  async hardDelete(id: string): Promise<void> {
    await this.userRepository.hardDelete(id);
  }

  /**
   * Find only soft-deleted users
   */
  async findOnlyDeleted(): Promise<User[]> {
    return this.userRepository.findOnlyDeleted();
  }
}
