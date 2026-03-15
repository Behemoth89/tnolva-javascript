import { Module, Global } from '@nestjs/common';
import { TenantService } from './services/tenant.service';

@Global()
@Module({
  providers: [TenantService],
  exports: [TenantService],
})
export class CommonModule {}
