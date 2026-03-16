# API Documentation - Multi-Company & Soft Delete Features

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Company Context Headers](#company-context-headers)
3. [Soft Delete Query Parameters](#soft-delete-query-parameters)
4. [New Endpoints](#new-endpoints)

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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "companies": [
      { "companyId": "uuid1", "role": "admin" },
      { "companyId": "uuid2", "role": "member" }
    ]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Token
```
POST /api/v1/auth/refresh
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Switch Company
```
POST /api/v1/auth/switch-company
```

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

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
[
  {
    "id": "uuid",
    "name": "Company Name",
    "deletedAt": "2024-01-15T10:30:00.000Z"
  }
]
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
  "id": "uuid",
  "name": "Company Name",
  "deletedAt": null
}
```

---

## New Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/switch-company` | Switch active company |
| POST | `/api/v1/auth/refresh` | Refresh access token |
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
  "statusCode": 400,
  "message": "Company selection required. Please provide X-Company-Id header.",
  "error": "Bad Request"
}
```

### 403 - No Company Access
```json
{
  "statusCode": 403,
  "message": "You do not have access to this company",
  "error": "Forbidden"
}
```

### 401 - Invalid Company on Switch
```json
{
  "statusCode": 401,
  "message": "User does not have access to this company",
  "error": "Unauthorized"
}
```
