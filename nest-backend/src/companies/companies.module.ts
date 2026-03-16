import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyRepository } from './repositories/company.repository';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './controllers/companies.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), UsersModule],
  controllers: [CompaniesController],
  providers: [CompanyRepository, CompaniesService],
  exports: [CompaniesService, CompanyRepository],
})
export class CompaniesModule {}
