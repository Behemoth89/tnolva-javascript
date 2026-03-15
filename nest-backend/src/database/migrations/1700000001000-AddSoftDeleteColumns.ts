import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteColumns1700000001000 implements MigrationInterface {
  name = 'AddSoftDeleteColumns1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "deleted_at" TIMESTAMP
    `);

    // Add index on deleted_at for query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_users_deleted_at" ON "users" ("deleted_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index on deleted_at
    await queryRunner.query(`
      DROP INDEX "IDX_users_deleted_at"
    `);

    // Drop deleted_at column
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "deleted_at"
    `);
  }
}
