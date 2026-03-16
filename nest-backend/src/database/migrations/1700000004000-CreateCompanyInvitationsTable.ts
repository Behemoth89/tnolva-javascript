import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyInvitationsTable1700000004000 implements MigrationInterface {
  name = 'CreateCompanyInvitationsTable1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create company_invitations table
    await queryRunner.query(`
      CREATE TABLE "company_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "companyId" uuid NOT NULL,
        "invitedByUserId" uuid NOT NULL,
        "email" varchar NOT NULL,
        "token" varchar(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "status" varchar NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_invitations_id" PRIMARY KEY ("id")
      )
    `);

    // Create index on companyId
    await queryRunner.query(`
      CREATE INDEX "IDX_company_invitations_companyId" ON "company_invitations" ("companyId")
    `);

    // Create index on email
    await queryRunner.query(`
      CREATE INDEX "IDX_company_invitations_email" ON "company_invitations" ("email")
    `);

    // Create unique index on token
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_company_invitations_token" ON "company_invitations" ("token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_company_invitations_token"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_company_invitations_email"
    `);
    await queryRunner.query(`
      DROP INDEX "IDX_company_invitations_companyId"
    `);
    await queryRunner.query(`
      DROP TABLE "company_invitations"
    `);
  }
}
