import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { RoleGuard, UserRole, getRoleLevel, hasRolePermission } from '../../../auth/guards/roles/role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (
    user: any,
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers,
          companyId: headers['x-company-id'],
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleGuard, Reflector],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('getRoleLevel', () => {
    it('should return 3 for OWNER role', () => {
      expect(getRoleLevel('owner')).toBe(3);
    });

    it('should return 2 for ADMIN role', () => {
      expect(getRoleLevel('admin')).toBe(2);
    });

    it('should return 1 for MEMBER role', () => {
      expect(getRoleLevel('member')).toBe(1);
    });

    it('should return 0 for unknown role', () => {
      expect(getRoleLevel('unknown')).toBe(0);
    });

    it('should be case insensitive', () => {
      expect(getRoleLevel('OWNER')).toBe(3);
      expect(getRoleLevel('Admin')).toBe(2);
    });
  });

  describe('hasRolePermission', () => {
    it('should return true when user has higher role than required', () => {
      expect(hasRolePermission('owner', 'member')).toBe(true);
      expect(hasRolePermission('owner', 'admin')).toBe(true);
      expect(hasRolePermission('admin', 'member')).toBe(true);
    });

    it('should return true when user has exact role required', () => {
      expect(hasRolePermission('owner', 'owner')).toBe(true);
      expect(hasRolePermission('admin', 'admin')).toBe(true);
      expect(hasRolePermission('member', 'member')).toBe(true);
    });

    it('should return false when user has lower role than required', () => {
      expect(hasRolePermission('member', 'owner')).toBe(false);
      expect(hasRolePermission('member', 'admin')).toBe(false);
      expect(hasRolePermission('admin', 'owner')).toBe(false);
    });
  });

  describe('canActivate', () => {
    it('should throw BadRequestException when x-company-id header is missing', () => {
      const context = createMockExecutionContext({});
      
      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });

    it('should allow access when no user is present (let AuthGuard handle it)', async () => {
      const context = createMockExecutionContext(undefined, { 'x-company-id': 'company-123' });
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has no company access', () => {
      const user = { id: 'user-1', companies: [] };
      const context = createMockExecutionContext(user, { 'x-company-id': 'company-123' });
      jest.spyOn(reflector, 'get').mockReturnValue('admin');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user role is insufficient', () => {
      const user = {
        id: 'user-1',
        companies: [{ companyId: 'company-123', role: 'member' }],
      };
      const context = createMockExecutionContext(user, { 'x-company-id': 'company-123' });
      jest.spyOn(reflector, 'get').mockReturnValue('owner');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when user has required role', async () => {
      const user = {
        id: 'user-1',
        companies: [{ companyId: 'company-123', role: 'owner' }],
      };
      const context = createMockExecutionContext(user, { 'x-company-id': 'company-123' });
      jest.spyOn(reflector, 'get').mockReturnValue('admin');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when no specific role is required', async () => {
      const user = {
        id: 'user-1',
        companies: [{ companyId: 'company-123', role: 'member' }],
      };
      const context = createMockExecutionContext(user, { 'x-company-id': 'company-123' });
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});

describe('UserRole Enum', () => {
  it('should have correct values', () => {
    expect(UserRole.OWNER).toBe('owner');
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.MEMBER).toBe('member');
  });
});
