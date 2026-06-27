## Why

The chat-interface frontend currently uses default browser styling (system font, light background `#f9fafb`, centered 720px column). The application has no visual identity, no motion language, and no chat UI surface — only auth/admin/health scaffolding. We need to apply the deliberately-crafted design system (dark amber-accented glassmorphism with orchestrated page-load motion) so the product looks and feels intentional, and introduce the chat panel (sidebar + message stream + glass input bar) that the design describes.

## What Changes

- Establish a frontend design system: CSS custom-property tokens for the palette (base `#0A0A0C`, glass panel `#16161A`, amber accent `#FFB627`, white text at 92% opacity, borders `rgba(255,255,255,0.08)`), typography, radii, motion durations, and easing curves.
- Apply a deliberate glassmorphism treatment (`backdrop-blur-xl` + `bg-white/5` + 1px inset `border-white/10`) to exactly two surfaces — the sidebar and the message input bar. Message bubbles stay flat/solid.
- Build a chat panel UI: left sidebar listing chats (with hover-driven 4px amber left bar), main message stream with flat message bubbles, and a glass message-input bar with an amber send button.
- Add the page-load entrance sequence: background particle/gradient mesh fade-in (0–400ms), sidebar slide-in with blur-to-sharp (200–700ms), chat panel scale 98%→100% + opacity (400–900ms), message cascade ~60ms stagger (600ms+).
- Add a cursor-reactive amber glow that follows the pointer subtly behind the glass surfaces.
- Add micro-interactions: sidebar chat items lighten + 4px amber bar slide-in on hover; send button scales 1.05 + amber glow bloom on hover, 0.95 on click; message bubbles lift `translateY(-2px)` + shadow increase on hover (AI text gets no hover effect).
- Restyle existing surfaces (NavBar, auth pages, admin page, health page) to live inside the new design system so the app feels coherent end-to-end.
- Add a Vitest component test that asserts the new design tokens are applied to the chat panel surface (glass classes on sidebar/input; flat on message bubbles).

## Capabilities

### New Capabilities
- `frontend-design-system`: Visual design system (palette, glass, motion, cursor glow, micro-interactions) and the chat panel UI (sidebar, message stream, glass input bar) it composes into.

### Modified Capabilities
- (none — existing capabilities' requirements are unchanged; the design restyle is an implementation concern, not a requirement change)

## Impact

- **Files**: `frontend/src/index.css` (token + global layer rewrite), new `frontend/src/styles/` module(s) for tokens/utilities, `frontend/src/App.tsx` (route shell, new Chat route), new `frontend/src/components/ChatPanel.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/components/MessageList.tsx`, `frontend/src/components/MessageBubble.tsx`, `frontend/src/components/MessageInput.tsx`, `frontend/src/components/CursorGlow.tsx`, `frontend/src/components/BackdropMesh.tsx`, restyled `NavBar.tsx`/`Login.tsx`/`Register.tsx`/`Admin.tsx`/`HealthCheck.tsx`, new `frontend/tests/ChatPanel.test.tsx` (and updated existing tests for restyled markup if `data-testid` selectors change).
- **Dependencies**: Add `framer-motion` (or use CSS animations + `IntersectionObserver` for the entrance sequence and micro-interactions) and a particle/mesh library or hand-rolled canvas/CSS implementation for the backdrop. Tailwind is **not** required (per design's deliberate scope) but the `bg-white/5` / `backdrop-blur-xl` / `border-white/10` shorthand in the design will be implemented as plain CSS rules that mirror those Tailwind utility outputs.
- **Routing**: New `/chat` (or replace `/` once chat is the primary surface) route wired through `RouteGuard` like the existing protected routes.
- **Accessibility**: Respect `prefers-reduced-motion` — disable entrance sequence, cursor glow, and micro-interaction motion when set. Maintain existing `aria-*` / `data-testid` test hooks.
- **No backend or API changes.**
