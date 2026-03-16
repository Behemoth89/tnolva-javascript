import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompanyRepository } from '../../companies/repositories/company.repository';
import { Company } from '../../companies/entities/company.entity';

describe('CompanyRepository', () => {
  let repository: CompanyRepository;

  const mockCompanyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyRepository,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<CompanyRepository>(CompanyRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all companies when no companyIds provided', async () => {
      const companies = [
        { id: 'company-1', name: 'Company 1' },
        { id: 'company-2', name: 'Company 2' },
      ];
      mockCompanyRepository.find.mockResolvedValue(companies as Company[]);

      const result = await repository.findAll();

      expect(result).toEqual(companies);
      expect(mockCompanyRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by companyIds when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 'company-1', name: 'Company 1' }]),
      };
      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findAll(['company-1']);

      expect(mockCompanyRepository.createQueryBuilder).toHaveBeenCalledWith(
        'company',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'company.id IN (:...companyIds)',
        {
          companyIds: ['company-1'],
        },
      );
      expect(result).toEqual([{ id: 'company-1', name: 'Company 1' }]);
    });
  });

  describe('findOne', () => {
    it('should return company by id', async () => {
      const company = { id: 'company-1', name: 'Company 1' };
      mockCompanyRepository.findOne.mockResolvedValue(company as Company);

      const result = await repository.findOne('company-1');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
    });

    it('should return null when company not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne('company-1');

      expect(result).toBeNull();
    });
  });

  describe('findOneWithDeleted', () => {
    it('should return company including deleted', async () => {
      const company = {
        id: 'company-1',
        name: 'Company 1',
        deletedAt: new Date(),
      };
      mockCompanyRepository.findOne.mockResolvedValue(company as Company);

      const result = await repository.findOneWithDeleted('company-1');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        withDeleted: true,
      });
    });
  });

  describe('create', () => {
    it('should create and save company', async () => {
      const companyData = { name: 'New Company', slug: 'new-company' };
      const createdCompany = { id: 'company-1', ...companyData };
      mockCompanyRepository.create.mockReturnValue(createdCompany as Company);
      mockCompanyRepository.save.mockResolvedValue(createdCompany as Company);

      const result = await repository.create(companyData);

      expect(mockCompanyRepository.create).toHaveBeenCalledWith(companyData);
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(createdCompany);
      expect(result).toEqual(createdCompany);
    });
  });

  describe('update', () => {
    it('should update and return company', async () => {
      const updateData = { name: 'Updated Company' };
      const updatedCompany = { id: 'company-1', name: 'Updated Company' };
      mockCompanyRepository.save.mockResolvedValue(updatedCompany as Company);
      mockCompanyRepository.findOne.mockResolvedValue(
        updatedCompany as Company,
      );

      const result = await repository.update('company-1', updateData);

      expect(mockCompanyRepository.save).toHaveBeenCalledWith({
        id: 'company-1',
        ...updateData,
      });
      expect(result).toEqual(updatedCompany);
    });
  });

  describe('softDelete', () => {
    it('should soft delete company', async () => {
      mockCompanyRepository.softDelete.mockResolvedValue({
        affected: 1,
      } as any);

      await repository.softDelete('company-1');

      expect(mockCompanyRepository.softDelete).toHaveBeenCalledWith(
        'company-1',
      );
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted company', async () => {
      mockCompanyRepository.restore.mockResolvedValue({ affected: 1 } as any);

      await repository.restore('company-1');

      expect(mockCompanyRepository.restore).toHaveBeenCalledWith('company-1');
    });
  });

  describe('findBySlug', () => {
    it('should return company by slug', async () => {
      const company = { id: 'company-1', slug: 'test-company' };
      mockCompanyRepository.findOne.mockResolvedValue(company as Company);

      const result = await repository.findBySlug('test-company');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-company' },
      });
    });

    it('should return null when slug not found', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlugWithDeleted', () => {
    it('should return company by slug including deleted', async () => {
      const company = {
        id: 'company-1',
        slug: 'test-company',
        deletedAt: new Date(),
      };
      mockCompanyRepository.findOne.mockResolvedValue(company as Company);

      const result = await repository.findBySlugWithDeleted('test-company');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-company' },
        withDeleted: true,
      });
    });
  });

  describe('findActive', () => {
    it('should return active companies ordered by name', async () => {
      const companies = [
        { id: 'company-1', name: 'Alpha', isActive: true },
        { id: 'company-2', name: 'Beta', isActive: true },
      ];
      mockCompanyRepository.find.mockResolvedValue(companies as Company[]);

      const result = await repository.findActive();

      expect(result).toEqual(companies);
      expect(mockCompanyRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findActiveByIds', () => {
    it('should return empty array when no companyIds', async () => {
      const result = await repository.findActiveByIds([]);

      expect(result).toEqual([]);
      expect(mockCompanyRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return active companies filtered by ids', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 'company-1', name: 'Company 1' }]),
      };
      mockCompanyRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await repository.findActiveByIds(['company-1']);

      expect(mockCompanyRepository.createQueryBuilder).toHaveBeenCalledWith(
        'company',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'company.id IN (:...companyIds)',
        {
          companyIds: ['company-1'],
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'company.isActive = :isActive',
        {
          isActive: true,
        },
      );
      expect(result).toEqual([{ id: 'company-1', name: 'Company 1' }]);
    });
  });

  describe('getUsersByIds', () => {
    it('should return empty array when no userIds', async () => {
      const result = await repository.getUsersByIds([]);

      expect(result).toEqual([]);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should return users by ids', async () => {
      const users = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          firstName: 'User',
          lastName: 'One',
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          firstName: 'User',
          lastName: 'Two',
        },
      ];
      mockDataSource.query.mockResolvedValue(users);

      const result = await repository.getUsersByIds(['user-1', 'user-2']);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT id, email, "firstName", "lastName" FROM users WHERE id = ANY($1)',
        [['user-1', 'user-2']],
      );
      expect(result).toEqual(users);
    });
  });
});
