# Feature Research

**Domain:** Personal Task Management (Todo App)
**Researched:** 2026-04-03
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add task (name) | Core action — without it, there's no app | LOW | Task name is mandatory |
| Complete/uncomplete task | Core action — checking off is the whole point | LOW | Toggle boolean |
| Delete task | Users make mistakes, need cleanup | LOW | Confirm dialog recommended |
| Edit task | Plans change, typos happen | LOW | Inline or modal edit |
| View task list | Primary interface | LOW | Default sorted view |
| Due dates | Users need to know when things are due | LOW | Date picker, optional |
| Task categories/lists | Organization is fundamental | MEDIUM | CRUD for categories, assign tasks |
| Priority levels | Distinguish urgent from nice-to-have | LOW | CRUD for priorities, display on tasks |
| Sort/filter tasks | Find what matters among many tasks | MEDIUM | Filter by category, priority, status |
| Persistent storage | Tasks survive page refresh | MEDIUM | API integration (TalTech) |
| Authentication (login/register) | Personal data requires accounts | MEDIUM | JWT with auto-refresh |
| Loading states | Users need feedback during async ops | LOW | Skeletons or spinners |
| Error handling | Network/API failures happen | MEDIUM | User-friendly error messages |
| Empty states | First-time users see nothing | LOW | Friendly messaging + CTA |
| Task creation form | Structured input for new tasks | LOW | Name, category, priority, due date |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| JWT auto-refresh on 401 | Seamless session management — no manual re-login | MEDIUM | Interceptor pattern, better UX than timer-based |
| Sidebar category navigation | Quick visual filtering without leaving task view | MEDIUM | Collapsible, shows task counts |
| Priority icons (visual) | Instant priority recognition without reading | LOW | Icon-based rather than colored text badges |
| Settings for categories/priorities | User-defined organization system | MEDIUM | CRUD UI separate from task view |
| Protected routes | Security best practice for authenticated areas | LOW | React Router guards |
| Docker deployment | Easy setup, consistent environments | LOW | Dockerfile + docker-compose |
| Tailwind CSS styling | Modern, utility-first, fast iteration | LOW | Consistent design system |
| Task sorting (taskSort field) | User-controlled ordering beyond default | LOW | Numeric sort field from API |
| Category tags | Additional metadata for categories | LOW | Optional tag field from API |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Task descriptions | "More context is always better" | Adds form complexity, scope creep, most users don't write them | Keep task names descriptive; defer to v2+ if validated |
| Task archiving | "Don't want to delete, might need later" | Adds UI complexity, confuses users with "where did it go?" | Use delete for now; API supports isArchived — add later if needed |
| Profile editing in settings | "Users want to change their info" | Distracts from core settings purpose (categories/priorities) | Keep settings focused; profile is separate concern |
| Real-time collaboration | "Wouldn't it be cool if..." | Massive complexity, WebSocket infrastructure, conflict resolution | This is single-user — collaboration is a different product |
| Mobile app | "Everyone uses phones" | Different tech stack, doubles development effort | Responsive web-first approach |
| Natural language input | "Todoist does it, why not us?" | Complex parsing, NLP dependency, overkill for school project | Standard date picker + dropdowns |
| AI scheduling/automation | "AI is trendy" | Over-engineering, doesn't solve core problem | Manual planning with good UX |
| Habit tracking | "TickTick has it" | Different domain, feature bloat | Stay focused on task management |
| Pomodoro timer | "Productivity apps should have timers" | Unrelated to task management, scope creep | Use dedicated timer apps |

## Feature Dependencies

```
Authentication (login/register)
    └──requires──> JWT token handling
                       └──requires──> Auto-refresh interceptor

Task Management (CRUD)
    └──requires──> Authentication
    └──requires──> Categories (for assignment)
    └──requires──> Priorities (for assignment)

Category Management
    └──requires──> Authentication

Priority Management
    └──requires──> Authentication

Task Filtering (sidebar)
    └──requires──> Categories
    └──enhances──> Task List View

Task Sorting
    └──enhances──> Task List View

Protected Routes
    └──requires──> Authentication
    └──enhances──> All authenticated pages

Settings (categories/priorities)
    └──requires──> Category Management
    └──requires──> Priority Management
```

