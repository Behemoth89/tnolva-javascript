## 1. Design system foundation

- [x] 1.1 Create `frontend/src/styles/tokens.css` with the palette, radii, motion, and easing custom properties (`--color-base`, `--color-glass`, `--color-amber`, `--color-text`, `--color-border`, `--color-elevated`, `--motion-fast`, `--motion-base`, `--motion-slow`, `--ease-out`).
- [x] 1.2 Create `frontend/src/styles/glass.css` exporting the `.glass` utility (backdrop-filter + 1px inset border + bg-white/5) with the Safari `-webkit-` prefix and a `@supports not (backdrop-filter)` fallback.
- [x] 1.3 Create `frontend/src/styles/motion.css` with the `@keyframes` rules for `mesh-fade-in`, `sidebar-slide-in`, `panel-scale-in`, `message-cascade`, plus a single `@media (prefers-reduced-motion: reduce)` block that disables all animations and transitions and hides the cursor glow.
- [x] 1.4 Rewrite `frontend/src/index.css` to import the three style modules, set the body background to `var(--color-base)`, the text color to `var(--color-text)`, the system font stack, and remove the centered 720px column.

## 2. Backdrop and cursor-reactive layers

- [x] 2.1 Implement `frontend/src/components/BackdropMesh.tsx` — a fixed-position, lowest-z-index `<div data-testid="backdrop-mesh">` with two slow-drifting radial gradients in `--color-amber` at low opacity. Mount it once from `App.tsx`.
- [x] 2.2 Implement `frontend/src/components/CursorGlow.tsx` — a `pointer-events: none`, fixed-position `<div data-testid="cursor-glow">` whose CSS variables `--glow-x` and `--glow-y` are updated from a rAF-throttled `mousemove` listener on `window`. Respects `prefers-reduced-motion` (renders `opacity: 0`).
- [x] 2.3 Mount `BackdropMesh` and `CursorGlow` once in `App.tsx` so they sit behind the routed page content.

## 3. Chat surface components

- [x] 3.1 Implement `frontend/src/chat/types.ts` with `Chat`, `Message`, and `Role` types plus `frontend/src/chat/mockData.ts` exporting a small seed list (clearly marked `TODO(chat-backend): replace with real fetch`).
- [x] 3.2 Implement `frontend/src/components/Sidebar.tsx` — an `<aside data-testid="sidebar">` with the `.glass` class, rendering one `<button data-testid="sidebar-chat-item">` per chat with a 4px amber `::before` bar that scales in on hover/focus.
- [x] 3.3 Implement `frontend/src/components/MessageBubble.tsx` — a flat, non-glass bubble with `data-author="user" | "assistant"`, `transform: translateY(-2px)` hover lift for user messages, no hover effect for assistant messages.
- [x] 3.4 Implement `frontend/src/components/MessageList.tsx` — renders an array of `MessageBubble`s, computes `animation-delay: ${index * 60 + 600}ms` per child on first mount only, and does not replay on re-render.
- [x] 3.5 Implement `frontend/src/components/MessageInput.tsx` — a `<form data-testid="message-input-form">` with the `.glass` class, a text field, and a `<button data-testid="message-send">` styled with `--color-amber` that scales 1.05 on hover, 0.95 on `:active`, and calls an `onSend(text)` callback on submit.
- [x] 3.6 Implement `frontend/src/components/ChatPanel.tsx` — composes `Sidebar` + `MessageList` + `MessageInput`, holds local `messagesByChatId` state, applies the `panel-scale-in` keyframes to its `data-testid="chat-panel"` root on first mount, and schedules a local AI reply within 500ms of a send.

## 4. Routing and shell

- [x] 4.1 Add a `/chat` route to `App.tsx`, wrapped in the existing `RouteGuard`, rendering `<ChatPanel />`. Update the NavBar to include a link to `/chat` for authenticated users.
- [x] 4.2 Restyle `NavBar.tsx`, `Login.tsx`, `Register.tsx`, `Admin.tsx`, and `HealthCheck.tsx` to consume the new tokens (background, text color, amber accent) so the existing surfaces live inside the new design language. Keep all existing `data-testid` attributes intact.

## 5. Tests

- [x] 5.1 Add `frontend/tests/ChatPanel.test.tsx` covering: glass class on sidebar and input form (and nowhere else), message cascade delays, hover lift on user bubbles (not on AI bubbles), send button scale + amber token, send appends user + AI messages locally, and `prefers-reduced-motion` disables motion and hides the cursor glow.
- [x] 5.2 Add a tokens/glass regression test (`frontend/tests/designTokens.test.tsx` or extend an existing file) that asserts the document root exposes the required custom properties and that exactly two rendered surfaces have non-`none` `backdrop-filter` when the chat panel is mounted.
- [x] 5.3 Update existing tests (`HealthCheck.test.tsx`, `Login.test.tsx`, `Register.test.tsx`, `Admin.test.tsx`, `RouteGuard.test.tsx`, `NavBar.test.tsx` if present) for any markup changes that affect their selectors, so the full frontend suite still exits 0.

## 6. Verification

- [x] 6.1 Run `npm run test:run` inside `frontend/` and confirm exit code 0.
- [x] 6.2 Run `npm run build` inside `frontend/` and confirm a clean Vite build with no TypeScript errors.
- [ ] 6.3 Run `npm run dev` inside `frontend/` and visually verify: page-load sequence (mesh → sidebar → panel → cascade), cursor glow tracks pointer, glass only on sidebar + input, hover effects match the design, and `prefers-reduced-motion: reduce` (toggled in DevTools rendering tab) collapses all motion.
