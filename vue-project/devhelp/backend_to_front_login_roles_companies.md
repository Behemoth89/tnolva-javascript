# Backend to Frontend Integration Guide

## Authentication, Authorization, and Multi-Tenancy

This document provides a comprehensive technical guide for implementing frontend consumption of this NestJS SaaS backend API. It covers login/logout, JWT token handling, role-based access control, and multi-company tenancy.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [API Response Wrapper](#api-response-wrapper)
3. [Login and Registration Flow](#login-and-registration-flow)
4. [JWT Token Structure](#jwt-token-structure)
5. [Token Storage and Handling](#token-storage-and-handling)
6. [Token Refresh Flow](#token-refresh-flow)
7. [Logout Flow](#logout-flow)
8. [Multi-Tenancy and Company Context](#multi-tenancy-and-company-context)
9. [Switching Between Companies](#switching-between-companies)
10. [Role Hierarchy](#role-hierarchy)
11. [Role-Based API Access](#role-based-api-access)
12. [Error Handling](#error-handling)
13. [Frontend Implementation Checklist](#frontend-implementation-checklist)

---

## Quick Reference

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Company Context Header (required for multi-company users)
```
X-Company-Id: <company_uuid>
```

### All Responses Wrapped
```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

---

## API Response Wrapper

All API responses follow a consistent wrapper format. The frontend should unwrap the `data` field to get the actual response content.

### Interface
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "companies": [
        { "companyId": "uuid1", "role": "admin" }
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456..."
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials"
}
```

### Important Notes
- Always check `success` field before accessing `data`
- Error responses have `success: false` and `data: null`
- Validation errors may include an `errors` array with details

---

## Login and Registration Flow

### Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "My Company"  // Optional - creates new company if provided
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "companies": [
        { "companyId": "uuid", "role": "admin" }
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456..."
  }
}
```

**Validation Rules:**
- Email: valid email format, unique
- Password: minimum 8 characters
- firstName, lastName: optional
- companyName: optional, creates new company if provided

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "companyId": "uuid"  // Optional - select specific company if user has multiple
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "companies": [
        { "companyId": "uuid1", "role": "admin" },
        { "companyId": "uuid2", "role": "member" }
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456..."
  }
}
```

**Login Flow for Frontend:**
1. Send POST to `/api/v1/auth/login` with email and password
2. On success, store both `accessToken` and `refreshToken`
3. Parse JWT to get user's companies and current companyId
4. If user has multiple companies, show company selector
5. For subsequent requests, use `X-Company-Id` header with selected company

---

## JWT Token Structure

### Token Payload
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "companyId": "company-uuid-1",
  "companies": [
    { "companyId": "company-uuid-1", "role": "admin" },
    { "companyId": "company-uuid-2", "role": "member" }
  ],
  "iat": 1704067200,
  "exp": 1704871800
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `sub` | string | User ID (UUID) |
| `email` | string | User's email address |
| `companyId` | string \| null | Currently active company ID (selected company) |
| `companies` | array | Array of company associations with roles |
| `iat` | number | Issued at timestamp (Unix epoch) |
| `exp` | number | Expiration timestamp (Unix epoch) |

### Companies Array Object
```json
{
  "companyId": "uuid",
  "role": "admin"  // "owner", "admin", or "member" (lowercase)
}
```

### Important Notes
- `companyId` in JWT is the **currently selected/active** company
- `companies` array contains **all companies** the user has access to
- Roles are stored in **lowercase** (owner, admin, member)
- `companyName` is NOT in the JWT - it's only in the login/register response

---

## Token Storage and Handling

### Frontend Storage Recommendations

```javascript
// Store tokens securely
const storeTokens = (accessToken, refreshToken) => {
  // Option 1: Memory (recommended for security)
  // Store in memory variable, not in localStorage
  window.authTokens = { accessToken, refreshToken };
  
  // Option 2: If persistence needed, use httpOnly cookie
  // (requires backend support)
};

// Get access token
const getAccessToken = () => {
  return window.authTokens?.accessToken;
};
```

### Decoding JWT (without verification)

```javascript
const decodeJWT = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload;
};

// Example usage after login
const payload = decodeJWT(accessToken);
console.log(payload.sub);        // user ID
console.log(payload.email);      // user email
console.log(payload.companyId);  // current company ID
console.log(payload.companies);   // [{ companyId, role }, ...]
```

### Including Token in Requests

```javascript
const apiRequest = async (endpoint, options = {}) => {
  const accessToken = getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    // Add company header if user has multiple companies
    ...(selectedCompanyId && { 'X-Company-Id': selectedCompanyId })
  };
  
  const response = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  // Check response and unwrap
  const json = await response.json();
  
  if (!json.success) {
    throw new Error(json.message || 'API Error');
  }
  
  return json.data;
};
```

---

## Token Refresh Flow

The backend provides two refresh mechanisms:

### 1. Refresh with Refresh Token (Recommended)

Use this when the access token has expired but you still have a valid refresh token.

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

**Important:** This endpoint does NOT require JWT authentication. It uses the refresh token from the request body.

### 2. Refresh JWT with Current Token

Use this to get an updated access token with the latest company list (e.g., after being added to a new company).

**Endpoint:** `POST /api/v1/auth/refresh-jwt`

**Headers:**
```
Authorization: Bearer <current_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token..."
  }
}
```

### Auto-Refresh Implementation

```javascript
class AuthManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }
  
  async refreshAccessToken() {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.accessToken = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        return this.accessToken;
      }
      
      // Refresh failed - need to re-login
      this.clearTokens();
      throw new Error('Session expired');
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
  
  // Intercept fetch to auto-refresh
  async wrappedFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    
    // If 401, try to refresh
    if (response.status === 401) {
      await this.refreshAccessToken();
      
      // Retry original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    }
    
    return response;
  }
}
```

---

## Logout Flow

### Logout (Current Device)

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Logout (All Devices)

**Endpoint:** `POST /api/v1/auth/logout-all`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out from all devices",
    "count": 5
  }
}
```

### Frontend Logout Implementation

```javascript
const logout = async () => {
  const refreshToken = getRefreshToken();
  
  try {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {
    // Continue with logout even if API fails
  }
  
  // Clear local tokens
  clearTokens();
  
  // Redirect to login
  window.location.href = '/login';
};
```

---

## Multi-Tenancy and Company Context

### How It Works

This is a **multi-tenant SaaS** backend where:
- Users can belong to multiple companies
- Each company is completely isolated (row-level security)
- The `X-Company-Id` header determines which company context applies

### Company Selection Rules

| User Type | Behavior |
|-----------|----------|
| Single company | `companyId` automatically selected from JWT, no header needed |
| Multiple companies | Must provide `X-Company-Id` header or API returns 400 |
| No company | User exists but has no company associations |

### Backend Processing

1. Request comes in with JWT (identifies user)
2. If `X-Company-Id` header present:
   - Validate user has access to that company
   - Set company context for this request
3. If no header and user has multiple companies:
   - Return 400: "Company selection required. Please provide X-Company-Id header."
4. If no header and user has one company:
   - Automatically use that company

### Frontend Implementation

```javascript
class CompanyManager {
  constructor() {
    this.selectedCompanyId = null;
    this.companies = [];  // From login response
  }
  
  setCompanies(companies) {
    this.companies = companies;
    // Auto-select first company if only one
    if (companies.length === 1) {
      this.selectedCompanyId = companies[0].companyId;
    }
  }
  
  selectCompany(companyId) {
    // Validate user has access
    const hasAccess = this.companies.some(
      c => c.companyId === companyId
    );
    
    if (!hasAccess) {
      throw new Error('No access to this company');
    }
    
    this.selectedCompanyId = companyId;
  }
  
  getCompanyHeader() {
    if (!this.selectedCompanyId) {
      return {};
    }
    return { 'X-Company-Id': this.selectedCompanyId };
  }
  
  getCurrentRole() {
    if (!this.selectedCompanyId) return null;
    
    const company = this.companies.find(
      c => c.companyId === this.selectedCompanyId
    );
    
    return company?.role || null;
  }
  
  isOwner() {
    return this.getCurrentRole() === 'owner';
  }
  
  isAdmin() {
    const role = this.getCurrentRole();
    return role === 'owner' || role === 'admin';
  }
  
  isMember() {
    return this.getCurrentRole() !== null;
  }
}
```

---

## Switching Between Companies

### Switch Company Endpoint

**Endpoint:** `POST /api/v1/auth/switch-company`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "companyId": "uuid-of-company-to-switch-to"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-with-new-company..."
  }
}
```

**Important:** The response contains a **NEW access token** with the new company as the active one. You must replace the old token!

### Company Switch Flow

```javascript
const switchCompany = async (newCompanyId) => {
  const response = await fetch('/api/v1/auth/switch-company', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({ companyId: newCompanyId })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // IMPORTANT: Replace the old token with new token
    setAccessToken(data.data.accessToken);
    
    // Update selected company
    companyManager.selectedCompanyId = newCompanyId;
    
    return true;
  }
  
  throw new Error(data.message);
};
```

### Alternative: Get Companies List and Let User Select

**Endpoint:** `GET /api/v1/companies`

**Headers:**
```
Authorization: Bearer <access_token>
X-Company-Id: <current_company_id>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid1",
      "name": "Company A",
      "slug": "company-a"
    },
    {
      "id": "uuid2",
      "name": "Company B", 
      "slug": "company-b"
    }
  ]
}
```

---

## Role Hierarchy

### Role Levels

```
OWNER (level 3)
    ↓
ADMIN (level 2)
    ↓
MEMBER (level 1)
```

### Role Permissions

| Role | Permissions |
|------|-------------|
| **OWNER** | Full control: delete company, transfer ownership, all admin + member actions |
| **ADMIN** | User management: invite users, change member roles, all member actions |
| **MEMBER** | Basic access: read company resources |

### Role Hierarchy Logic

- **Owners** can do everything
- **Admins** can do admin and member actions (not owner-only)
- **Members** can only do member actions

### Backend Role Enforcement

The backend uses guards to enforce roles:
- `@OwnerGuard()` - Owner only
- `@AdminGuard()` - Owner or Admin
- `@MemberGuard()` - Any role (owner, admin, or member)

### Frontend Role Checks

```javascript
// Get current role from companies array
const getCurrentRole = (companies, selectedCompanyId) => {
  const company = companies.find(c => c.companyId === selectedCompanyId);
  return company?.role || null;
};

// Permission check helper
const canPerformAction = (userRole, requiredRole) => {
  const roleLevels = { owner: 3, admin: 2, member: 1 };
  const userLevel = roleLevels[userRole] || 0;
  const requiredLevel = roleLevels[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

// Examples
canPerformAction('owner', 'member');  // true - owner can do member actions
canPerformAction('owner', 'admin');   // true - owner can do admin actions
canPerformAction('owner', 'owner');   // true - owner can do owner actions
canPerformAction('admin', 'member');   // true - admin can do member actions
canPerformAction('admin', 'admin');   // true - admin can do admin actions
canPerformAction('admin', 'owner');    // false - admin CANNOT do owner actions
canPerformAction('member', 'member');  // true
canPerformAction('member', 'admin');  // false
canPerformAction('member', 'owner');   // false
```

---

## Role-Based API Access

### Company Management Endpoints

| Endpoint | Method | Required Role | Description |
|----------|--------|---------------|-------------|
| `/companies` | GET | Any | List user's companies |
| `/companies/:id` | GET | Any | Get company details |
| `/companies` | POST | Any | Create new company |
| `/companies/:id` | PUT | Any | Update company |
| `/companies/:id` | DELETE | Owner | Soft delete company |
| `/companies/:id/restore` | POST | Owner | Restore company |
| `/companies/:id/transfer-ownership` | POST | Owner | Transfer ownership |
| `/companies/:id/users` | GET | Admin | List company users |
| `/companies/:id/users/:userId/role` | PATCH | Admin | Change user role |
| `/companies/:id/users/:userId` | DELETE | Admin | Remove user |

### User Management Endpoints (require X-Company-Id)

| Endpoint | Method | Required Role | Description |
|----------|--------|---------------|-------------|
| `/users` | GET | Any | List users in company |
| `/users/:id` | GET | Any | Get user details |
| `/users/:id/soft-delete` | POST | Admin | Soft delete user |
| `/users/:id/restore` | POST | Admin | Restore user |
| `/users/:id` | DELETE | Admin | Hard delete user |

### Frontend Role-Based UI

```javascript
const RoleBasedButton = ({ requiredRole, onClick, children }) => {
  const { companyManager } = useAuth();
  
  const canAccess = canPerformAction(
    companyManager.getCurrentRole(),
    requiredRole
  );
  
  if (!canAccess) {
    return null;  // Or render disabled state
  }
  
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
};

// Usage
<RoleBasedButton requiredRole="admin" onClick={handleInvite}>
  Invite User
</RoleBasedButton>

<RoleBasedButton requiredRole="owner" onClick={handleDelete}>
  Delete Company
</RoleBasedButton>
```

---

## Error Handling

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Company selection required | Multi-company user without X-Company-Id |
| 401 | Invalid credentials | Wrong email/password |
| 401 | Invalid or expired refresh token | Refresh token invalid/expired |
| 401 | Token expired | JWT access token expired |
| 403 | You do not access to this company | Invalid X-Company-Id |
| 403 | Required role: owner | Insufficient permissions |
| 404 | Not found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry (e.g., email exists) |

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "message": "Error description here",
  "errors": ["detail 1", "detail 2"]  // Optional, for validation errors
}
```

### Frontend Error Handling

```javascript
const handleApiError = (error, navigate) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Token expired or invalid
        clearTokens();
        navigate('/login');
        break;
        
      case 403:
        // Forbidden - no permission
        showToast(data.message || 'Permission denied', 'error');
        break;
        
      case 400:
        // Bad request - often company selection needed
        showToast(data.message || 'Bad request', 'error');
        break;
        
      default:
        showToast(data.message || 'An error occurred', 'error');
    }
  } else {
    // Network error
    showToast('Network error. Please try again.', 'error');
  }
};
```

---

## Frontend Implementation Checklist

### Authentication
- [ ] Implement login form with email/password
- [ ] Implement registration form
- [ ] Store accessToken and refreshToken securely
- [ ] Implement token refresh on 401
- [ ] Implement logout (single device)
- [ ] Implement logout-all (all devices)

### Multi-Company Support
- [ ] Parse companies array from login response
- [ ] Show company selector if user has multiple companies
- [ ] Add X-Company-Id header to all protected requests
- [ ] Implement company switch flow
- [ ] Update stored token after company switch

### Role-Based UI
- [ ] Get current role from companies array
- [ ] Show/hide UI elements based on role
- [ ] Disable buttons for insufficient permissions
- [ ] Show appropriate error messages

### Error Handling
- [ ] Handle 400 (company selection required)
- [ ] Handle 401 (token expired)
- [ ] Handle 403 (no permission)
- [ ] Handle network errors
- [ ] Show user-friendly error messages

### API Integration
- [ ] Create API client with auth header injection
- [ ] Implement response unwrapping (check success, get data)
- [ ] Add company header to all requests
- [ ] Handle token refresh automatically

---

## Summary

This backend implements a complete multi-tenant SaaS authentication and authorization system:

1. **Login** returns JWT + refreshToken + companies list
2. **JWT** contains user ID, email, current company, and all companies with roles
3. **Multi-company** users must provide X-Company-Id header
4. **Switching companies** returns a new JWT with updated companyId
5. **Roles** (owner > admin > member) control API access
6. **Token refresh** uses refresh token or existing JWT
7. **All responses** wrapped in { success, data, message } format

With this guide, you should be able to implement a complete frontend that integrates with this backend for authentication, company management, and role-based access control.
