import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'userId' })
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 64 })
  token!: string;

  @Column({ type: 'timestamptz' })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  /**
   * Check if the token has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the token has been revoked
   */
  isRevoked(): boolean {
    return this.revokedAt !== null && this.revokedAt !== undefined;
  }

  /**
   * Check if the token is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }
}
