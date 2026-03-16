import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly TOKEN_EXPIRY_DAYS = 7;
  private readonly TOKEN_LENGTH = 32; // bytes

  constructor(
    private refreshTokenRepo: RefreshTokenRepository,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token for a user
   * @returns The plain token (to send to client) and expiration date
   */
  async createRefreshToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateToken();
    const hashedToken = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

    await this.refreshTokenRepo.create({
      userId,
      token: hashedToken,
      expiresAt,
    });

    this.logger.log(`Created refresh token for user: ${userId}`);

    // Return plain token to client (hashed version stored in DB)
    return { token, expiresAt };
  }

  /**
   * Validate a refresh token
   * @returns The refresh token entity if valid, null otherwise
   */
  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);

    const refreshToken = await this.refreshTokenRepo.findByToken(hashedToken);

    if (!refreshToken) {
      this.logger.warn(`Invalid refresh token attempt`);
      return null;
    }

    if (!refreshToken.isValid()) {
      this.logger.warn(
        `Expired or revoked refresh token attempt for user: ${refreshToken.userId}`,
      );
      return null;
    }

    return refreshToken;
  }

  /**
   * Rotate a refresh token (invalidate old, create new) atomically
   * Uses a transaction to ensure either both operations succeed or both fail
   * @returns New token and expiration, or null if old token is invalid
   */
  async rotateRefreshToken(
    token: string,
  ): Promise<{ newToken: string; expiresAt: Date } | null> {
    const hashedToken = this.hashToken(token);

    // Use transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      // Find and validate the token within this transaction
      const refreshToken = await manager.findOne(RefreshToken, {
        where: { token: hashedToken },
      });

      if (!refreshToken || !refreshToken.isValid()) {
        return null;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

      // Revoke old token
      await manager.update(
        RefreshToken,
        { id: refreshToken.id },
        { revokedAt: new Date() },
      );

      // Create new token
      const newPlainToken = this.generateToken();
      const newHashedToken = this.hashToken(newPlainToken);

      await manager.save(RefreshToken, {
        userId: refreshToken.userId,
        token: newHashedToken,
        expiresAt,
      });

      this.logger.log(`Rotated refresh token for user: ${refreshToken.userId}`);

      // Return plain token to client
      return { newToken: newPlainToken, expiresAt };
    });
  }

  /**
   * Revoke a single refresh token
   * @returns true if token was revoked, false if not found
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);
    const result = await this.refreshTokenRepo.revoke(hashedToken);

    if (result) {
      this.logger.log(`Revoked refresh token`);
    }

    return result;
  }

  /**
   * Revoke all refresh tokens for a user
   * @returns Number of tokens revoked
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const count = await this.refreshTokenRepo.revokeAllByUserId(userId);
    this.logger.log(`Revoked ${count} refresh tokens for user: ${userId}`);
    return count;
  }
}
