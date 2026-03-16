import { RefreshToken } from './refresh-token.entity';

describe('RefreshToken Entity', () => {
  let refreshToken: RefreshToken;

  beforeEach(() => {
    refreshToken = new RefreshToken();
  });

  describe('isExpired', () => {
    it('should return true when token is expired', () => {
      refreshToken.expiresAt = new Date(Date.now() - 1000); // 1 second ago

      expect(refreshToken.isExpired()).toBe(true);
    });

    it('should return false when token is not expired', () => {
      refreshToken.expiresAt = new Date(Date.now() + 86400000); // 1 day from now

      expect(refreshToken.isExpired()).toBe(false);
    });

    it('should return false when expiresAt is exactly now', () => {
      refreshToken.expiresAt = new Date();

      expect(refreshToken.isExpired()).toBe(false);
    });
  });

  describe('isRevoked', () => {
    it('should return true when revokedAt is set', () => {
      refreshToken.revokedAt = new Date();

      expect(refreshToken.isRevoked()).toBe(true);
    });

    it('should return false when revokedAt is null', () => {
      refreshToken.revokedAt = undefined;

      expect(refreshToken.isRevoked()).toBe(false);
    });

    it('should return false when revokedAt is undefined', () => {
      refreshToken.revokedAt = undefined;

      expect(refreshToken.isRevoked()).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return false when token is expired', () => {
      refreshToken.expiresAt = new Date(Date.now() - 1000);
      refreshToken.revokedAt = undefined;

      expect(refreshToken.isValid()).toBe(false);
    });

    it('should return false when token is revoked', () => {
      refreshToken.expiresAt = new Date(Date.now() + 86400000);
      refreshToken.revokedAt = new Date();

      expect(refreshToken.isValid()).toBe(false);
    });

    it('should return true when token is not expired and not revoked', () => {
      refreshToken.expiresAt = new Date(Date.now() + 86400000);
      refreshToken.revokedAt = undefined;

      expect(refreshToken.isValid()).toBe(true);
    });

    it('should return false when token is expired AND revoked', () => {
      refreshToken.expiresAt = new Date(Date.now() - 1000);
      refreshToken.revokedAt = new Date();

      expect(refreshToken.isValid()).toBe(false);
    });
  });

  describe('entity properties', () => {
    it('should have id as UUID string', () => {
      refreshToken.id = '123e4567-e89b-12d3-a456-426614174000';

      expect(refreshToken.id).toBeDefined();
      expect(typeof refreshToken.id).toBe('string');
    });

    it('should have userId as UUID string', () => {
      refreshToken.userId = '123e4567-e89b-12d3-a456-426614174001';

      expect(refreshToken.userId).toBeDefined();
      expect(typeof refreshToken.userId).toBe('string');
    });

    it('should have token as 64-character string', () => {
      refreshToken.token = 'a'.repeat(64);

      expect(refreshToken.token).toHaveLength(64);
    });

    it('should have expiresAt as Date', () => {
      refreshToken.expiresAt = new Date();

      expect(refreshToken.expiresAt).toBeInstanceOf(Date);
    });

    it('should have createdAt as Date', () => {
      refreshToken.createdAt = new Date();

      expect(refreshToken.createdAt).toBeInstanceOf(Date);
    });

    it('should have optional revokedAt', () => {
      expect(refreshToken.revokedAt).toBeUndefined();

      refreshToken.revokedAt = new Date();

      expect(refreshToken.revokedAt).toBeDefined();
    });
  });
});
