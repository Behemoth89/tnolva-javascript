## 1. Database & Entity Updates

- [ ] 1.1 Update UserCompanyRole enum in [`src/users/entities/user-company.entity.ts`](src/users/entities/user-company.entity.ts:10) to add OWNER role
- [ ] 1.2 Create CompanyInvitation entity in [`src/companies/entities/company-invitation.entity.ts`](src/companies/entities/company-invitation.entity.ts)
- [ ] 1.3 Create migration for CompanyInvitation table
- [ ] 1.4 Create migration to add OWNER role for existing first-admin users per company

## 2. Role Guards Implementation

- [ ] 2.1 Create RoleGuard base class in [`src/auth/guards/roles/role.guard.ts`](src/auth/guards/roles/role.guard.ts)
- [ ] 2.2 Create OwnerGuard in [`src/auth/guards/roles/owner.guard.ts`](src/auth/guards/roles/owner.guard.ts)
- [ ] 2.3 Create AdminGuard in [`src/auth/guards/roles/admin.guard.ts`](src/auth/guards/roles/admin.guard.ts)
- [ ] 2.4 Create MemberGuard in [`src/auth/guards/roles/member.guard.ts`](src/auth/guards/roles/member.guard.ts)
- [ ] 2.5 Create @OwnerGuard() decorator in [`src/auth/decorators/owner-guard.decorator.ts`](src/auth/decorators/owner-guard.decorator.ts)
- [ ] 2.6 Create @AdminGuard() decorator in [`src/auth/decorators/admin-guard.decorator.ts`](src/auth/decorators/admin-guard.decorator.ts)
- [ ] 2.7 Create @MemberGuard() decorator in [`src/auth/decorators/member-guard.decorator.ts`](src/auth/decorators/member-guard.decorator.ts)
- [ ] 2.8 Add role guards to auth module in [`src/auth/auth.module.ts`](src/auth/auth.module.ts)

## 3. Role Service Implementation

- [ ] 3.1 Create RolesService in [`src/common/services/roles.service.ts`](src/common/services/roles.service.ts)
- [ ] 3.2 Implement getUserRole method to get role for specific company
- [ ] 3.3 Implement hasRole method to check if user has required role
- [ ] 3.4 Implement updateUserRole method in [`src/users/services/users.service.ts`](src/users/services/users.service.ts)
- [ ] 3.5 Add role validation to CompaniesService

## 4. Invitation System Implementation

- [ ] 4.1 Create InvitationsModule in [`src/companies/invitations/invitations.module.ts`](src/companies/invitations/invitations.module.ts)
- [ ] 4.2 Create InvitationsService in [`src/companies/invitations/invitations.service.ts`](src/companies/invitations/invitations.service.ts)
- [ ] 4.3 Implement createInvitation method with token generation
- [ ] 4.4 Implement acceptInvitation method
- [ ] 4.5 Implement listInvitations method
- [ ] 4.6 Implement cancelInvitation method
- [ ] 4.7 Create InvitationsController in [`src/companies/invitations/invitations.controller.ts`](src/companies/invitations/invitations.controller.ts)

## 5. Ownership Transfer Implementation

- [ ] 5.1 Add transferOwnership method to [`src/companies/services/companies.service.ts`](src/companies/services/companies.service.ts)
- [ ] 5.2 Add transfer-ownership endpoint to [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [ ] 5.3 Add @OwnerGuard() to transfer-ownership endpoint
- [ ] 5.4 Implement transaction for role swap (old owner -> admin, new owner)

## 6. Company User Management Endpoints

- [ ] 6.1 Add updateUserRole endpoint to [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [ ] 6.2 Add removeUserFromCompany endpoint
- [ ] 6.3 Add @AdminGuard() to user management endpoints
- [ ] 6.4 Add protection against modifying OWNER role by non-owners

## 7. Company Deletion with Role Checks

- [ ] 7.1 Update DELETE /companies/:id to require @OwnerGuard() in [`src/companies/controllers/companies.controller.ts`](src/companies/controllers/companies.controller.ts)
- [ ] 7.2 Add hard-delete endpoint with SuperAdmin guard (future)
- [ ] 7.3 Add check to prevent last owner from being removed/deleted

## 8. Testing

- [ ] 8.1 Write unit tests for RoleGuard implementations
- [ ] 8.2 Write unit tests for InvitationsService
- [ ] 8.3 Write unit tests for ownership transfer
- [ ] 8.4 Write e2e tests for invitation flow
- [ ] 8.5 Write e2e tests for role hierarchy enforcement

## 9. Documentation & Cleanup

- [ ] 9.1 Update Swagger documentation for new endpoints
- [ ] 9.2 Add role guard usage examples to README
- [ ] 9.3 Test with existing user accounts (migration verification)
