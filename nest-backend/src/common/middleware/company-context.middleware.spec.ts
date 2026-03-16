import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { CompanyContextMiddleware } from './company-context.middleware';
import { TenantService } from '../services/tenant.service';

describe('CompanyContextMiddleware', () => {
  let middleware: CompanyContextMiddleware;
  let mockTenantService: any;
  let mockReq: any;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(async () => {
    mockTenantService = {
      setCurrentTenant: jest.fn(),
    };

    mockReq = {
      headers: {},
      user: null,
      companyId: undefined,
    };

    mockRes = {};

    mockNext = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyContextMiddleware,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    middleware = module.get<CompanyContextMiddleware>(CompanyContextMiddleware);
  });

  describe('when user is not authenticated', () => {
    it('should call next without setting company', () => {
      mockReq.user = null;

      middleware.use(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockTenantService.setCurrentTenant).not.toHaveBeenCalled();
    });
  });

  describe('when user has single company', () => {
    it('should auto-select the single company', () => {
      mockReq.user = {
        userId: 'user-123',
        companies: [{ companyId: 'company-1', role: 'admin' }],
      };

      middleware.use(mockReq, mockRes as Response, mockNext);

      expect(mockTenantService.setCurrentTenant).toHaveBeenCalledWith('company-1');
      expect(mockReq.companyId).toBe('company-1');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when user has multiple companies', () => {
    it('should require company selection via header', () => {
      mockReq.user = {
        userId: 'user-123',
        companies: [
          { companyId: 'company-1', role: 'admin' },
          { companyId: 'company-2', role: 'member' },
        ],
      };
      mockReq.headers['x-company-id'] = undefined;

      expect(() => {
        middleware.use(mockReq, mockRes as Response, mockNext);
      }).toThrow(BadRequestException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set company from X-Company-Id header', () => {
      mockReq.user = {
        userId: 'user-123',
        companies: [
          { companyId: 'company-1', role: 'admin' },
          { companyId: 'company-2', role: 'member' },
        ],
      };
      mockReq.headers['x-company-id'] = 'company-2';

      middleware.use(mockReq, mockRes as Response, mockNext);

      expect(mockTenantService.setCurrentTenant).toHaveBeenCalledWith('company-2');
      expect(mockReq.companyId).toBe('company-2');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject company not in user companies', () => {
      mockReq.user = {
        userId: 'user-123',
        companies: [
          { companyId: 'company-1', role: 'admin' },
        ],
      };
      mockReq.headers['x-company-id'] = 'company-999';

      expect(() => {
        middleware.use(mockReq, mockRes as Response, mockNext);
      }).toThrow(ForbiddenException);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('fallback to legacy companyId', () => {
    it('should use legacy companyId when no companies array', () => {
      mockReq.user = {
        userId: 'user-123',
        companyId: 'legacy-company-1',
        companies: [],
      };

      middleware.use(mockReq, mockRes as Response, mockNext);

      expect(mockTenantService.setCurrentTenant).toHaveBeenCalledWith(
        'legacy-company-1',
      );
      expect(mockReq.companyId).toBe('legacy-company-1');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('user with no companies', () => {
    it('should allow when user has no companies at all', () => {
      mockReq.user = {
        userId: 'user-123',
        companies: undefined,
      };

      middleware.use(mockReq, mockRes as Response, mockNext);

      expect(mockTenantService.setCurrentTenant).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
