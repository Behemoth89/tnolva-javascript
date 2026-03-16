import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('companies')
@Unique('UQ_companies_slug', ['slug'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'jsonb', nullable: true })
  settings!: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Index('IDX_companies_deleted_at')
  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt?: Date;
}
