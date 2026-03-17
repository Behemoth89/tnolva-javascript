import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { RolesService } from './services/roles.service';
import { CompanyContextMiddleware } from './middleware/company-context.middleware';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [TenantService, RolesService, CompanyContextMiddleware],
  exports: [TenantService, RolesService, CompanyContextMiddleware],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply company context middleware to all routes
    consumer.apply(CompanyContextMiddleware).forRoutes('*');
  }
}
