import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../../common/services/roles.service';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { UserRole } from '../../auth/guards/roles/role.guard';

describe('RolesService', () => {
  let service: RolesService;
  let userCompanyRepository: jest.Mocked<UserCompanyRepository>;

  const mockUserCompanyRepository = {
    findByUserAndCompany: jest.fn(),
    findByCompanyId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: UserCompanyRepository, useValue: mockUserCompanyRepository },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    userCompanyRepository = module.get(UserCompanyRepository);

    jest.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('should return user role for a company', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: 'admin',
      } as any);

      const result = await service.getUserRole('user-1', 'company-1');

      expect(result).toBe('admin');
    });

    it('should return null if user is not a member of company', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue(null);

      const result = await service.getUserRole('user-1', 'company-1');

      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the required role', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: 'owner',
      } as any);

      const result = await service.hasRole('user-1', 'company-1', 'admin');

      expect(result).toBe(true);
    });

    it('should return false if user does not have the required role', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: 'member',
      } as any);

      const result = await service.hasRole('user-1', 'company-1', 'admin');

      expect(result).toBe(false);
    });

    it('should return false if user is not a member', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue(null);

      const result = await service.hasRole('user-1', 'company-1', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true if user is owner', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.OWNER,
      } as any);

      const result = await service.isOwner('user-1', 'company-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not owner', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.ADMIN,
      } as any);

      const result = await service.isOwner('user-1', 'company-1');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is admin', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.ADMIN,
      } as any);

      const result = await service.isAdmin('user-1', 'company-1');

      expect(result).toBe(true);
    });

    it('should return true if user is owner (has admin permissions)', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.OWNER,
      } as any);

      const result = await service.isAdmin('user-1', 'company-1');

      expect(result).toBe(true);
    });
  });

  describe('isMember', () => {
    it('should return true if user is member', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.MEMBER,
      } as any);

      const result = await service.isMember('user-1', 'company-1');

      expect(result).toBe(true);
    });

    it('should return true if user is admin (has member permissions)', async () => {
      mockUserCompanyRepository.findByUserAndCompany.mockResolvedValue({
        userId: 'user-1',
        companyId: 'company-1',
        role: UserRole.ADMIN,
      } as any);

      const result = await service.isMember('user-1', 'company-1');

      expect(result).toBe(true);
    });
  });

  describe('getCompanyOwners', () => {
    it('should return list of owner user IDs', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: UserRole.OWNER },
        { userId: 'user-2', role: UserRole.ADMIN },
        { userId: 'user-3', role: UserRole.OWNER },
      ] as any);

      const result = await service.getCompanyOwners('company-1');

      expect(result).toEqual(['user-1', 'user-3']);
    });

    it('should return empty array if no owners', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: UserRole.ADMIN },
        { userId: 'user-2', role: UserRole.MEMBER },
      ] as any);

      const result = await service.getCompanyOwners('company-1');

      expect(result).toEqual([]);
    });
  });

  describe('isLastOwner', () => {
    it('should return true if user is the only owner', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: UserRole.OWNER },
      ] as any);

      const result = await service.isLastOwner('user-1', 'company-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not the only owner', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: UserRole.OWNER },
        { userId: 'user-2', role: UserRole.OWNER },
      ] as any);

      const result = await service.isLastOwner('user-1', 'company-1');

      expect(result).toBe(false);
    });

    it('should return false if user is not an owner', async () => {
      mockUserCompanyRepository.findByCompanyId.mockResolvedValue([
        { userId: 'user-1', role: UserRole.ADMIN },
      ] as any);

      const result = await service.isLastOwner('user-1', 'company-1');

      expect(result).toBe(false);
    });
  });
});
