## 1. TypeScript Type Definitions

- [x] 1.1 Create `src/api/types.ts` with ApiResponse<T> generic interface
- [x] 1.2 Add User interface with id, email, companies
- [x] 1.3 Add CompanyAssociation interface with companyId, role
- [x] 1.4 Add JWTPayload interface with sub, email, companyId, companies
- [x] 1.5 Add LoginRequest interface with email, password, optional companyId
- [x] 1.6 Add RegisterRequest interface with email, password, firstName, lastName, optional companyName
- [x] 1.7 Add AuthResponse interface with user, accessToken, refreshToken

## 2. API Client Implementation

- [x] 2.1 Create `src/api/client.ts` with ApiClient class
- [x] 2.2 Implement base URL configuration with default `http://localhost:3000/api/v1`
- [x] 2.3 Add method to set access token
- [x] 2.4 Add method to set selected company ID
- [x] 2.5 Implement request() method with fetch, headers, and response unwrapping
- [x] 2.6 Add get(), post(), put(), patch(), delete() helper methods
- [x] 2.7 Implement error handling for 400, 401, 403, 404, 409 status codes
- [x] 2.8 Add JWT decode utility function using atob()

## 3. Authentication Store

- [x] 3.1 Create `src/stores/auth.ts` with Pinia defineStore
- [x] 3.2 Define state: user, accessToken, refreshToken, isLoading, error
- [x] 3.3 Add computed: isAuthenticated
- [x] 3.4 Add setTokens(accessToken, refreshToken) action
- [x] 3.5 Add clearAuth() action to logout
- [x] 3.6 Add setUser(user) action
- [x] 3.7 Add setLoading(isLoading) action
- [x] 3.8 Add setError(error) action
- [x] 3.9 Implement JWT decode to populate user.companies from token

## 4. Testing & Validation

- [x] 4.1 Test API client with mock backend responses
- [x] 4.2 Test auth store state transitions
- [x] 4.3 Test JWT decode with sample tokens
- [x] 4.4 Test error handling for various HTTP status codes
- [x] 4.5 Verify TypeScript types compile without errors
