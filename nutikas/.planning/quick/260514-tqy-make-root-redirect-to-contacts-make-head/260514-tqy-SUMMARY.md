---
phase: quick
status: complete
date: 2026-05-14
quick_id: 260514-tqy
description: "make root redirect to contacts. make header to page. put login and register buttons to header to right. when logged in then display logout button the right. left from logout button display logged in user name and underneath username. make home button to header. display contests where i have registred my team diferently. make my teams button for contests that have my registred team"
commit: cdf0402
---

# Quick Task 260514-tqy: UI Header and Auth

**Executed:** 2026-05-14
**Status:** ✓ Complete

## Summary

Implemented persistent header navigation with auth-aware buttons, root URL redirect, and contest list differentiation for registered teams.

## Changes

| File | Change |
|------|--------|
| src/router/index.ts | Added `/` → `/contests` redirect |
| src/stores/auth.ts | Added userName, userFirstName, decodeJwt() |
| src/components/AppHeader.vue | New component with Home, auth buttons |
| src/App.vue | Added AppHeader above router-view |
| src/views/ContestsView.vue | Added team differentiation, My Teams button |

## Key Features

- **Root redirect:** `/` → `/contests`
- **AppHeader:** Persistent across all pages with Home link on left
- **Auth-aware buttons:**
  - Guest: Login + Register buttons
  - Authenticated: User name + "Logged in" subtitle + Logout button
- **Contest differentiation:** Cards with registered teams get blue border + light blue background
- **My Teams button:** Appears on contests where user has registered team

## Verification

- [x] Root URL redirects to /contests
- [x] AppHeader visible on all pages
- [x] Login/Register shown when logged out
- [x] User name + Logout shown when logged in
- [x] Contests with user's teams visually distinct
- [x] My Teams button navigates to /contests/:id/my-teams

## Commits

- `cdf0402` — feat(ui): add AppHeader, root redirect, auth state display, contest differentiation