## Context

The chat-interface frontend is a Vite + React 18 + TypeScript SPA. Today it ships with the browser's default light theme, no design tokens, and no chat UI — only Login/Register/Admin/HealthCheck surfaces and a NavBar, all rendered into a 720px centered column. The design spec under `apply-frontend-design/proposal.md` defines a deliberate dark-amber glassmorphism language with an orchestrated page-load sequence and cursor-reactive glow. The repo has no animation library, no CSS-in-JS, no Tailwind, and no shared styling utility layer — `index.css` is 16 lines of bare resets. Tests run via Vitest + React Testing Library with `jsdom`.

## Goals / Non-Goals

**Goals:**
- Single source of truth for the design system in `frontend/src/styles/tokens.css` (CSS custom properties) so all surfaces consume the same palette, radii, motion durations, and easings.
- Plain-CSS implementation of the glass effect (`backdrop-filter`, `background`, `border`) and the entrance sequence (`@keyframes` + `animation` delays) — no Tailwind dependency.
- React components that compose the design: `BackdropMesh`, `CursorGlow`, `Sidebar`, `MessageList`, `MessageBubble`, `MessageInput`, `ChatPanel`.
- Wire the chat panel into the existing `App.tsx` route table behind `RouteGuard`, alongside the restyled auth/admin/health surfaces.
- Honor `prefers-reduced-motion` by collapsing all entrance, hover, and cursor-glow motion to instant/transparent states.
- Keep all existing `data-testid` selectors stable or update tests in lockstep so the suite stays green.

**Non-Goals:**
- No backend, API, or persistence changes (chat list and messages are local-state-only for this change; a future change will add the WebSocket / streaming layer).
- No internationalization, theming switcher, or light-mode variant.
- No design-system package extraction (tokens stay inside the frontend app for now).
- No new global state library (local `useState` / `useReducer` is enough for the chat surface in this change).
- No changes to the backend, Docker, or CI configuration.

## Decisions

### D1. CSS custom properties for tokens, not Tailwind or CSS-in-JS
**Choice**: Define tokens in `frontend/src/styles/tokens.css` as `:root` custom properties (`--color-base`, `--color-glass`, `--color-amber`, `--color-text`, `--color-border`, `--radius-*`, `--motion-*`, `--ease-*`) and import the file from `main.tsx`. Component styles are plain CSS files co-located as `Component.module.css` or, for very small cases, a single `index.css` block keyed off `data-testid`.
**Rationale**: The design spec uses Tailwind-flavoured shorthand (`backdrop-blur-xl`, `bg-white/5`, `border-white/10`) but adding Tailwind for one design pass is overkill — the exact same values can be expressed as 3–4 CSS lines per surface. Custom properties give us a single edit point for future re-skinning without a build step. CSS-in-JS adds runtime cost and a new dependency for what is fundamentally static styling.
**Alternatives considered**:
- *Tailwind*: would deliver the shorthand verbatim, but pulls a PostCSS toolchain, bloats the bundle, and the project has no other Tailwind usage.
- *styled-components / emotion*: requires a runtime, contradicts the "no extra deps unless justified" stance, and offers no benefit over CSS modules here.

### D2. Glass effect via `backdrop-filter`, scoped to two surfaces
**Choice**: A single `.glass` utility class in `frontend/src/styles/glass.css` implementing `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(24px) saturate(140%)`, `-webkit-backdrop-filter: blur(24px) saturate(140%)`, `border: 1px solid rgba(255,255,255,0.08)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`. Applied **only** to `Sidebar` (root `<aside>`) and `MessageInput` (root `<form>`). Message bubbles use a solid `--color-elevated` fill with no blur.
**Rationale**: Matches the design's "glass on the frame, not the content" rule. Restricting the class to two elements prevents the templated look that comes from blurring everything. Safari needs the `-webkit-` prefix; we ship both.
**Alternatives considered**:
- *Glass on every surface*: explicitly rejected by the design ("glass-on-everything is what makes it look templated").
- *A `.glass-strong` / `.glass-soft` tiered system*: future-proofing for a problem we don't have yet; YAGNI.

