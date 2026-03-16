import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  private repository: Repository<RefreshToken>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(RefreshToken);
  }

  /**
   * Find a refresh token by its token hash
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Find a valid (non-expired, non-revoked) token by user ID
   */
  async findValidTokenByUserId(userId: string): Promise<RefreshToken | null> {
    return this.repository
      .createQueryBuilder('refreshToken')
      .where('refreshToken.userId = :userId', { userId })
      .andWhere('refreshToken.revokedAt IS NULL')
      .andWhere('refreshToken.expiresAt > NOW()')
      .getOne();
  }

  /**
   * Find all valid (non-expired, non-revoked) tokens for a user
   */
  async findValidTokensByUserId(userId: string): Promise<RefreshToken[]> {
    return this.repository
      .createQueryBuilder('refreshToken')
      .where('refreshToken.userId = :userId', { userId })
      .andWhere('refreshToken.revokedAt IS NULL')
      .andWhere('refreshToken.expiresAt > NOW()')
      .getMany();
  }

  /**
   * Create a new refresh token
   */
  async create(refreshTokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const refreshToken = this.repository.create(refreshTokenData);
    return this.repository.save(refreshToken);
  }

  /**
   * Revoke a refresh token by setting revokedAt
   */
  async revoke(token: string): Promise<boolean> {
    const result = await this.repository.update(
      { token },
      { revokedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await this.repository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  /**
   * Find and delete expired tokens
   */
  async deleteExpiredTokens(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < NOW()')
      .execute();
    return result.affected ?? 0;
  }
}
