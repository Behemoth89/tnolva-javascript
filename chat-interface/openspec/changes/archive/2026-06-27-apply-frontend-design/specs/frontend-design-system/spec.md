## ADDED Requirements

### Requirement: Design tokens are defined as CSS custom properties
The frontend SHALL expose a single set of CSS custom properties on `:root` (loaded from `frontend/src/styles/tokens.css`) that define the palette, radii, motion durations, and easings used across the app. The palette SHALL include `--color-base: #0A0A0C`, `--color-glass: #16161A`, `--color-amber: #FFB627`, `--color-text: rgba(255,255,255,0.92)`, and `--color-border: rgba(255,255,255,0.08)`. Motion tokens SHALL include `--motion-fast`, `--motion-base`, and `--motion-slow` duration values plus at least one `--ease-out` cubic-bezier.

#### Scenario: Tokens file is loaded by the app entry point
- **WHEN** the application boots
- **THEN** `main.tsx` imports `frontend/src/styles/tokens.css` before rendering `<App />`
- **AND** the document root's computed `--color-base` resolves to `rgb(10, 10, 12)` (or equivalent for `#0A0A0C`)

#### Scenario: Required token names exist
- **WHEN** a test inspects `getComputedStyle(document.documentElement)`
- **THEN** `--color-base`, `--color-glass`, `--color-amber`, `--color-text`, `--color-border`, `--motion-base`, and `--ease-out` are all present and non-empty

### Requirement: Base page background uses the dark base color and system font stack
The application body SHALL render against the dark base color (`--color-base`) and SHALL use a modern system font stack. The light default background and centered 720px column previously set in `index.css` SHALL be removed.

#### Scenario: Body background resolves to the base token
- **WHEN** the app is rendered
- **THEN** the `<body>` computed `background-color` matches the value of `--color-base`
- **AND** `color` matches the value of `--color-text`

### Requirement: Backdrop mesh renders behind all content
The application SHALL mount a `BackdropMesh` component that renders a subtle animated gradient mesh behind the application shell. The mesh SHALL fade in over the first 0–400ms after mount and SHALL sit at the lowest z-index in the stacking context (behind all other surfaces).

#### Scenario: Mesh element is present and behind content
- **WHEN** the app renders
- **THEN** a `[data-testid="backdrop-mesh"]` element exists
- **AND** its computed `z-index` is less than the z-index of the sidebar and the chat panel

#### Scenario: Mesh fades in on first mount
- **WHEN** the app first mounts
- **THEN** the mesh element's `opacity` transitions from 0 to 1 within the first 400ms

### Requirement: Cursor-reactive amber glow follows the pointer
The application SHALL mount a `CursorGlow` component that renders a fixed-position radial-gradient element tracking the pointer via a `mousemove` listener (rAF-throttled). The glow SHALL use the `--color-amber` token at low opacity, SHALL be non-interactive (`pointer-events: none`), and SHALL render behind the glass surfaces.

#### Scenario: Glow element is present and non-interactive
- **WHEN** the app renders
- **THEN** a `[data-testid="cursor-glow"]` element exists
- **AND** its computed `pointer-events` is `none`
- **AND** its z-index is less than the sidebar's z-index

#### Scenario: Glow position updates on pointer move
- **WHEN** a `mousemove` event fires at coordinates `(x, y)`
- **THEN** the glow element's CSS custom properties `--glow-x` and `--glow-y` reflect those coordinates (within one rAF frame)

#### Scenario: Glow is hidden under reduced motion
- **WHEN** the user has `prefers-reduced-motion: reduce` set
- **THEN** the `CursorGlow` element has computed `opacity: 0` (or is not rendered)

### Requirement: Sidebar uses the glass effect and lists chats
The `Sidebar` component SHALL render an `<aside>` with the `.glass` utility applied (`backdrop-filter: blur(24px)`, `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.08)`). The sidebar SHALL list at least one chat item per chat in its `chats` prop, each rendered as a button with `data-testid="sidebar-chat-item"`.

