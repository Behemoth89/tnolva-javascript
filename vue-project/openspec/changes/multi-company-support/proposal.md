## Why

Users can belong to multiple companies in this multi-tenant SaaS system. When a user has access to multiple companies, they must select which company context to use for API requests. The X-Company-Id header identifies the active company. Additionally, users need the ability to switch between their companies.

## What Changes

- **Company Store**: Manage selected company state in auth store
- **Company Selector UI**: Dropdown/modal to select company when user has multiple
- **Auto-Select Single Company**: Automatically select company if user has only one
- **X-Company-Id Header**: Add company header to all API requests
- **Switch Company Endpoint**: Call POST /api/v1/auth/switch-company to change context

## Capabilities

### New Capabilities

- `company-store`: Manage selected company state
- `company-selector`: UI component for company selection

### Modified Capabilities

- `api-client`: Add X-Company-Id header support
- `auth-store`: Add company management actions

## Impact

- **Files Modified**: `src/stores/auth.ts`, `src/api/client.ts`
- **New Files**: `src/components/CompanySelector.vue`
