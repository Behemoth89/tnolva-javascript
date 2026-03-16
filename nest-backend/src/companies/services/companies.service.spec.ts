import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CompaniesService,
  generateSlug,
} from '../../companies/services/companies.service';
import { CompanyRepository } from '../../companies/repositories/company.repository';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { Company } from '../../companies/entities/company.entity';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepository: jest.Mocked<CompanyRepository>;
  let userCompanyRepository: jest.Mocked<UserCompanyRepository>;

  const mockCompanyRepository = {
    findActiveByIds: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    findOneWithDeleted: jest.fn(),
    getUsersByIds: jest.fn(),
  };

  const mockUserCompanyRepository = {
    addUserToCompany: jest.fn(),
    findByUserAndCompany: jest.fn(),
    findByCompanyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: CompanyRepository, useValue: mockCompanyRepository },
        { provide: UserCompanyRepository, useValue: mockUserCompanyRepository },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companyRepository = module.get(CompanyRepository);
    userCompanyRepository = module.get(UserCompanyRepository);

    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should convert company name to kebab-case', () => {
      expect(generateSlug('Acme Corporation')).toBe('acme-corporation');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Test@Company!')).toBe('testcompany');
    });

    it('should handle multiple spaces and underscores', () => {
      expect(generateSlug('Test__Company  Inc')).toBe('test-company-inc');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('  Test Company  ')).toBe('test-company');
    });
  });

  describe('findAll', () => {
    it('should return all companies for user', async () => {
      const companies = [
        { id: 'company-1', name: 'Company 1' },
        { id: 'company-2', name: 'Company 2' },
      ] as Company[];
      mockCompanyRepository.findActiveByIds.mockResolvedValue(companies);

      const result = await service.findAll(['company-1', 'company-2']);

      expect(result).toEqual(companies);
      expect(mockCompanyRepository.findActiveByIds).toHaveBeenCalledWith([
        'company-1',
        'company-2',
      ]);
    });

    it('should return empty array when user has no companies', async () => {
      mockCompanyRepository.findActiveByIds.mockResolvedValue([]);

      const result = await service.findAll([]);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return company when user has access', async () => {
      const company = { id: 'company-1', name: 'Company 1' } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);

      const result = await service.findOne('company-1', ['company-1']);

      expect(result).toEqual(company);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('company-1', ['company-1'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const company = { id: 'company-1', name: 'Company 1' } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);

      await expect(service.findOne('company-1', ['company-2'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create company with generated slug', async () => {
      mockCompanyRepository.findBySlug.mockResolvedValue(null);
      const company = {
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
      } as Company;
      mockCompanyRepository.create.mockResolvedValue(company);
      mockUserCompanyRepository.addUserToCompany.mockResolvedValue({} as any);

      const result = await service.create({ name: 'Test Company' }, 'user-1');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.create).toHaveBeenCalledWith({
        name: 'Test Company',
        slug: 'test-company',
        settings: null,
        isActive: true,
      });
      expect(mockUserCompanyRepository.addUserToCompany).toHaveBeenCalledWith(
        'user-1',
        'company-1',
        'admin',
      );
    });

    it('should use provided slug if given', async () => {
      mockCompanyRepository.findBySlug.mockResolvedValue(null);
      const company = {
        id: 'company-1',
        name: 'Test',
        slug: 'custom-slug',
      } as Company;
      mockCompanyRepository.create.mockResolvedValue(company);
      mockUserCompanyRepository.addUserToCompany.mockResolvedValue({} as any);

      await service.create({ name: 'Test', slug: 'custom-slug' }, 'user-1');

      expect(mockCompanyRepository.create).toHaveBeenCalledWith({
        name: 'Test',
        slug: 'custom-slug',
        settings: null,
        isActive: true,
      });
    });

    it('should throw ConflictException when slug already exists', async () => {
      const existing = { id: 'company-1', slug: 'test-company' } as Company;
      mockCompanyRepository.findBySlug.mockResolvedValue(existing);

      await expect(
        service.create({ name: 'Test Company' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update company when user has access', async () => {
      const company = {
        id: 'company-1',
        name: 'Updated Company',
        slug: 'updated-company',
      } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);
      mockCompanyRepository.findBySlug.mockResolvedValue(null);
      mockCompanyRepository.update.mockResolvedValue(company);

      const result = await service.update(
        'company-1',
        { name: 'Updated Company' },
        ['company-1'],
      );

      expect(result).toEqual(company);
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const company = { id: 'company-1', name: 'Company 1' } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);

      await expect(
        service.update('company-1', { name: 'Updated' }, ['company-2']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('company-1', { name: 'Updated' }, ['company-1']),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when slug already exists', async () => {
      const company = {
        id: 'company-1',
        name: 'Company',
        slug: 'company',
      } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);
      const existing = { id: 'company-2', slug: 'new-slug' } as Company;
      mockCompanyRepository.findBySlug.mockResolvedValue(existing);

      await expect(
        service.update('company-1', { slug: 'new-slug' }, ['company-1']),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should soft delete company when user has access', async () => {
      const company = { id: 'company-1', name: 'Company 1' } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);
      mockCompanyRepository.softDelete.mockResolvedValueOnce(undefined);

      await service.delete('company-1', ['company-1']);

      expect(mockCompanyRepository.softDelete).toHaveBeenCalledWith(
        'company-1',
      );
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const company = { id: 'company-1', name: 'Company 1' } as Company;
      mockCompanyRepository.findOne.mockResolvedValue(company);

      await expect(service.delete('company-1', ['company-2'])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('company-1', ['company-1'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted company when user has access', async () => {
      const company = {
        id: 'company-1',
        name: 'Company 1',
        deletedAt: new Date(),
      } as Company;
      mockCompanyRepository.findOneWithDeleted.mockResolvedValue(company);
      const restoredCompany = {
        id: 'company-1',
        name: 'Company 1',
        slug: 'company-1',
        settings: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as Company;
      mockCompanyRepository.restore.mockResolvedValueOnce(undefined);
      mockCompanyRepository.findOne.mockResolvedValue(restoredCompany);

      const result = await service.restore('company-1', ['company-1']);

      expect(result).toEqual(restoredCompany);
      expect(mockCompanyRepository.restore).toHaveBeenCalledWith('company-1');
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const company = { id: 'company-1', deletedAt: new Date() } as Company;
      mockCompanyRepository.findOneWithDeleted.mockResolvedValue(company);

      await expect(service.restore('company-1', ['company-2'])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockCompanyRepository.findOneWithDeleted.mockResolvedValue(null);

      await expect(service.restore('company-1', ['company-1'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when company is not deleted', async () => {
      const company = {
        id: 'company-1',
        name: 'Company 1',
        slug: 'company-1',
        settings: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as unknown as Company;
      mockCompanyRepository.findOneWithDeleted.mockResolvedValue(company);

      await expect(service.restore('company-1', ['company-1'])).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('isUserAdmin', () => {
    it('should return true when user is admin', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: 'admin',
      } as any);

      const result = await service.isUserAdmin('user-1', 'company-1');

      expect(result).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: 'member',
      } as any);

      const result = await service.isUserAdmin('user-1', 'company-1');

      expect(result).toBe(false);
    });

    it('should return false when user is not a member', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue(null);

      const result = await service.isUserAdmin('user-1', 'company-1');

      expect(result).toBe(false);
    });
  });

  describe('createWithUser', () => {
    it('should create company and associate user as owner', async () => {
      mockCompanyRepository.findBySlug.mockResolvedValue(null);
      const company = {
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
      } as Company;
      mockCompanyRepository.create.mockResolvedValue(company);
      mockUserCompanyRepository.addUserToCompany.mockResolvedValue({} as any);

      const result = await service.createWithUser('Test Company', 'user-1');

      expect(result).toEqual(company);
      expect(mockUserCompanyRepository.addUserToCompany).toHaveBeenCalledWith(
        'user-1',
        'company-1',
        'owner',
      );
    });

    it('should append suffix to slug when duplicate exists', async () => {
      mockCompanyRepository.findBySlug
        .mockResolvedValueOnce({
          id: 'company-1',
          slug: 'test-company',
        } as Company)
        .mockResolvedValueOnce(null);

      const company = {
        id: 'company-2',
        name: 'Test Company',
        slug: 'test-company-1',
      } as Company;
      mockCompanyRepository.create.mockResolvedValue(company);
      mockUserCompanyRepository.addUserToCompany.mockResolvedValue({} as any);

      const result = await service.createWithUser('Test Company', 'user-1');

      expect(result).toEqual(company);
      expect(mockCompanyRepository.create).toHaveBeenCalledWith({
        name: 'Test Company',
        slug: 'test-company-1',
        settings: null,
        isActive: true,
      });
    });
  });

  describe('getCompanyUsers', () => {
    it('should return users with their roles', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'admin' },
      ] as any);
      mockCompanyRepository.getUsersByIds.mockResolvedValue([
        {
          id: 'user-1',
          email: 'owner@test.com',
          firstName: 'Owner',
          lastName: 'User',
        },
        {
          id: 'user-2',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      ]);

      const result = await service.getCompanyUsers('company-1');

      expect(result).toEqual([
        {
          userId: 'user-1',
          email: 'owner@test.com',
          role: 'owner',
          firstName: 'Owner',
          lastName: 'User',
        },
        {
          userId: 'user-2',
          email: 'admin@test.com',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
      ]);
    });

    it('should return empty array when no users', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([]);

      const result = await service.getCompanyUsers('company-1');

      expect(result).toEqual([]);
    });
  });
});
