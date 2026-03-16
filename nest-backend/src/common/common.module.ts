import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { RolesService } from './services/roles.service';
import { CompanyContextMiddleware } from './middleware/company-context.middleware';

@Global()
@Module({
  providers: [TenantService, RolesService, CompanyContextMiddleware],
  exports: [TenantService, RolesService, CompanyContextMiddleware],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply company context middleware to all routes
    consumer.apply(CompanyContextMiddleware).forRoutes('*');
  }
}
