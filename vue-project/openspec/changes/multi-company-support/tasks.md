## 1. Auth Store Company Management

- [ ] 1.1 Add selectedCompanyId to auth store state
- [ ] 1.2 Add setSelectedCompany() action
- [ ] 1.3 Add autoSelectCompany() logic for single company
- [ ] 1.4 Add getCompanies() getter
- [ ] 1.5 Add switchCompany() action calling /api/v1/auth/switch-company
- [ ] 1.6 Update clearAuth() to clear selectedCompanyId

## 2. API Client Company Header

- [ ] 2.1 Modify API client to include X-Company-Id header
- [ ] 2.2 Get selected company from auth store
- [ ] 2.3 Only include header when company is selected

## 3. Company Selector Component

- [ ] 3.1 Create `src/components/CompanySelector.vue`
- [ ] 3.2 Display company list from auth store
- [ ] 3.3 Show current selected company
- [ ] 3.4 Handle company selection
- [ ] 3.5 Call switchCompany() action on selection

## 4. Integration

- [ ] 4.1 Add CompanySelector to navigation/header
- [ ] 4.2 Test company selection flow
- [ ] 4.3 Test company switching
- [ ] 4.4 Test X-Company-Id header in requests
