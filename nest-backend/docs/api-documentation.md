# API Documentation - Multi-Company & Soft Delete Features

## Table of Contents
1. [API Response Wrapper](#api-response-wrapper)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Company Context Headers](#company-context-headers)
4. [Soft Delete Query Parameters](#soft-delete-query-parameters)
5. [New Endpoints](#new-endpoints)

---

## API Response Wrapper

All API responses are wrapped in a consistent format using the `ApiResponse<T>` interface.

### ApiResponse Interface

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
  "data": { ... }
}
```

### Error Response Example
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": ["detail 1", "detail 2"]
}
```

### Wrapped Response Examples

#### GET /users - Success
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "email": "user@example.com" }
  ]
}
```

#### POST /auth/login - Success
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "companies": [] },
    "accessToken": "eyJhbGc...",
    "refreshToken": "abc123..."
  }
}
```

#### 401 Unauthorized - Error
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials"
}
```

#### 400 Bad Request - Error
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": ["email must be valid", "password is required"]
}
```

---

## Authentication Endpoints

### Register with Company
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "My Company"  // Optional - creates new company
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "companies": [
        {
          "companyId": "uuid",
          "role": "admin"
        }
      ]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123def456..."
  }
}
```

### Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "companyId": "uuid"  // Optional - select specific company
}
```

**Response (200):**
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

### Refresh Token
```
POST /api/v1/auth/refresh
```

**Description:** Refresh access and refresh tokens using a valid refresh token. Does not require JWT authentication.

**Request Body:**
```json
{
  "refreshToken": "abc123def456..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new-refresh-token..."
  }
}
```

**Error Response (401 - Invalid or expired refresh token):**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid or expired refresh token"
}
```

### Logout
```
POST /api/v1/auth/logout
```

**Description:** Logout and invalidate the current refresh token. Requires JWT authentication.

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

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Logout All Devices
```
POST /api/v1/auth/logout-all
```

**Description:** Logout from all devices by revoking all refresh tokens for the current user. Requires JWT authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out from all devices",
    "count": 5
  }
}
```

### Refresh JWT
```
POST /api/v1/auth/refresh-jwt
```

**Description:** Refresh JWT access token with updated company list. Requires JWT authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Switch Company
```
POST /api/v1/auth/switch-company
```

**Description:** Switch active company for multi-company users. Requires JWT authentication.

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

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Company Context Headers

### Required Header for Multi-Company Users
When a user belongs to multiple companies, they must specify which company they're acting on behalf of:

```
X-Company-Id: <company-uuid>
```

**Behavior:**
- **Single company users**: Automatically selected, no header required
- **Multi-company users**: Header required, returns 400 if missing
- **Invalid company**: Returns 403 Forbidden

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/companies \
  -H "Authorization: Bearer <token>" \
  -H "X-Company-Id: <company-uuid>"
```

---

## Soft Delete Query Parameters

### Include Deleted Records
To include soft-deleted records in query results:

```
GET /api/v1/companies?includeDeleted=true
GET /api/v1/users?includeDeleted=true
GET /api/v1/invitations?includeDeleted=true
```

**Response includes deleted records:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Company Name",
      "deletedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Restore Soft-Deleted Records
```
POST /api/v1/companies/{id}/restore
POST /api/v1/users/{id}/restore
POST /api/v1/invitations/{id}/restore
```

**Headers:**
```
Authorization: Bearer <token>
X-Company-Id: <company-uuid>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Company Name",
    "deletedAt": null
  }
}
```

---

## New Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user (returns refreshToken) |
| POST | `/api/v1/auth/login` | User login (returns refreshToken) |
| POST | `/api/v1/auth/refresh` | Refresh tokens using refresh token |
| POST | `/api/v1/auth/logout` | Logout and revoke refresh token |
| POST | `/api/v1/auth/logout-all` | Logout from all devices |
| POST | `/api/v1/auth/switch-company` | Switch active company |
| POST | `/api/v1/auth/refresh-jwt` | Refresh JWT token |
| POST | `/api/v1/companies/:id/restore` | Restore soft-deleted company |
| POST | `/api/v1/users/:id/restore` | Restore soft-deleted user |
| POST | `/api/v1/invitations/:id/restore` | Restore soft-deleted invitation |

### Query Parameters Added
| Parameter | Values | Description |
|-----------|--------|-------------|
| `includeDeleted` | `true` | Include soft-deleted records |
| `companyId` | string | Select company on login (optional) |

---

## Error Responses

### 400 - Company Selection Required
```json
{
  "success": false,
  "data": null,
  "message": "Company selection required. Please provide X-Company-Id header."
}
```

### 403 - No Company Access
```json
{
  "success": false,
  "data": null,
  "message": "You do not have access to this company"
}
```

### 401 - Invalid Company on Switch
```json
{
  "success": false,
  "data": null,
  "message": "User does not have access to this company"
}
```

### 401 - Invalid Credentials
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials"
}
```

### 401 - Invalid or Expired Refresh Token
```json
{
  "success": false,
  "data": null,
  "message": "Invalid or expired refresh token"
}
```
