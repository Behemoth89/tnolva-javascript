import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserCompanyRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('user_companies')
@Index('IDX_user_companies_userId', ['userId'])
@Index('IDX_user_companies_companyId', ['companyId'])
@Index('IDX_user_companies_user_company', ['userId', 'companyId'], {
  unique: true,
})
export class UserCompany {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'userId' })
  userId!: string;

  @Column({ type: 'uuid', name: 'companyId' })
  companyId!: string;

  @Column({
    type: 'varchar',
    default: UserCompanyRole.MEMBER,
  })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
