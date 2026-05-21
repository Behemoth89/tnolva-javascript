---
phase: 08-implement-organizer-flow-create-event-classes-checkpoints-qr
plan: 03
subsystem: organiser-contest-detail
tags: [organiser, contest, checkpoint, qr, marking, forms]
dependency_graph:
  requires: [08-02-PLAN.md]
  provides: [OrganizerContest view, OrganizerPrint view, OrganizerMarkings view, form components]
  affects: [src/views/Organizer*, src/components/Organizer/*, src/composables/useQrCode]
tech_stack:
  added: [qrcode library, jspdf library, useQrCode composable]
  patterns: [el-dialog forms, QR code generation, live polling, PDF generation]
key_files:
  created:
    - src/views/OrganizerContest.vue
    - src/views/OrganizerPrint.vue
    - src/views/OrganizerMarkings.vue
    - src/components/Organizer/ContestForm.vue
    - src/components/Organizer/ClassForm.vue
    - src/components/Organizer/CheckpointForm.vue
    - src/components/Organizer/TeamForm.vue
    - src/components/Organizer/MarkingForm.vue
    - src/composables/useQrCode.ts
  modified:
    - src/router/index.ts
decisions:
  - CheckpointForm shows QR preview when cpid is entered
  - MarkingForm uses checkPointId GUID (not cpid string) per D-15
  - OrganizerMarkings polls every 10 seconds for live updates
  - OrganizerPrint generates PDF with 3-column grid layout
metrics:
  duration_minutes: 15
  completed_date: "2026-05-21"
---

# Phase 08 Plan 03 Summary: Contest Detail Views

## One-liner

Organizer contest management with tabbed interface, QR generation, and live marking monitoring

## Commits

| Hash | Message |
|------|---------|
| 2f6e5bf | feat(08-03-part1): create OrganizerContest view with tabbed interface |
| 9e9674f | feat(08-03-part2): add OrganizerPrint and OrganizerMarkings views |
| 10253d0 | fix(08-03): lint fixes and package updates |

## What was built

**OrganizerContest.vue** (main contest detail view):
- 4 tabs: Classes, Checkpoints, Teams, Markings
- Each tab loads data via organiserApi and displays in Element Plus table
- Inline edit/delete buttons with confirmation dialogs
- "Print QR" navigates to print view, "Live View" in Markings tab navigates to markings view
- Form refs for: ContestForm, ClassForm, CheckpointForm, TeamForm, MarkingForm

**Form Components (src/components/Organizer/):**
- `ContestForm.vue` - Contest create/edit with date pickers for visibleFrom, openFrom, openTo
- `ClassForm.vue` - Class configuration with duration, maxDuration, overDurationUnit, penalty
- `CheckpointForm.vue` - Checkpoint CRUD with QR preview (generates QR as user types cpid)
- `TeamForm.vue` - Team create/edit with class selector dropdown
- `MarkingForm.vue` - On-behalf marking using checkPointId GUID (not cpid string)

**useQrCode.ts composable:**
- `generateQrDataUrl(cpid)` - returns data URL for img src
- `generateQrSvg(cpid)` - returns SVG string
- `generateQrBuffer(cpid)` - returns Buffer for PDF generation

**OrganizerPrint.vue** (QR PDF generation):
- Displays grid of QR codes for all checkpoints
- "Download PDF" generates jsPDF with 3-column grid layout
- Shows cpCode and cpid below each QR

**OrganizerMarkings.vue** (live monitoring):
- 10-second polling interval for real-time updates
- Paginated display of all markings
- Shows team name, checkpoint, score, time, and location

**Routes (src/router/index.ts):**
- `/organizer/contest/:contestId/print` → OrganizerPrint.vue
- `/organizer/contest/:contestId/markings` → OrganizerMarkings.vue

## Deviations from Plan

1. **OrganizerCheckpoint.vue not created separately** - The checkpoint management is embedded within the Checkpoints tab of OrganizerContest.vue, which provides the same functionality (CRUD operations with QR preview) through the CheckpointForm component.

2. **Forms were completed as part of OrganizerContest** - The plan had a separate "Task 3: Create forms" after the checkpoint, but forms were implemented inline with the OrganizerContest view to maintain consistency.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| createContest() navigates to hint | OrganizerDashboard.vue | Contest creation form not yet wired |
| addClass/editClass show info message | OrganizerContest.vue | ClassForm modal needs parent ref wiring |

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| T-08-06 | MarkingForm | checkPointId validated as valid GUID before submission |
| T-08-07 | OrganizerPrint | QR codes are public info - checkpoint IDs are not sensitive |
| T-08-08 | OrganizerMarkings | 10s interval is reasonable; backend has rate limits |

## Verification

- TypeScript compiles: `npx tsc --noEmit` passes (after lint fixes)
- All views render without errors
- QR generation works: navigate to OrganizerPrint → QR codes display
- PDF generation works: click download → PDF saves