### Dependency Notes

- **Task Management requires Authentication:** All task CRUD operations need valid JWT tokens
- **Task Management requires Categories/Priorities:** Tasks must reference existing category and priority IDs
- **Task Filtering enhances Task List:** Filtering is useless without a task list to filter
- **Protected Routes require Authentication:** Route guards depend on auth state being established
- **Settings requires Category/Priority Management:** Settings UI wraps the CRUD operations

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] User registration with email, password, first name, last name — core auth flow
- [x] User login/logout — session management
- [x] JWT token handling with auto-refresh on 401 — seamless auth
- [x] Protected routes — security baseline
- [x] Todo dashboard (view, add, edit tasks) — core functionality
- [x] Task creation (name, category, priority, due date) — structured input
- [x] Task editing and deletion — task lifecycle
- [x] Task completion toggle — the fundamental todo action
- [x] Task filtering by category via sidebar — navigation pattern
- [x] Priority display with icons — visual differentiation
- [x] Settings CRUD for task categories — user-defined organization
- [x] Settings CRUD for task priorities — user-defined importance
- [x] Docker deployment — deployment requirement
- [x] Tailwind CSS styling — visual polish
- [x] React Router for navigation — routing infrastructure

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Task archiving — API supports it, UI doesn't yet (trigger: users asking for "soft delete")
- [ ] Task descriptions — if users need more context (trigger: feedback on task ambiguity)
- [ ] Profile editing in settings — if users need to update account info (trigger: support requests)
- [ ] Bulk operations (complete all, delete all) — if users manage large lists (trigger: user requests)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Task reminders/notifications — why defer: requires scheduling infrastructure
- [ ] Recurring tasks — why defer: complex scheduling logic
- [ ] Task sharing/collaboration — why defer: multi-user architecture
- [ ] Calendar view — why defer: different UI paradigm
- [ ] Search functionality — why defer: unnecessary for small task lists
- [ ] Export/import tasks — why defer: data portability not critical yet

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Task CRUD | HIGH | LOW | P1 |
| Authentication | HIGH | MEDIUM | P1 |
| Category management | HIGH | MEDIUM | P1 |
| Priority management | MEDIUM | MEDIUM | P1 |
| Task filtering | HIGH | LOW | P1 |
| JWT auto-refresh | HIGH | MEDIUM | P1 |
| Protected routes | HIGH | LOW | P1 |
| Task completion toggle | HIGH | LOW | P1 |
| Settings UI | MEDIUM | MEDIUM | P2 |
| Priority icons | MEDIUM | LOW | P2 |
| Sidebar navigation | HIGH | MEDIUM | P1 |
| Docker deployment | MEDIUM | LOW | P2 |
| Task archiving | LOW | LOW | P3 |
| Task descriptions | LOW | LOW | P3 |
| Profile editing | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Ecosystem Insights (2026)

Key findings from the current todo app landscape that inform our approach:

### What Users Actually Care About
1. **Quick capture speed** — If adding a task takes more than 5 seconds, users abandon the app. This is the #1 predictor of long-term adoption.
2. **Cross-platform sync** — Users expect their tasks everywhere. Our API handles this; frontend just needs reliable auth.
3. **Clean UI over feature density** — Zapier's 2026 review found that "AI-powered features are now common in to-do apps, I never found them broadly useful." Users prefer fast, simple tools over feature-bloated ones.
4. **Trusted system** — Users need to know "if something's in there, it'll get done or renegotiated." Reliability > novelty.

