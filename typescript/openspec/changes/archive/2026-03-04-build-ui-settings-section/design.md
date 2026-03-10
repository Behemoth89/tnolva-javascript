## Context

The Task Management Utility currently has no user-facing interface. All data operations occur through unit tests. The application uses:
- **Build System**: Vite + TypeScript (ES Modules)
- **Data Layer**: LocalStorage-based repositories with Unit of Work pattern
- **Business Layer**: BLL services (TaskService, CategoryService, RecurrenceService, etc.)
- **Domain Layer**: Entities and value objects

The immediate need is to provide users with a browser-accessible UI to manage all data entities through CRUD operations, starting with a Settings section.

## Goals / Non-Goals

**Goals:**
- Create a modular UI layer clearly separated from business logic
- Implement Settings section with CRUD operations for all repositories
- Use modern vanilla JavaScript/TypeScript (no external UI frameworks)
- Ensure UI code can be easily removed without affecting existing BLL
- Provide intuitive navigation between entity management pages

**Non-Goals:**
- Main task board view with drag-and-drop (future phase)
- Calendar view (future phase)
- Advanced filtering and search UI (future phase)
- User authentication (not applicable for this local app)
- Responsive mobile-first design (basic responsiveness only)

## Decisions

### 1. UI Layer Location: `src/ui/` directory
**Rationale**: Keeps UI code isolated from business logic. Allows easy removal by deleting entire directory.

**Alternative Considered**: Place UI in `src/views/` - Rejected because `ui/` makes the separation more explicit.

### 2. No Framework Usage - Pure Vanilla TypeScript
**Rationale**: 
- No learning curve for contributors
- Smaller bundle size
- Full control over DOM manipulation
- Can be easily replaced with React/Vue later if needed

**Alternative Considered**: React or Vue - Rejected to keep dependencies minimal and demonstrate vanilla TS capabilities.

### 3. Component-Based Architecture with Custom Elements
**Rationale**: 
- Web Components provide encapsulation
- Can be used like HTML tags in templates
- Native browser support without polyfills for modern browsers

**Alternative Considered**: Plain function-based rendering - Rejected because custom elements are more declarative.

### 4. CSS Variables for Theming
**Rationale**: 
- Easy to modify colors/spacing globally
- Supports dark mode in future
- CSS-in-JS not needed

**Alternative Considered**: CSS Modules - Rejected as CSS variables are simpler for this scope.

### 5. Simple Hash-Based Routing
**Rationale**: 
- No external router dependency
- Works with Vite's dev server
- Easy to understand and maintain

**Alternative Considered**: History API router - Rejected as it requires server config for SPA routing.

### 6. Bridge Pattern for BLL Integration
**Rationale**: 
- UI components don't directly import BLL services
- Creates abstraction layer for easy swapping
- Better testability

**Alternative Considered**: Direct BLL imports - Rejected to maintain loose coupling.

## Risks / Trade-offs

### Risk: BLL Services Designed for Server-Side Use
**Mitigation**: BLL services already work with LocalStorage adapter. UI bridge will handle TypeScript to JavaScript interoperability for browser.

### Risk: Large JavaScript Bundle
**Mitigation**: Using code splitting per page. Vite handles tree-shaking automatically.

### Risk: DOM Manipulation Complexity
**Mitigation**: Using template literals for HTML rendering reduces complexity. Components are small and focused.

### Risk: State Management Complexity
**Mitigation**: Each CRUD page manages its own state. No global state needed for this scope.

### Trade-off: No Form Validation Library
**Mitigation**: Implement basic HTML5 validation + custom validation in bridge layer. Can add library later if needed.

### Trade-off: No Loading States/Error Handling UI
**Mitigation**: Basic error handling via console + toast notifications. Can enhance in future iterations.

## Migration Plan

1. Create `src/ui/` directory structure
2. Add UI entry point to index.html
3. Create base styles (CSS variables)
4. Implement navigation component
5. Implement CRUD pages one by one
6. Test all operations end-to-end

**Rollback**: Delete `src/ui/` directory and remove UI script import from index.html.

## Open Questions

1. **Q**: Should we use a separate HTML file for UI or modify existing index.html?
   **A**: Modify existing index.html to keep single entry point.

2. **Q**: How to handle date/time inputs across browsers?
   **A**: Use native date/datetime-local inputs with fallback display format.

3. **Q**: Should we implement undo for delete operations?
   **A**: Not in initial version - add soft delete confirmation modal instead.

4. **Q**: How to expose BLL services to browser (they use Node modules)?
   **A**: Compile TypeScript to JavaScript - Vite handles this automatically. Services work in browser with LocalStorage.
