import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { UserCompanyRepository } from '../../users/repositories/user-company.repository';
import { CompaniesService } from '../../companies/services/companies.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  genSalt: jest.fn().mockResolvedValue(10),
}));

describe('AuthService - JWT Companies Array Generation', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockUserCompanyRepository: any;
  let mockJwtService: any;
  let mockCompaniesService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockUserCompanyRepository = {
      getCompaniesForUser: jest.fn(),
      addUserToCompany: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    mockCompaniesService = {
      createWithUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserCompanyRepository,
          useValue: mockUserCompanyRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login - JWT with companies array', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should generate JWT token with companies array for single company user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: 'hashed_password',
        isActive: true,
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          companyId: 'company-1',
          companies: mockCompanies,
        }),
      );
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.companies).toEqual(mockCompanies);
    });

    it('should generate JWT token with multiple companies array', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: 'hashed_password',
        isActive: true,
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
        { companyId: 'company-2', role: 'member' },
        { companyId: 'company-3', role: 'owner' },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          companies: mockCompanies,
        }),
      );
      expect(result.user.companies).toHaveLength(3);
    });

    it('should use requested companyId when provided in login', async () => {
      const loginDtoWithCompany = {
        email: 'test@test.com',
        password: 'password123',
        companyId: 'company-2',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: 'hashed_password',
        isActive: true,
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
        { companyId: 'company-2', role: 'member' },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginDtoWithCompany);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-2',
        }),
      );
    });

    it('should reject login when requested company not in user companies', async () => {
      const loginDtoWithCompany = {
        email: 'test@test.com',
        password: 'password123',
        companyId: 'company-999',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: 'hashed_password',
        isActive: true,
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
      ];

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );

      await expect(authService.login(loginDtoWithCompany)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fallback to legacy companyId when no user_companies entries', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        password: 'hashed_password',
        isActive: true,
        companyId: 'legacy-company-1',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'legacy-company-1',
          companies: [{ companyId: 'legacy-company-1', role: 'member' }],
        }),
      );
      expect(result.user.companies).toEqual([
        { companyId: 'legacy-company-1', role: 'member' },
      ]);
    });
  });

  describe('refreshToken - JWT companies array update', () => {
    it('should refresh token with updated companies list', async () => {
      const userId = 'user-123';
      const currentCompanyId = 'company-1';

      const mockUser = {
        id: userId,
        email: 'test@test.com',
        isActive: true,
      };

      const updatedCompanies = [
        { companyId: 'company-1', role: 'admin' },
        { companyId: 'company-2', role: 'member' },
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        updatedCompanies,
      );
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await authService.refreshToken(userId, currentCompanyId);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          email: mockUser.email,
          companyId: currentCompanyId,
          companies: updatedCompanies,
        }),
      );
      expect(result.accessToken).toBe('new-jwt-token');
    });

    it('should handle company removal in refresh - default to first available', async () => {
      const userId = 'user-123';
      const currentCompanyId = 'company-removed';

      const mockUser = {
        id: userId,
        email: 'test@test.com',
        isActive: true,
      };

      const remainingCompanies = [
        { companyId: 'company-1', role: 'admin' },
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        remainingCompanies,
      );
      mockJwtService.sign.mockReturnValue('new-jwt-token');

      const result = await authService.refreshToken(userId, currentCompanyId);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
        }),
      );
    });
  });

  describe('switchCompany - JWT with new company', () => {
    it('should generate new token with switched company', async () => {
      const userId = 'user-123';
      const newCompanyId = 'company-2';

      const mockUser = {
        id: userId,
        email: 'test@test.com',
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
        { companyId: 'company-2', role: 'member' },
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );
      mockJwtService.sign.mockReturnValue('switched-jwt-token');

      const result = await authService.switchCompany(userId, newCompanyId);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          companyId: newCompanyId,
          companies: mockCompanies,
        }),
      );
      expect(result.accessToken).toBe('switched-jwt-token');
    });

    it('should reject switch to company user does not have access to', async () => {
      const userId = 'user-123';
      const newCompanyId = 'company-999';

      const mockUser = {
        id: userId,
        email: 'test@test.com',
        companyId: null,
      };

      const mockCompanies = [
        { companyId: 'company-1', role: 'admin' },
      ];

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserCompanyRepository.getCompaniesForUser.mockResolvedValue(
        mockCompanies,
      );

      await expect(authService.switchCompany(userId, newCompanyId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