#### Scenario: Sidebar applies the glass class
- **WHEN** `Sidebar` is rendered
- **THEN** its root element has `data-testid="sidebar"`
- **AND** its computed `backdrop-filter` is non-`none` (or `-webkit-backdrop-filter` is non-`none` for Safari)

#### Scenario: Sidebar lists chats
- **WHEN** `Sidebar` is rendered with `chats={[{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]}`
- **THEN** exactly two `[data-testid="sidebar-chat-item"]` elements are in the document
- **AND** clicking the chat with id `a` invokes the `onSelectChat` callback with `'a'`

#### Scenario: Sidebar slides in on first mount
- **WHEN** the app first mounts
- **THEN** the sidebar's `transform` animates from `translateX(-100%)` to `translateX(0)` between 200ms and 700ms after mount

### Requirement: Sidebar chat items show a 4px amber bar on hover
Each sidebar chat item SHALL render a 4px-wide amber bar (`--color-amber`) on its left edge that is hidden by default and slides in (via a `::before` pseudo-element with `transform: scaleY`) when the item is hovered or focused. The bar SHALL grow from the vertical center, not from a corner.

#### Scenario: Amber bar appears on hover
- **WHEN** the user hovers a `[data-testid="sidebar-chat-item"]`
- **THEN** the item's `::before` `transform` is `scaleY(1)` (bar visible)
- **AND** when the pointer leaves, the bar returns to `scaleY(0)` via transition

### Requirement: Message bubbles are flat, not glassed
The `MessageBubble` component SHALL render each message on a solid (non-glass) surface using an elevated token color. Bubbles SHALL NOT apply `backdrop-filter`. AI messages and user messages SHALL be distinguishable (e.g., different background or alignment) so the cascade and hover effects are visible per side.

#### Scenario: Bubble has no backdrop blur
- **WHEN** a `MessageBubble` is rendered
- **THEN** its computed `backdrop-filter` is `none`
- **AND** its computed `-webkit-backdrop-filter` is `none`

#### Scenario: Bubble background uses an elevated solid color
- **WHEN** a user message bubble is rendered
- **THEN** its computed `background-color` is a solid (alpha = 1) value, not a translucent glass value

### Requirement: Message bubbles lift on hover; AI text has no hover effect
User message bubbles SHALL translate `translateY(-2px)` and increase `box-shadow` on hover. AI message bubbles SHALL NOT change on hover. The cascade entrance animation SHALL still apply to both.

#### Scenario: User bubble lifts on hover
- **WHEN** the user hovers a user `MessageBubble`
- **THEN** its computed `transform` includes `translateY(-2px)`
- **AND** its `box-shadow` value is larger than its non-hover value

#### Scenario: AI bubble does not lift on hover
- **WHEN** the user hovers an AI `MessageBubble`
- **THEN** its `transform` is unchanged from its non-hover value

### Requirement: Messages cascade in with a 60ms stagger
The `MessageList` component SHALL animate its message bubbles in with a per-index `animation-delay` of `index * 60ms`, starting from the first message at 600ms after mount. The cascade SHALL only play on first mount (not on subsequent re-renders, e.g. when a new message is appended after sending).

#### Scenario: First mount cascade timing
- **WHEN** `MessageList` first mounts with 3 messages
- **THEN** the first message's `animation-delay` is `600ms`
- **AND** the second message's `animation-delay` is `660ms`
- **AND** the third message's `animation-delay` is `720ms`

#### Scenario: No replay on re-render
- **WHEN** a new message is appended to the list (e.g. after sending)
- **THEN** the existing messages do not replay their entrance animation

### Requirement: Message input bar uses the glass effect and amber send button
The `MessageInput` component SHALL render a `<form>` with the `.glass` utility applied. It SHALL contain a text field and a send button styled with the `--color-amber` token. The send button SHALL scale to 1.05 with an amber glow bloom on hover and to 0.95 on `:active`.

