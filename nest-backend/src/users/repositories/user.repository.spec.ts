import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserRepository } from './user.repository';

describe('UserRepository - Soft Delete Methods', () => {
  let repository: UserRepository;
  let mockDataSource: any;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  describe('softDelete', () => {
    it('should soft delete a user by setting deletedAt timestamp', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await repository.softDelete(userId);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ affected: 1 });
    });

    it('should return affected: 0 when user does not exist', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174999';
      mockRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await repository.softDelete(userId);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ affected: 0 });
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockRepository.restore.mockResolvedValue(undefined);

      await repository.restore(userId);

      expect(mockRepository.restore).toHaveBeenCalledWith(userId);
    });

    it('should handle restore errors', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockRepository.restore.mockRejectedValue(new Error('Not found'));

      await expect(repository.restore(userId)).rejects.toThrow('Not found');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await repository.hardDelete(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByIdWithDeleted', () => {
    it('should find user including soft-deleted ones', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        id: userId,
        email: 'test@test.com',
        deletedAt: new Date(),
      };
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithDeleted(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        withDeleted: true,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174999';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByIdWithDeleted(userId);

      expect(result).toBeNull();
    });
  });

  describe('findAllWithDeleted', () => {
    it('should return all users including soft-deleted', async () => {
      const mockUsers = [
        { id: '1', email: 'test1@test.com', deletedAt: null },
        { id: '2', email: 'test2@test.com', deletedAt: new Date() },
      ];
      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await repository.findAllWithDeleted();

      expect(mockRepository.find).toHaveBeenCalledWith({ withDeleted: true });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOnlyDeleted', () => {
    it('should return only soft-deleted users', async () => {
      const mockUsers = [
        { id: '1', email: 'test@test.com', deletedAt: new Date() },
      ];
      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await repository.findOnlyDeleted();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.deletedAt IS NOT NULL',
      );
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no deleted users', async () => {
      const mockQueryBuilder = {
        withDeleted: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await repository.findOnlyDeleted();

      expect(result).toEqual([]);
    });
  });
});