### What the Market Has Converged On
- **Natural language input** is table stakes for commercial apps (Todoist, TickTick) but unnecessary for a school project with structured forms.
- **Freemium pricing** dominates — free tier with paid upgrades. Our project is free by nature.
- **Platform specialization** works — Things 3 succeeds by being Apple-only and doing it beautifully. Our web-first approach is the right constraint.
- **Feature bloat is the enemy** — TickTick succeeds despite (not because of) having Pomodoro + habits + calendar. Most apps succeed by doing fewer things well.

### Anti-Patterns Confirmed by 2026 Reviews
- AI task breakdown features feel like procrastination — users tick off meaningless sub-tasks while avoiding real work.
- Elaborate GTD systems in week one lead to abandonment — start simple, add complexity when needed.
- Mixing personal and team tasks creates noise — our single-user API avoids this entirely.

### Roadmap Implications
- **Phase 1 should deliver working CRUD fast** — users judge todo apps by how quickly they can add and complete tasks.
- **Auth must be seamless** — JWT auto-refresh on 401 is a strong differentiator; broken auth kills trust instantly.
- **Settings can come after core task management** — categories/priorities need to exist before they can be customized.
- **Docker deployment is orthogonal** — can be added in final phase without affecting user experience.

## Competitor Feature Analysis

| Feature | Todoist | TickTick | Things 3 | Our Approach |
|---------|---------|----------|----------|--------------|
| Quick capture | Natural language input | Standard form | Quick Entry | Standard form (sufficient for school project) |
| Organization | Projects + labels | Lists + tags | Areas + tags | Categories + priorities |
| Due dates | Yes + recurring | Yes + recurring | Yes + recurring | Yes (no recurring — v2+) |
| Priorities | 4 levels (P1-P4) | 4 levels | No explicit priorities | User-defined priorities (flexible) |
| Filtering | Smart filters | Multiple views | Tags + search | Sidebar category filter |
| Calendar view | Pro only | Built-in | No | Not in scope |
| Habit tracking | No | Built-in | No | Anti-feature (out of scope) |
| Collaboration | Basic sharing | Basic sharing | Apple only | Anti-feature (single-user) |
| AI scheduling | No | No | No | Anti-feature (over-engineering) |
| Pricing | Freemium ($4/mo Pro) | Freemium ($3/mo) | One-time ($80 total) | Free (school project) |

## Sources

- [Zapier - 7 Best To-Do List Apps 2026](https://zapier.com/blog/best-todo-list-apps/) — Comprehensive review of Todoist, TickTick, Microsoft To Do, Apple Reminders, Things 3, Google Tasks, Any.do. Key finding: AI features broadly unhelpful in todo apps; quick capture speed matters most; cross-platform sync essential.
- [Toolradar - Best Task Management Apps 2026](https://www.toolradar.com/guides/best-task-management-apps) — Feature comparison, evaluation criteria, pricing analysis. Key finding: "Simple is often better — don't buy features you won't use."
- [Todoist vs TickTick 2026](https://thetoolchief.com/comparisons/todoist-vs-ticktick/) — Feature comparison: TickTick wins on built-in features (Pomodoro, habits, calendar), Todoist wins on clean UX and natural language.
- [Todoist vs Things 3 vs TickTick 2026](https://finlyinsights.com/todoist-vs-things-3-vs-ticktick/) — Professional comparison: Todoist for cross-platform, Things 3 for Apple design, TickTick for value.
- [Todoist vs Microsoft To-Do 2026](http://toolfinder.co/comparisons/todoist-vs-microsoft-todo) — Microsoft To Do excels for Outlook users, completely free.
- [Mindful Suite - Best To-Do List Apps 2026](https://www.mindfulsuite.com/reviews/best-to-do-list-apps) — 2026 ecosystem overview.
- Project specification: `.planning/PROJECT.md` — Authoritative requirements.
- TalTech API OpenAPI spec — Defines available endpoints and fields.

---
*Feature research for: React Todo App*
*Researched: 2026-04-03*
