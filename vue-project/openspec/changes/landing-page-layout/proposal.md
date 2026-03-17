## Why

Users need a landing page to access the application. Unauthenticated users should see a public landing page with login/register options. Authenticated users should see the main application layout with navigation, company selector, and logout functionality. This brings together all the authentication components into a cohesive user experience.

## What Changes

- **Landing Page**: Public landing page with app description and login/register buttons
- **Main Layout**: Authenticated layout with header, navigation, and content area
- **Header Component**: Show user info, company selector, logout button
- **Router Setup**: Configure routes for landing, login, register, and protected app areas

## Capabilities

### New Capabilities

- `landing-page`: Public landing page view
- `main-layout`: Authenticated application layout
- `app-header`: Header with navigation and user menu

### Modified Capabilities

- `router`: Configure all routes and navigation

## Impact

- **New Files**: `src/views/LandingView.vue`, `src/views/MainView.vue`, `src/components/AppHeader.vue`
- **Files Modified**: `src/router/index.ts`
