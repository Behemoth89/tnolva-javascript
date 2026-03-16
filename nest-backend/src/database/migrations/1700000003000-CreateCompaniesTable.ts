import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompaniesTable1700000003000 implements MigrationInterface {
  name = 'CreateCompaniesTable1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create companies table
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "settings" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on slug
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_companies_slug" ON "companies" ("slug")
    `);

    // Create index on deleted_at for query performance (soft delete)
    await queryRunner.query(`
      CREATE INDEX "IDX_companies_deleted_at" ON "companies" ("deleted_at")
    `);

    // Create index on isActive for filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_companies_isActive" ON "companies" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_companies_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_companies_deleted_at"`);
    await queryRunner.query(`DROP INDEX "IDX_companies_slug"`);
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
