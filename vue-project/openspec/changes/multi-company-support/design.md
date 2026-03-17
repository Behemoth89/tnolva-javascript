## Context

Multi-company support is essential for the multi-tenant architecture. Backend requires X-Company-Id header for all requests when user has multiple companies.

## Goals / Non-Goals

**Goals:**

- Track selected company in auth store
- Show company selector when user has multiple companies
- Auto-select when user has only one company
- Add company header to API requests
- Handle company switch via backend endpoint

**Non-Goals:**

- Company creation UI (future feature)
- Company invitation UI (future feature)
- Company user management (future feature)

## Decisions

### 1. Company Selector Location

**Decision**: Show company selector in header/navigation
**Rationale**:

- Always visible
- Easy access for switching
- Standard pattern for multi-tenant apps

### 2. Single Company Auto-Select

**Decision**: Auto-select company when user has only one
**Rationale**:

- Better UX - no unnecessary selection step
- Works with backend auto-selection

## Risks / Trade-offs

| Risk                               | Mitigation                               |
| ---------------------------------- | ---------------------------------------- |
| User loses company context         | Show clear indicator of selected company |
| API returns 400 for missing header | Force company selection before API calls |
