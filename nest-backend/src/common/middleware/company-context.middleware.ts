import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { type Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { AuthUserPayload } from '../../types/express';

// Extended Request type with user property - omit user from Request to avoid conflict
interface AuthRequest extends Omit<Request, 'user'> {
  user: AuthUserPayload | null;
  companyId?: string | null;
}

/**
 * Company Context Middleware
 *
 * Extracts X-Company-Id header from requests and validates that the user
 * has access to the requested company.
 */
@Injectable()
export class CompanyContextMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  use(req: AuthRequest, _res: Response, next: NextFunction): void {
    const companyId = req.headers['x-company-id'] as string | undefined;
    const user = req.user;

    // If no user, let auth handle it
    if (!user) {
      return next();
    }

    // If company ID is provided in header
    if (companyId) {
      // Validate user has access to this company
      const hasAccess = user.companies?.some(
        (c: { companyId: string }) => c.companyId === companyId,
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this company');
      }

      // Set company context
      this.tenantService.setCurrentTenant(companyId);
      req.companyId = companyId;
    } else if (user.companies && user.companies.length > 0) {
      // No header provided, but user has companies
      if (user.companies.length === 1) {
        // Single company user - auto-select
        const defaultCompany = user.companies[0].companyId;
        this.tenantService.setCurrentTenant(defaultCompany);
        req.companyId = defaultCompany;
      } else {
        // Multi-company user without selection
        throw new BadRequestException(
          'Company selection required. Please provide X-Company-Id header.',
        );
      }
    } else if (user.companyId) {
      // Fallback to legacy companyId
      this.tenantService.setCurrentTenant(user.companyId);
      req.companyId = user.companyId;
    }

    next();
  }
}
