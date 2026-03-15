import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserCompaniesTable1700000002000 implements MigrationInterface {
  name = 'CreateUserCompaniesTable1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_companies junction table
    await queryRunner.query(`
      CREATE TABLE "user_companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "companyId" uuid NOT NULL,
        "role" varchar NOT NULL DEFAULT 'member',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_companies_id" PRIMARY KEY ("id")
      )
    `);

    // Create index on userId for user queries
    await queryRunner.query(`
      CREATE INDEX "IDX_user_companies_userId" ON "user_companies" ("userId")
    `);

    // Create index on companyId for company queries
    await queryRunner.query(`
      CREATE INDEX "IDX_user_companies_companyId" ON "user_companies" ("companyId")
    `);

    // Create unique constraint on userId + companyId
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_companies_user_company" ON "user_companies" ("userId", "companyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_user_companies_user_company"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_user_companies_companyId"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_user_companies_userId"
    `);
    await queryRunner.query(`
      DROP TABLE "user_companies"
    `);
  }
}
