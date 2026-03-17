## 1. Token Refresh Implementation

- [ ] 1.1 Add refreshToken() method to API client
- [ ] 1.2 Implement 401 detection in response handler
- [ ] 1.3 Add refresh token request to /api/v1/auth/refresh
- [ ] 1.4 Update auth store with new tokens after refresh
- [ ] 1.5 Implement request retry after successful refresh
- [ ] 1.6 Add flag to prevent infinite refresh loops
- [ ] 1.7 Handle refresh failure - redirect to login

## 2. Testing

- [ ] 2.1 Test auto-refresh on 401 response
- [ ] 2.2 Test retry of original request
- [ ] 2.3 Test redirect to login on refresh failure
- [ ] 2.4 Test infinite loop prevention
