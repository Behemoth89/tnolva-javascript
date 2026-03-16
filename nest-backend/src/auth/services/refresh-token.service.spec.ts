import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let mockRefreshTokenRepository: Partial<Repository<RefreshToken>>;
  let mockRefreshTokenRepo: Partial<RefreshTokenRepository>;

  beforeEach(async () => {
    mockRefreshTokenRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRefreshToken', () => {
    it('should create a new refresh token for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockToken = 'a'.repeat(64); // 64 char hex string
      const mockExpiresAt = new Date();
      mockExpiresAt.setDate(mockExpiresAt.getDate() + 7);

      (mockRefreshTokenRepo.create as jest.Mock).mockResolvedValue({
        userId,
        token: mockToken,
        expiresAt: mockExpiresAt,
      });

      const result = await service.createRefreshToken(userId);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(mockRefreshTokenRepo.create).toHaveBeenCalled();
      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
        }),
      );
    });

    it('should return a 64-character hex token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockExpiresAt = new Date();
      mockExpiresAt.setDate(mockExpiresAt.getDate() + 7);

      (mockRefreshTokenRepo.create as jest.Mock).mockResolvedValue({
        userId,
        token: 'hashed_token',
        expiresAt: mockExpiresAt,
      });

      const result = await service.createRefreshToken(userId);

      expect(result.token).toHaveLength(64);
      expect(/^[a-f0-9]+$/u.test(result.token)).toBe(true);
    });

    it('should set expiration to 7 days from now', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const beforeCreation = new Date();
      const mockExpiresAt = new Date();
      mockExpiresAt.setDate(mockExpiresAt.getDate() + 7);

      (mockRefreshTokenRepo.create as jest.Mock).mockResolvedValue({
        userId,
        token: 'hashed_token',
        expiresAt: mockExpiresAt,
      });

      const result = await service.createRefreshToken(userId);
      const afterCreation = new Date();

      const expectedMin = new Date(beforeCreation);
      expectedMin.setDate(expectedMin.getDate() + 7);
      const expectedMax = new Date(afterCreation);
      expectedMax.setDate(expectedMax.getDate() + 7);

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMin.getTime(),
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMax.getTime(),
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should return null for invalid token', async () => {
      const token = 'invalid_token';
      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(null);

      const result = await service.validateRefreshToken(token);

      expect(result).toBeNull();
      expect(mockRefreshTokenRepo.findByToken).toHaveBeenCalled();
    });

    it('should return null for expired token', async () => {
      const token = 'valid_token';
      const expiredToken = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        token: 'hashed_token',
        expiresAt: new Date(Date.now() - 1000), // expired
        revokedAt: null,
        isExpired: () => true,
        isRevoked: () => false,
        isValid: () => false,
      } as unknown as RefreshToken;

      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(
        expiredToken,
      );

      const result = await service.validateRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should return null for revoked token', async () => {
      const token = 'valid_token';
      const revokedToken = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 86400000), // not expired
        revokedAt: new Date(), // revoked
        isExpired: () => false,
        isRevoked: () => true,
        isValid: () => false,
      } as unknown as RefreshToken;

      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(
        revokedToken,
      );

      const result = await service.validateRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should return token entity for valid token', async () => {
      const token = 'valid_token';
      const validToken = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        token: 'hashed_token',
        expiresAt: new Date(Date.now() + 86400000), // not expired
        revokedAt: null, // not revoked
        isExpired: () => false,
        isRevoked: () => false,
        isValid: () => true,
      } as unknown as RefreshToken;

      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(
        validToken,
      );

      const result = await service.validateRefreshToken(token);

      expect(result).toEqual(validToken);
    });
  });

  describe('rotateRefreshToken', () => {
    it('should return null for invalid token', async () => {
      const token = 'invalid_token';
      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(null);

      const result = await service.rotateRefreshToken(token);

      expect(result).toBeNull();
    });

    it('should revoke old token and create new one for valid token', async () => {
      const oldToken = 'old_valid_token';
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const validToken = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId,
        token: 'hashed_old_token',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        isExpired: () => false,
        isRevoked: () => false,
        isValid: () => true,
      } as unknown as RefreshToken;

      (mockRefreshTokenRepo.findByToken as jest.Mock).mockResolvedValue(
        validToken,
      );
      (mockRefreshTokenRepo.revoke as jest.Mock).mockResolvedValue(true);
      (mockRefreshTokenRepo.create as jest.Mock).mockResolvedValue({
        userId,
        token: 'new_hashed_token',
        expiresAt: new Date(Date.now() + 86400000 * 7),
      });

      const result = await service.rotateRefreshToken(oldToken);

      expect(result).toHaveProperty('newToken');
      expect(result).toHaveProperty('expiresAt');
      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should return true when token is revoked', async () => {
      const token = 'token_to_revoke';
      (mockRefreshTokenRepo.revoke as jest.Mock).mockResolvedValue(true);

      const result = await service.revokeRefreshToken(token);

      expect(result).toBe(true);
      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalled();
    });

    it('should return false when token is not found', async () => {
      const token = 'nonexistent_token';
      (mockRefreshTokenRepo.revoke as jest.Mock).mockResolvedValue(false);

      const result = await service.revokeRefreshToken(token);

      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      (mockRefreshTokenRepo.revokeAllByUserId as jest.Mock).mockResolvedValue(
        5,
      );

      const result = await service.revokeAllUserTokens(userId);

      expect(result).toBe(5);
      expect(mockRefreshTokenRepo.revokeAllByUserId).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should return 0 when user has no tokens', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      (mockRefreshTokenRepo.revokeAllByUserId as jest.Mock).mockResolvedValue(
        0,
      );

      const result = await service.revokeAllUserTokens(userId);

      expect(result).toBe(0);
    });
  });
});
