# Phase 6: Offline Support - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 6-Offline Support
**Areas discussed:** Queue storage schema, Sync strategy, Offline indicator UI, Pending count display, Scan-while-offline behavior

---

## Queue storage schema

| Option | Description | Selected |
|--------|-------------|----------|
| Basic (5 fields) | Minimal: checkpoint ID, team ID, location, timestamp, synced flag | |
| With metadata (8 fields) | Adds retry count, last error, created timestamp — helps debug sync issues | ✓ |
| Minimal + flexible | Minimal + allow extra fields later without schema changes | |

**User's choice:** With metadata (8 fields)
**Notes:** User wants retry tracking and error messages to help debug sync issues.

---

## Sync strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-sync on reconnect (Recommended) | When back online, automatically process the queue. Best UX — user doesn't have to think about it. | ✓ |
| Manual sync button | Show 'Sync now' button when back online. User has control over when sync happens. | |
| Hybrid | Both: auto-sync in background, but also show manual trigger option | |

**User's choice:** Auto-sync on reconnect (Recommended)
**Notes:** Best user experience — automatic, no manual intervention needed.

---

## Offline indicator UI

| Option | Description | Selected |
|--------|-------------|----------|
| Top banner | Persistent top banner — always visible, clear offline state | |
| Header badge | Small colored badge in header — less intrusive but still visible | ✓ |
| Inline only | Show only when user tries to do something that requires online | |

**User's choice:** Header badge
**Notes:** Header badge is less intrusive but still visible on all screens.

---

## Pending count display

| Option | Description | Selected |
|--------|-------------|----------|
| In offline indicator badge (Recommended) | Badge shows count. Both online status and pending count visible at a glance. | ✓ |
| In score panel | Count in score panel — shows pending near your score during race | |
| Both | Both — count in badge AND in score panel for maximum visibility | |

**User's choice:** In offline indicator badge (Recommended)
**Notes:** Badge shows count alongside offline status — all in one place.

---

## Scan-while-offline behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Allow and auto-queue (Recommended) | Scan button works offline, queues marking automatically. Seamless — user doesn't have to think about connectivity. | ✓ |
| Disable scan button | Scan button disabled when offline. User must wait for connection. | |

**User's choice:** Allow and auto-queue (Recommended)
**Notes:** Seamless experience — user scans regardless of connectivity, system handles queue transparently.

---

## the agent's Discretion

No areas deferred to agent discretion — all decisions made by user.

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Discussion completed: 2026-05-14*