<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - III. Test-Driven Development → III. Spec-Driven Development
  - IV. Code Quality Gates → IV. Automated Testing
- Removed sections:
  - Development Workflow (PR/merge process removed)
- Templates updated: ✅ All templates remain compatible
-->

# vue-todo Constitution

## Core Principles

### I. Component-First Architecture

Every feature starts as a self-contained Vue component. Components MUST be independently testable, properly typed, and have a clear single purpose. Reusable logic MUST be extracted into composables or stores with explicit dependencies.

### II. TypeScript Strict Mode

TypeScript type safety is mandatory. The codebase MUST pass `vue-tsc --build` without errors. Use of `any` type is prohibited except in specific, documented edge cases. All component props, store state, and function return types MUST be explicitly defined.

### III. Spec-Driven Development

Features MUST be implemented according to written specifications. Before writing code, define what the feature should do via feature specs. Tests verify the implementation matches the spec. All components and stores SHOULD have corresponding unit tests.

### IV. Automated Testing

Code MUST pass automated tests before committing. The following checks MUST pass:

- `npm run type-check` (TypeScript validation)
- `npm run test:unit` (all tests pass)
- `npm run lint` (ESLint + oxlint - optional but recommended)

### V. Single Responsibility

Each component, store, composable, and utility function MUST have a single, well-defined responsibility. When a file exceeds 200 lines or handles more than one concern, it MUST be refactored into smaller, focused units.

## Technology Stack

The project uses the following confirmed technology stack. Adding new dependencies requires justification and review.

- **Framework**: Vue 3.5+ with Composition API
- **Build Tool**: Vite 7+
- **Language**: TypeScript 5.9+ (strict mode)
- **State Management**: Pinia 3+
- **Routing**: Vue Router 5+
- **HTTP Client**: Native fetch API (no external library)
- **Testing**: Vitest 4+ with @vue/test-utils
- **Linting**: ESLint 10+ with oxlint 1.50+, Prettier 3.8+
- **Node Version**: ^20.19.0 || >=22.12.0

## Governance

This constitution supersedes all other development practices. Amendments require:

1. Documentation of the proposed change
2. Update to version following semantic versioning:
   - MAJOR: Backward incompatible principle changes
   - MINOR: New principle or section additions
   - PATCH: Clarifications, wording, typo fixes
3. Update to LAST_AMENDED_DATE

Before committing, verify code passes type-check and tests. Complexity MUST be justified; simpler alternatives SHOULD be preferred.

**Version**: 1.1.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
