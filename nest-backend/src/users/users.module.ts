import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { UserCompanyRepository } from './repositories/user-company.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UserRepository, UserCompanyRepository, UsersService],
  exports: [UserRepository, UserCompanyRepository, UsersService],
})
export class UsersModule {}