### D3. Page-load sequence in pure CSS with `animation-delay`
**Choice**: Each entrance phase is a `@keyframes` rule (`mesh-fade-in`, `sidebar-slide-in`, `panel-scale-in`, `message-cascade`) applied to the relevant root with a `style={{ animationDelay: '<phase-start>ms' }}` (or a CSS variable). Messages inside `MessageList` get their delay computed as `index * 60ms` from the first message onward, only on first mount (gated by a `mounted` ref so re-renders don't replay).
**Rationale**: The design specifies four discrete time windows (0–400, 200–700, 400–900, 600ms+) — `animation-delay` is the most direct expression of that choreography and requires no JS animation loop. Pure CSS also degrades cleanly: if motion is disabled we override `animation: none` and the page is just there.
**Alternatives considered**:
- *Framer Motion / React Spring*: gives more orchestration flexibility than we need and adds ~30KB gz. We don't have exit animations, layout transitions, or gesture conflicts in this change.
- *Web Animations API in a `useEffect`*: works but reinvents what `@keyframes` already gives us for entrance-only motion.

### D4. Cursor-reactive amber glow as a single fixed-position element
**Choice**: `CursorGlow` is a `position: fixed`, `inset: 0`, `pointer-events: none`, `z-index: 0` `<div>` containing a radial-gradient `<div>` whose CSS variables (`--glow-x`, `--glow-y`) are updated on `mousemove` via `requestAnimationFrame` throttling. The gradient is `radial-gradient(closest-side, rgba(255,182,39,0.18), transparent 70%)` masked by the glass surfaces via `mix-blend-mode: screen` and clipped by a `clip-path` matching the sidebar + input-bar geometry.
**Rationale**: One DOM node, one rAF loop, no React re-renders on pointer move. Reading pointer position into CSS variables avoids per-frame style writes on individual elements. `mix-blend-mode: screen` keeps the glow additive without brightening the dark base to gray.
**Alternatives considered**:
- *Per-surface glow*: each glass element owns its own glow → multi-rAF loops, layering artefacts, more CPU on cheap laptops.
- *Canvas*: works but overkill; a single gradient is enough for "subtle" per the design.

### D5. Chat panel as a new `/chat` route, with auth gating
**Choice**: New `ChatPanel` mounted at `/chat` behind the existing `RouteGuard`. The sidebar lists mock chats from a `useState<Chat[]>` seed (no backend in this change). Messages live in `useState<Message[]>` keyed by `chatId`; sending a user message appends to the local array and immediately appends a placeholder AI reply (`"…"` → 400ms later replaced with a canned response) so the micro-interactions and cascade are exercisable end-to-end without a backend.
**Rationale**: Lets the change ship and be demoable in isolation. The placeholder reply pattern (which the design implicitly assumes via "messages cascade in") is the cheapest way to validate the visual contract. A future change will swap the seed for real WebSocket / streaming responses.
**Alternatives considered**:
- *Replace `/` with the chat panel now*: breaks the existing HealthCheck surface that has its own test; bigger blast radius.
- *Render chat unconditionally*: skips auth gating, contradicts the existing RouteGuard pattern.

### D6. Micro-interactions via CSS `:hover` / `:active`, not JS
**Choice**: Sidebar item hover (background lightens + 4px amber left bar slides in) and send button hover/active (scale 1.05 / 0.95 + amber glow bloom) are pure CSS via `transition` + `transform` + a `::before` pseudo-element for the amber bar. Message bubble hover lift is a `transform: translateY(-2px)` + `box-shadow` change gated by a class added on `pointerenter` / removed on `pointerleave` via a tiny `useState` per bubble (or a CSS-only approach with `:hover` on a wrapping `<div>`).
**Rationale**: No animation library needed; CSS `:hover` is universally supported and respects `prefers-reduced-motion` via a media-query override. The amber bar slide-in uses a `::before` with `transform: scaleY(0) → scaleY(1)` and `transform-origin: center` so it grows from the middle, not from a corner.
**Alternatives considered**:
- *JS-driven hover via `onMouseEnter`*: more control but pointless for these static transitions; adds re-renders.

### D7. `prefers-reduced-motion` honored globally
**Choice**: A single `@media (prefers-reduced-motion: reduce)` block at the bottom of `index.css` (or a dedicated `motion.css`) that sets `animation: none !important; transition: none !important;` on `*` and hides the `CursorGlow` (or sets its opacity to 0). This satisfies the design's accessibility obligation in one place.
**Rationale**: Centralized override is auditable in a single grep and impossible to miss when adding new motion later. Per-component checks would be error-prone.

## Risks / Trade-offs

- **R1: `backdrop-filter` performance on low-end hardware** → Mitigation: limit blurred surfaces to two (per design), cap `backdrop-filter: blur(24px)` (not 40+), and provide a `@supports not (backdrop-filter: blur(1px))` fallback that swaps glass for a solid `rgba(22,22,26,0.85)` fill.
- **R2: Cursor glow causes repaints on `mousemove`** → Mitigation: throttled rAF writer; glow element is its own composited layer (`will-change: transform`); uses CSS variables not inline `style.left/top` to avoid layout thrash.
- **R3: Existing tests fail after NavBar/auth surfaces are restyled** → Mitigation: keep every existing `data-testid` attribute; if a selector must change, update the test in the same commit (already a frontend convention from `HealthCheck.test.tsx`).
- **R4: `prefers-reduced-motion` users still see the cursor glow if not hidden** → Mitigation: D7 explicitly hides `CursorGlow` in the reduced-motion media query, and the entrance animations collapse to instant.
- **R5: Mock chat seed makes the change feel "fake" before a real backend exists** → Mitigation: clearly mark the mock data with a `// TODO(chat-backend): replace with real fetch` comment and isolate it in `frontend/src/chat/mockData.ts` so the future swap is one file.
- **R6: Plain-CSS modules don't get type-checked class names** → Mitigation: co-locate styles next to components; rely on `data-testid` (not class names) for test selectors; add a lightweight `tsconfig` `noUncheckedIndexedAccess` discipline for the few places we index by chat id.

## Open Questions

- **OQ1**: Should the chat panel become the new landing route at `/` (replacing HealthCheck), or stay at a separate `/chat` route during this change? Proposal currently assumes `/chat`; confirming avoids a bigger blast radius on HealthCheck and its test.
- **OQ2**: Do we want a `framer-motion` dependency for future-proofing exit/drag motion, or stay CSS-only until a concrete need appears? Default in this change: stay CSS-only.
- **OQ3**: Should the `BackdropMesh` be a `<canvas>` (more flexible, slightly more code) or a CSS-only animated gradient (cheaper, less "particle-y")? Default in this change: CSS-only gradient mesh with two slow-drifting radial gradients; defer the canvas particle field to a polish pass.