#### Scenario: Input form applies the glass class
- **WHEN** `MessageInput` is rendered
- **THEN** its root form element has `data-testid="message-input-form"`
- **AND** its computed `backdrop-filter` is non-`none`

#### Scenario: Send button uses the amber token
- **WHEN** the send button is rendered
- **THEN** it has `data-testid="message-send"`
- **AND** its computed `background-color` matches the value of `--color-amber`

#### Scenario: Send button scales on hover and active
- **WHEN** the user hovers the send button
- **THEN** its computed `transform` is `scale(1.05)` (or includes that scale)
- **WHEN** the user activates (mousedown / `:active`) the send button
- **THEN** its computed `transform` is `scale(0.95)`

### Requirement: Chat panel scales from 98% to 100% on first mount
The `ChatPanel` component SHALL scale its root from `scale(0.98)` to `scale(1)` and fade in (`opacity: 0 → 1`) between 400ms and 900ms after first mount.

#### Scenario: Chat panel entrance transform
- **WHEN** `ChatPanel` first mounts
- **THEN** its root element has `data-testid="chat-panel"`
- **AND** the `panel-scale-in` keyframes (or equivalent) animate its `transform` from `scale(0.98)` to `scale(1)` and its `opacity` from `0` to `1` between 400ms and 900ms

### Requirement: Glass surfaces are limited to sidebar and message input
The `.glass` utility class SHALL be applied to exactly two component roots in the chat surface: the `Sidebar` and the `MessageInput`. It SHALL NOT be applied to `MessageBubble`, `MessageList`, `BackdropMesh`, or `CursorGlow`.

#### Scenario: Only sidebar and input form have backdrop blur
- **WHEN** the chat panel is rendered
- **THEN** among `[data-testid="chat-panel"]`, `[data-testid="sidebar"]`, `[data-testid="message-input-form"]`, and the rendered message bubbles, exactly two elements have a non-`none` computed `backdrop-filter`: the sidebar and the input form

### Requirement: Chat panel is mounted behind the existing RouteGuard
The application SHALL mount the `ChatPanel` at the `/chat` route, wrapped in the existing `RouteGuard` so unauthenticated users are redirected.

#### Scenario: Chat route is protected
- **WHEN** an unauthenticated user navigates to `/chat`
- **THEN** `RouteGuard` redirects them (the rendered route is not `ChatPanel`)

#### Scenario: Chat route is reachable when authenticated
- **WHEN** an authenticated user navigates to `/chat`
- **THEN** the rendered route is `ChatPanel`
- **AND** the chat panel, sidebar, and message input are all visible in the DOM

### Requirement: Sending a message appends user and AI messages locally
The `ChatPanel` component SHALL accept a chat id, render any existing messages for that chat from local state, and on submit of `MessageInput` append the user's text as a new message and immediately schedule (within 500ms) an AI reply appended to the same list. No network request SHALL be issued in this change.

#### Scenario: Send appends a user message
- **WHEN** the user types "hello" into the input and clicks the send button
- **THEN** a new message bubble with text "hello" and `role="user"` appears in the list

#### Scenario: Send triggers a local AI reply
- **WHEN** the user sends a message
- **THEN** within 500ms a new message bubble with `role="assistant"` is appended to the list
- **AND** the new user message's `animation-delay` is `0` (cascade does not replay for old messages; the new one is animated only on first mount per Requirement: cascade)

### Requirement: Reduced-motion users see no entrance, hover, or cursor motion
When the user has `prefers-reduced-motion: reduce` set, all entrance animations, hover transitions, and the cursor-reactive glow SHALL be disabled. The page SHALL render in its final state immediately.

#### Scenario: Animations collapse under reduced motion
- **WHEN** the test environment sets `prefers-reduced-motion: reduce`
- **THEN** the entrance keyframes are not applied (computed `animation-name` is `none` on sidebar, chat panel, and message bubbles)
- **AND** the cursor glow is hidden
- **AND** hover transitions still apply state changes (background, border) but do not animate `transform` over time
