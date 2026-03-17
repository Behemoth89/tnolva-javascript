## 1. Landing Page Implementation

- [ ] 1.1 Create `src/views/LandingView.vue`
- [ ] 1.2 Add app branding and description
- [ ] 1.3 Add Login button linking to /login
- [ ] 1.4 Add Register button linking to /register

## 2. App Header Component

- [ ] 2.1 Create `src/components/AppHeader.vue`
- [ ] 2.2 Display user email from auth store
- [ ] 2.3 Include CompanySelector component
- [ ] 2.4 Add logout button calling auth store logout
- [ ] 2.5 Handle logout navigation to landing page

## 3. Main Layout

- [ ] 3.1 Create `src/views/MainView.vue`
- [ ] 3.2 Include AppHeader component
- [ ] 3.3 Add router-view for content

## 4. Router Configuration

- [ ] 4.1 Add / route pointing to LandingView
- [ ] 4.2 Add /app route with MainView layout
- [ ] 4.3 Add auth guard to /app routes
- [ ] 4.4 Configure child routes under /app

## 5. Integration Testing

- [ ] 5.1 Test landing page navigation
- [ ] 5.2 Test login flow to main layout
- [ ] 5.3 Test header displays user info
- [ ] 5.4 Test logout returns to landing
- [ ] 5.5 Test unauthenticated access to /app redirects
