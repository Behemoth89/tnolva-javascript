## 1. TypeScript Type Definitions

- [ ] 1.1 Create `src/api/types.ts` with ApiResponse<T> generic interface
- [ ] 1.2 Add User interface with id, email, companies
- [ ] 1.3 Add CompanyAssociation interface with companyId, role
- [ ] 1.4 Add JWTPayload interface with sub, email, companyId, companies
- [ ] 1.5 Add LoginRequest interface with email, password, optional companyId
- [ ] 1.6 Add RegisterRequest interface with email, password, firstName, lastName, optional companyName
- [ ] 1.7 Add AuthResponse interface with user, accessToken, refreshToken

## 2. API Client Implementation

- [ ] 2.1 Create `src/api/client.ts` with ApiClient class
- [ ] 2.2 Implement base URL configuration with default `http://localhost:3000/api/v1`
- [ ] 2.3 Add method to set access token
- [ ] 2.4 Add method to set selected company ID
- [ ] 2.5 Implement request() method with fetch, headers, and response unwrapping
- [ ] 2.6 Add get(), post(), put(), patch(), delete() helper methods
- [ ] 2.7 Implement error handling for 400, 401, 403, 404, 409 status codes
- [ ] 2.8 Add JWT decode utility function using atob()

## 3. Authentication Store

- [ ] 3.1 Create `src/stores/auth.ts` with Pinia defineStore
- [ ] 3.2 Define state: user, accessToken, refreshToken, isLoading, error
- [ ] 3.3 Add computed: isAuthenticated
- [ ] 3.4 Add setTokens(accessToken, refreshToken) action
- [ ] 3.5 Add clearAuth() action to logout
- [ ] 3.6 Add setUser(user) action
- [ ] 3.7 Add setLoading(isLoading) action
- [ ] 3.8 Add setError(error) action
- [ ] 3.9 Implement JWT decode to populate user.companies from token

## 4. Testing & Validation

- [ ] 4.1 Test API client with mock backend responses
- [ ] 4.2 Test auth store state transitions
- [ ] 4.3 Test JWT decode with sample tokens
- [ ] 4.4 Test error handling for various HTTP status codes
- [ ] 4.5 Verify TypeScript types compile without errors
