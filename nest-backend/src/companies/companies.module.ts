import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './controllers/companies.controller';
import { UsersModule } from '../users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { UserRepository } from '../users/repositories/user.repository';
import { UserCompanyRepository } from '../users/repositories/user-company.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    UsersModule,
    InvitationsModule,
  ],
  controllers: [CompaniesController],
  providers: [
    CompanyRepository,
    CompaniesService,
    UserRepository,
    UserCompanyRepository,
  ],
  exports: [CompaniesService, CompanyRepository],
})
export class CompaniesModule {}
