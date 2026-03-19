## 1. Auth Store Company Management

- [x] 1.1 Add selectedCompanyId to auth store state
- [x] 1.2 Add setSelectedCompany() action
- [x] 1.3 Add autoSelectCompany() logic for single company
- [x] 1.4 Add getCompanies() getter
- [x] 1.5 Add switchCompany() action calling /api/v1/auth/switch-company
- [x] 1.6 Update clearAuth() to clear selectedCompanyId

## 2. API Client Company Header

- [x] 2.1 Modify API client to include X-Company-Id header
- [x] 2.2 Get selected company from auth store
- [x] 2.3 Only include header when company is selected

## 3. Company Selector Component

- [x] 3.1 Create `src/components/CompanySelector.vue`
- [x] 3.2 Display company list from auth store
- [x] 3.3 Show current selected company
- [x] 3.4 Handle company selection
- [x] 3.5 Call switchCompany() action on selection

## 4. Integration

- [x] 4.1 Add CompanySelector to navigation/header
- [x] 4.2 Test company selection flow
- [x] 4.3 Test company switching
- [x] 4.4 Test X-Company-Id header in requests
