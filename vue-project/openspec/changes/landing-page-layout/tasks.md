## 1. Landing Page Implementation

- [x] 1.1 Create `src/views/LandingView.vue`
- [x] 1.2 Add app branding and description
- [x] 1.3 Add Login button linking to /login
- [x] 1.4 Add Register button linking to /register

## 2. App Header Component

- [x] 2.1 Create `src/components/AppHeader.vue`
- [x] 2.2 Display user email from auth store
- [x] 2.3 Include CompanySelector component
- [x] 2.4 Add logout button calling auth store logout
- [x] 2.5 Handle logout navigation to landing page

## 3. Main Layout

- [x] 3.1 Create `src/views/MainView.vue`
- [x] 3.2 Include AppHeader component
- [x] 3.3 Add router-view for content

## 4. Router Configuration

- [x] 4.1 Add / route pointing to LandingView
- [x] 4.2 Add /app route with MainView layout
- [x] 4.3 Add auth guard to /app routes
- [x] 4.4 Configure child routes under /app

## 5. Integration Testing

- [ ] 5.1 Test landing page navigation
- [ ] 5.2 Test login flow to main layout
- [ ] 5.3 Test header displays user info
- [ ] 5.4 Test logout returns to landing
- [ ] 5.5 Test unauthenticated access to /app redirects

## 6. Not Found Page (404)

- [x] 6.1 Create `src/views/NotFoundView.vue`
- [x] 6.2 Add 404 message with navigation options
- [x] 6.3 Add catch-all route in router
- [x] 6.4 Test invalid routes show 404 page
