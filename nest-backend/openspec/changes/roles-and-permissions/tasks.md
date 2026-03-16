## 1. Database & Entity Updates

- [x] 1.1 Update UserCompanyRole enum in [`src/users/entities/user-company.entity.ts`](src/users/entities/user-company.entity.ts:10) to add OWNER role
- [x] 1.2 Create CompanyInvitation entity in [`src/companies/entities/company-invitation.entity.ts`](src/companies/entities/company-invitation.entity.ts)
- [x] 1.3 Create migration for CompanyInvitation table
- [x] 1.4 Create migration to add OWNER role for existing first-admin users per company

## 2. Role Guards Implementation

- [x] 2.1 Create RoleGuard base class in [`src/auth/guards/roles/role.guard.ts`](src/auth/guards/roles/role.guard.ts)
- [x] 2.2 Create OwnerGuard in [`src/auth/guards/roles/owner.guard.ts`](src/auth/guards/roles/owner.guard.ts)
- [x] 2.3 Create AdminGuard in [`src/auth/guards/roles/admin.guard.ts`](src/auth/guards/roles/admin.guard.ts)
- [x] 2.4 Create MemberGuard in [`src/auth/guards/roles/member.guard.ts`](src/auth/guards/roles/member.guard.ts)
- [x] 2.5 Create @OwnerGuard() decorator in [`src/auth/decorators/roles/owner-guard.decorator.ts`](src/auth/decorators/roles/owner-guard.decorator.ts)
- [x] 2.6 Create @AdminGuard() decorator in [`src/auth/decorators/roles/admin-guard.decorator.ts`](src/auth/decorators/roles/admin-guard.decorator.ts)
- [x] 2.7 Create @MemberGuard() decorator in [`src/auth/decorators/roles/member-guard.decorator.ts`](src/auth/decorators/roles/member-guard.decorator.ts)
- [x] 2.8 Add role guards to auth module in [`src/auth/auth.module.ts`](src/auth/auth.module.ts)

## 3. Role Service Implementation

- [x] 3.1 Create RolesService in [`src/common/services/roles.service.ts`](src/common/services/roles.service.ts)
- [x] 3.2 Implement getUserRole method to get role for specific company
- [x] 3.3 Implement hasRole method to check if user has required role
- [x] 3.4 Implement updateUserRole method in [`src/users/services/users.service.ts`](src/users/services/users.service.ts)
- [x] 3.5 Add role validation to CompaniesService

## 4. Invitation System Implementation

- [x] 4.1 Create InvitationsModule in [`src/companies/invitations/invitations.module.ts`](src/companies/invitations/invitations.module.ts)
- [x] 4.2 Create InvitationsService in [`src/companies/invitations/invitations.service.ts`](src/companies/invitations/invitations.service.ts)
- [x] 4.3 Implement createInvitation method with token generation
- [x] 4.4 Implement acceptInvitation method
- [x] 4.5 Implement listInvitations method
- [x] 4.6 Implement cancelInvitation method
- [x] 4.7 Create InvitationsController in [`src/companies/invitations/invitations.controller.ts`](src/companies/invitations/invitations.controller.ts)

## 5. Ownership Transfer Implementation

- [x] 5.1 Add transferOwnership method to [`src/companies/services/companies.service.ts`](src/companies/services/companies.service.ts)
- [x] 5.2 Add transfer-ownership endpoint to [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [x] 5.3 Add @OwnerGuard() to transfer-ownership endpoint
- [x] 5.4 Implement transaction for role swap (old owner -> admin, new owner)

## 6. Company User Management Endpoints

- [x] 6.1 Add updateUserRole endpoint to [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [x] 6.2 Add removeUserFromCompany endpoint
- [x] 6.3 Add @AdminGuard() to user management endpoints
- [x] 6.4 Add protection against modifying OWNER role by non-owners

## 7. Company Deletion with Role Checks

- [x] 7.1 Update DELETE /companies/:id to require @OwnerGuard() in [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [ ] 7.2 Add hard-delete endpoint with SuperAdmin guard (future)
- [x] 7.3 Add check to prevent last owner from being removed/deleted

## 8. Testing

- [x] 8.1 Write unit tests for RoleGuard implementations
- [x] 8.2 Write unit tests for InvitationsService
- [x] 8.3 Write unit tests for ownership transfer
- [x] 8.4 Write e2e tests for invitation flow
- [x] 8.5 Write e2e tests for role hierarchy enforcement

## 9. Documentation & Cleanup

- [x] 9.1 Update Swagger documentation for new endpoints
- [x] 9.2 Add role guard usage examples to README
- [x] 9.3 Test with existing user accounts (migration verification)
