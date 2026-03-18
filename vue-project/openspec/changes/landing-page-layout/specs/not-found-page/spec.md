# Not Found Page Specification

## Overview

The Not Found (404) page is displayed when users navigate to a route that doesn't exist in the application.

## Purpose

- Provide clear feedback to users when they land on an invalid route
- Help users navigate back to valid pages
- Maintain consistent branding and styling with the rest of the application

## UI/UX Specification

### Layout

- Full viewport height (min-h-screen)
- Centered content
- Gradient background (blue-50 to indigo-100)

### Visual Elements

#### 404 Icon

- Red circle background (red-100)
- Exclamation circle SVG icon in red-600
- Size: w-24 h-24 (96px)

#### Error Message

- Large "404" text: 6xl font, gray-900
- "Page Not Found" heading: 2xl font, gray-700
- Description: "The page you're looking for doesn't exist or has been moved." in gray-600

#### Navigation Options

- "Go Home" button: blue-600 background, white text, hover blue-700
- "Sign In" button: white background, blue-600 text, blue-600 border

### Responsive Behavior

- Single column layout on mobile
- Buttons stack vertically on mobile, horizontal on larger screens
- Padding adjusts for mobile (px-4) vs desktop

## Functionality

### Route Handling

- Catch-all route: `/:pathMatch(.*)*`
- Named route: `not-found`
- Must be the last route in the router configuration

### Navigation

- "Go Home" links to `/` (LandingView)
- "Sign In" links to `/login`

## Acceptance Criteria

1. Invalid routes like `/lo` display the 404 page
2. Page shows 404 icon, message, and navigation options
3. "Go Home" button navigates to landing page
4. "Sign In" button navigates to login page
5. Design matches the landing page styling
