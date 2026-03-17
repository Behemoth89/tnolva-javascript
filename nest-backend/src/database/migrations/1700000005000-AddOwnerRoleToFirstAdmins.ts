import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerRoleToFirstAdmins1700000005000 implements MigrationInterface {
  name = 'AddOwnerRoleToFirstAdmins1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update the CHECK constraint to allow 'owner' role
    // Check if constraint exists and drop it if it does
    const constraintExists = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'user_companies' AND constraint_name = 'user_companies_role_check'
    `);

    if (constraintExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "user_companies" DROP CONSTRAINT "user_companies_role_check"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_role_check" CHECK ("role" IN ('owner', 'admin', 'member'))`,
    );

    // For each company, find the first admin user and update their role to owner
    // This ensures there's exactly one owner per company

    // Get all companies that have at least one admin
    interface CompanyResult {
      companyId: string;
    }
    const companies = (await queryRunner.query(`
      SELECT DISTINCT "companyId" FROM "user_companies" WHERE "role" = 'admin'
    `)) as CompanyResult[];

    for (const { companyId } of companies) {
      // Get the first admin user for this company
      interface UserResult {
        userId: string;
      }
      const firstAdmin = (await queryRunner.query(
        `
        SELECT "userId" FROM "user_companies"
        WHERE "companyId" = $1 AND "role" = 'admin'
        ORDER BY "created_at" ASC
        LIMIT 1
      `,
        [companyId],
      )) as UserResult[];

      if (firstAdmin.length > 0) {
        // Update the first admin to owner
        await queryRunner.query(
          `
          UPDATE "user_companies"
          SET "role" = 'owner'
          WHERE "companyId" = $1 AND "userId" = $2
        `,
          [companyId, firstAdmin[0].userId],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert all owners back to admins
    await queryRunner.query(`
      UPDATE "user_companies"
      SET "role" = 'admin'
      WHERE "role" = 'owner'
    `);
  }
}
