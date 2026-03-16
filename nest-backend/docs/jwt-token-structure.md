# JWT Token Structure Documentation

## Overview
This document describes the JWT token structure changes introduced for multi-company support.

---

## Token Structure

### Legacy Format (Backward Compatible)
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "companyId": "company-uuid",
  "iat": 1704067200,
  "exp": 1704871800
}
```

### New Format with Companies Array
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "companyId": "company-uuid",
  "companies": [
    {
      "companyId": "company-uuid-1",
      "role": "admin"
    },
    {
      "companyId": "company-uuid-2",
      "role": "member"
    }
  ],
  "iat": 1704067200,
  "exp": 1704871800
}
```

---

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `sub` | string | User ID (UUID) |
| `email` | string | User's email address |
| `companyId` | string \| null | Currently active company ID (selected company) |
| `companies` | array | Array of company associations with roles |
| `iat` | number | Issued at timestamp (Unix epoch) |
| `exp` | number | Expiration timestamp (Unix epoch) |

### Companies Array Object

| Field | Type | Description |
|-------|------|-------------|
| `companyId` | string | Company UUID |
| `role` | string | User's role in this company (admin, member, owner) |

---

## Token Generation

### On Registration
1. Create user with company association
2. Generate JWT with:
   - `sub`: User ID
   - `email`: User email
   - `companyId`: Primary company ID
   - `companies`: Array with company and role

### On Login
1. Validate credentials
2. Fetch user's companies from `user_companies` table
3. Generate JWT with current company selections

### On Company Switch
1. Validate user has access to target company
2. Generate new JWT with:
   - Same `sub` and `email`
   - New `companyId` (switched company)
   - Same `companies` array

### On Token Refresh
1. Validate user is still active
2. Fetch latest company associations
3. Generate new JWT with updated `companies` array
4. Handle company removal (see below)

---

## Company Removal Handling

When a user's company access is revoked:

1. **Token Refresh**: On next refresh, the removed company won't be in the `companies` array
2. **Active Token**: Existing tokens remain valid until expiration
3. **API Requests**: If using removed company in `X-Company-Id`, returns 403

### Example: Company Removal Flow
```
User has: ["company-A", "company-B"]
Admin removes: "company-B"

Next token refresh:
- companies: ["company-A"]
- If current companyId was "company-B", switch to "company-A"
```

---

## Client-Side Usage

### Decoding Token (JavaScript)
```javascript
const token = response.accessToken;
const payload = JSON.parse(atob(token.split('.')[1]));

console.log(payload.companies);
// [{ companyId: "uuid1", role: "admin" }, ...]
```

### Selecting Company
```javascript
// Store companies list
const companies = payload.companies;

// For API requests, use selected company
const response = await fetch('/api/v1/companies', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Company-Id': companies[0].companyId
  }
});
```

---

## Backward Compatibility

- **Existing tokens**: Continue to work with legacy `companyId` field
- **New tokens**: Include both `companyId` and `companies` array
- **Validation**: System checks both fields for compatibility

### Migration Path
1. Deploy new backend (supports both formats)
2. Issue new tokens with `companies` array
3. Update clients to use `companies` array
4. Eventually deprecate legacy `companyId` (future)

---

## Security Considerations

1. **Token Size**: Large `companies` array increases token size
   - Recommended: Max 50 companies per user
   - Consider pagination if needed

2. **Token Expiration**: Short-lived tokens (15 min) recommended
   - Use refresh endpoint for long sessions
   - Reduces impact of company removal

3. **Company Validation**: Always validate company access
   - Check `companies` array on each request
   - Use `X-Company-Id` header for multi-company users

---

## API Responses

### Login Response
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "companies": [
      { "companyId": "uuid1", "role": "admin" }
    ]
  },
  "accessToken": "..."
}
```

### Current User Response
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "companies": [
    { "companyId": "uuid1", "role": "admin" },
    { "companyId": "uuid2", "role": "member" }
  ]
}
```
