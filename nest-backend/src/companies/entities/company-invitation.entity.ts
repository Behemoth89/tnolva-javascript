import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('company_invitations')
@Index('IDX_company_invitations_companyId', ['companyId'])
@Index('IDX_company_invitations_email', ['email'])
@Index('IDX_company_invitations_token', ['token'], { unique: true })
export class CompanyInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'companyId' })
  companyId!: string;

  @Column({ type: 'uuid', name: 'invitedByUserId' })
  invitedByUserId!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token!: string;

  @Column({ type: 'timestamp', name: 'expiresAt' })
  expiresAt!: Date;

  @Column({
    type: 'varchar',
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
