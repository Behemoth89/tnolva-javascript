import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private currentTenant: string | null = null;

  setCurrentTenant(tenantId: string): void {
    this.currentTenant = tenantId;
  }

  getCurrentTenant(): string | null {
    return this.currentTenant;
  }

  clearTenant(): void {
    this.currentTenant = null;
  }
}
