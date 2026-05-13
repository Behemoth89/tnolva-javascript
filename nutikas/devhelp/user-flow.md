# Nutikas Student API v1 â€” End-to-End Flow

This document describes the public REST API exposed under `/api/v1/` and walks through a complete competition cycle: from picking a contest to receiving the final score after crossing the finish line.

All endpoints return / accept JSON. Times are ISO 8601 UTC. Property names use camelCase on the wire (`isOpenForParticipation`, `userTeamId`, etc.) â€” the examples below show the C# DTO names; on the wire they are camelCased.

Interactive Swagger UI is available at `/swagger` once the app is running.

---

## 1. Authentication

Authentication is required only for *write* and *personal* endpoints (registering a team, viewing your own activation state, posting markings). Public read endpoints (browsing contests, viewing rankings) are anonymous.

The auth scheme is JWT bearer. Tokens are obtained from the existing identity API:

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/v1/identity/account/register` | `RegisterInfo { email, password, firstname, lastname }` | `JWTResponse { jwt, refreshToken }` |
| `POST` | `/api/v1/identity/account/login` | `LoginInfo { email, password }` | `JWTResponse { jwt, refreshToken }` |
| `POST` | `/api/v1/identity/account/refreshTokenData` | `TokenRefreshInfo { jwt, refreshToken }` | `JWTResponse { jwt, refreshToken }` |
| `POST` | `/api/v1/identity/account/logout` | `LogoutInfo { refreshToken }` | `{ tokenDeleteCount }` |

**Send the JWT** on protected calls as:

```
Authorization: Bearer <jwt>
```

Tokens are short-lived (configured via `JWT:ExpiresInSeconds`). When the JWT expires, exchange it together with the refresh token at `refreshTokenData` to get a new pair.

---

## 2. Public read endpoints

These endpoints are anonymous â€” no `Authorization` header needed.

### 2.1 List visible contests

```
GET /api/v1/contests
```

Returns `ContestListItem[]`. Only contests whose `visibleFrom <= now` are returned, ordered by `openFrom` descending (newest first).

```json
[
  {
    "id": "8f7eâ€¦",
    "name": "Korvemaa Rogain 2026",
    "visibleFrom": "2026-04-01T00:00:00Z",
    "openFrom": "2026-05-07T08:00:00Z",
    "openTo":   "2026-05-07T18:00:00Z",
    "isOpenForParticipation": true,
    "hasResults": true
  }
]
```

- `isOpenForParticipation` â€” `true` exactly when `openFrom <= now < openTo`. Used by clients to decide whether to show a "Register team" button.
- `hasResults` â€” `true` when `openFrom <= now`. Used to decide whether to show a "Results" link.

### 2.2 Contest details

```
GET /api/v1/contests/{id}
```

Returns `ContestDetails` with the contest header and its classes ordered by `orderNr` then `name`. `404` if the contest does not exist.

```json
{
  "id": "8f7eâ€¦",
  "name": "Korvemaa Rogain 2026",
  "openFrom": "2026-05-07T08:00:00Z",
  "openTo":   "2026-05-07T18:00:00Z",
  "contestClasses": [
    { "id": "aaaâ€¦", "name": "Easy",  "orderNr": 1, "duration": 3600, "maxDuration": 7200 },
    { "id": "bbbâ€¦", "name": "Hard",  "orderNr": 2, "duration": 7200, "maxDuration": 14400 }
  ]
}
```

`duration` and `maxDuration` are in seconds. Penalties kick in beyond `duration`. If `maxDuration` is set and the team exceeds it, the final score is forced to zero.

### 2.3 Contest results (overall ranking)

```
GET /api/v1/contests/{id}/results
```

Returns `ContestResults`: the contest header plus the ranked teams in the canonical contest-results order:

1. `contestClass.orderNr` ascending,
2. `finalScore` descending,
3. elapsed time (`finishDT - startDT`) ascending.

Only teams whose `startDT != null` are included. `404` if the contest does not exist.

```json
{
  "contest": { /* ContestListItem */ },
  "teams": [
    {
      "id": "team-id",
      "name": "Foo Bar",
      "memberNames": "Alice; Bob",
      "contestClassId": "aaaâ€¦",
      "contestClassName": "Easy",
      "contestClassOrderNr": 1,
      "startDT": "2026-05-07T08:00:00Z",
      "finishDT": "2026-05-07T08:55:00Z",
      "score": 80,
      "bonus": 10,
      "penalty": 0,
      "finalScore": 90
    }
  ]
}
```

### 2.4 Single team detail

```
GET /api/v1/contests/{contestId}/teams/{teamId}
```

Returns `TeamResultDetail` for one team. `404` if the team is missing or its `contestId` does not match the URL.

While the contest is still running (`openTo > now`) the `markings` array is **empty** (mirrors the MVC results page, which hides per-CP visits until the contest closes). Once `openTo <= now`, `markings` is populated, ordered by `dt` ascending.

```json
{
  "id": "team-id",
  "name": "Foo Bar",
  "memberNames": "Alice; Bob",
  "contestClassId": "aaaâ€¦",
  "contestClassName": "Easy",
  "contestClassOrderNr": 1,
  "startDT": "2026-05-07T08:00:00Z",
  "finishDT": "2026-05-07T08:55:00Z",
  "score": 80,
  "bonus": 10,
  "penalty": 0,
  "finalScore": 90,
  "markings": [
    {
      "id": "m1",
      "dt": "2026-05-07T08:00:00Z",
      "checkPointId": "cp-uuid",
      "checkPointCPID": "OPEN-START",
      "checkPointCPCode": "S",
      "checkPointType": 3,
      "score": 0,
      "lat": null,
      "lon": null
    }
  ]
}
```

`checkPointType` values: `1 = Regular`, `2 = Finish`, `3 = Start`, `4 = NoScore`.

---

## 3. Authenticated endpoints

All require `Authorization: Bearer <jwt>`. Without the header, the response is `401`.

### 3.1 Register a team for a contest

```
POST /api/v1/contests/{contestId}/teams
Content-Type: application/json
```

Body â€” `TeamRegistrationRequest`:

```json
{
  "teamName": "Foo Bar",
  "teamMembers": "Alice; Bob",
  "contestClassId": "aaaâ€¦"
}
```

Validation:
- `teamName` â€” required, max 128 chars.
- `teamMembers` â€” required, max 255 chars.
- `contestClassId` â€” must reference a class belonging to `contestId`.

On success: `201 Created` with `UserTeamListItem`. The caller is recorded as the team owner. Returned `id` is the `userTeamId` you'll use to scan checkpoints.

```json
{
  "id": "user-team-id",
  "teamId": "team-id",
  "teamName": "Foo Bar",
  "memberNames": "Alice; Bob",
  "contestClassId": "aaaâ€¦",
  "contestClassName": "Easy",
  "startDT": null,
  "finishDT": null,
  "finalScore": 0
}
```

Failure modes:
- `400 RestApiErrorResponse` â€” body validation failed, or `contestClassId` doesn't belong to `contestId`.
- `404 RestApiErrorResponse` â€” `contestId` doesn't exist.
- `401` â€” missing/invalid bearer token.

### 3.2 List the caller's teams in a contest

```
GET /api/v1/contests/{contestId}/userteams
```

Returns `UserTeamListItem[]` â€” only the caller's user-teams in that contest. Empty array if the caller has none. Other users' teams are never returned.

### 3.3 Get one user-team's live activation state

```
GET /api/v1/userteams/{id}
```

Returns `UserTeamActivation` â€” the current scoring state plus all of the user-team's markings (ordered by `dt` descending â€” most recent first). This is the personal "live dashboard" view during the event.

```json
{
  "userTeamId": "ut-id",
  "teamName": "Foo Bar",
  "contestId": "contest-id",
  "contestName": "Korvemaa Rogain 2026",
  "contestClassName": "Easy",
  "startDT": "2026-05-07T08:00:00Z",
  "finishDT": null,
  "score": 30,
  "bonus": 0,
  "penalty": 0,
  "finalScore": 30,
  "markings": [
    { /* MarkingListItem */ }
  ]
}
```

Status codes:
- `200` â€” caller owns the user-team.
- `401` â€” no bearer token.
- `403` â€” the user-team exists but is owned by another user. No body content is leaked.
- `404` â€” the id does not exist.

### 3.4 Submit a checkpoint marking

```
POST /api/v1/markings
Content-Type: application/json
```

Body â€” `MarkingRequest`:

```json
{
  "checkPointId": "OPEN-CP-1",
  "userTeamId": "ut-id",
  "lat": "59.4370",
  "lon": "24.7536",
  "dt": "2026-05-07T08:05:00Z"
}
```

- `checkPointId` is the QR-code payload (`CheckPoint.CPID`), **not** the GUID. Estonian special characters can be passed in HTML-encoded form (`&Otilde;`, `&Auml;`, etc.) â€” the server decodes them before lookup.
- `userTeamId` is the `id` returned by `POST /contests/{contestId}/teams` (i.e. the `UserTeam.Id`).
- `lat` / `lon` are optional GPS coordinates captured at scan time.
- `dt` is the optional client-supplied scan timestamp; if omitted, the server uses `UtcNow`.

The response is **always** `200 OK` (even for domain-level rejections such as "event finished" or "checkpoint not found"). Inspect `statusOk` and `statusCode` in the body:

```json
{
  "statusOk": true,
  "statusCode": 0,
  "message": "CP marked at 2026-05-07 08:05 UTC, +10 points, total 10",
  "result": {
    /* full UserTeamActivation reflecting the post-mark state */
  }
}
```

`statusCode` values (mirror of `EApiStatusCode`):

| Code | Name | Meaning |
|---|---|---|
| 0 | `Ok` | Marking accepted. |
| 1 | `Error` | Generic error (e.g. user-team or CP not found). |
| 2 | `EventNotStarted` | Posted a non-start CP without first scanning the START. |
| 3 | `EventFinished` | The team has already finished â€” emitted on the FINISH itself, and on any later attempt. |
| 4 | `EventAlreadyStarted` | Tried to scan a START CP twice. |

Re-scanning the same regular CP is allowed but does not change the score: a `Marking` row is recorded with `score = 0` and the team's `score` stays the same.

---

## 4. End-to-end competition flow

This is the path a typical participant follows from the moment they open a client to the moment they see their final position.

### Step 1 â€” Create a user account

```
POST /api/v1/identity/account/register
{ "email": "alice@example.org", "password": "â€¦", "firstname": "Alice", "lastname": "Example" }
```

Save the returned `jwt` and `refreshToken`. The client should refresh the JWT (via `refreshTokenData`) when it nears expiry.

### Step 2 â€” Discover contests

```
GET /api/v1/contests
```

Pick a contest where `isOpenForParticipation == true`. Fetch its details to populate the class picker:

```
GET /api/v1/contests/{contestId}
```

### Step 3 â€” Register a team

```
POST /api/v1/contests/{contestId}/teams
Authorization: Bearer <jwt>

{ "teamName": "Foo Bar", "teamMembers": "Alice; Bob", "contestClassId": "<class-from-step-2>" }
```

Capture `id` from the response â€” that is the `userTeamId` used by every marking. Persist it locally so the participant can resume the event after a page reload.

### Step 4 â€” (Optional) Recover existing teams

If the user had previously registered, list their teams:

```
GET /api/v1/contests/{contestId}/userteams
Authorization: Bearer <jwt>
```

Pick a `userTeamId` from the result.

### Step 5 â€” Activate the event

The client typically renders a "Live state" screen powered by:

```
GET /api/v1/userteams/{userTeamId}
Authorization: Bearer <jwt>
```

Initially `startDT == null` and `markings == []`. Poll or refresh after each scan to update the UI.

### Step 6 â€” Scan the START checkpoint

```
POST /api/v1/markings
Authorization: Bearer <jwt>
{ "checkPointId": "OPEN-START", "userTeamId": "<ut>" }
```

On success: `statusOk: true`, `statusCode: 0`, and `result.startDT` is set. The team's clock is now running. Posting another START CP after this returns `statusCode: 4 (EventAlreadyStarted)`.

### Step 7 â€” Scan regular checkpoints during the event

For every CP the team finds:

```
POST /api/v1/markings
Authorization: Bearer <jwt>
{ "checkPointId": "OPEN-CP-1", "userTeamId": "<ut>", "lat": "59.4370", "lon": "24.7536" }
```

- First scan of a given CP: `result.score` increases by the CP's score, `finalScore` is recomputed as `max(0, score + bonus - penalty)`.
- Re-scan: `statusOk: true` but `score` is unchanged â€” a `Marking` row is still saved with `score = 0` for audit.
- If the contest has a configured `BonusTimeStart`/`BonusTimeEnd` window, regular-CP scans inside that window add `BonusPerMarking` to `bonus`.
- Scanning a CP that doesn't belong to this contest: `statusOk: false`, `statusCode: 1`, `message` says "checkpoint not found â€¦". No state change.

### Step 8 â€” Scan the FINISH checkpoint

```
POST /api/v1/markings
Authorization: Bearer <jwt>
{ "checkPointId": "OPEN-FINISH", "userTeamId": "<ut>" }
```

The server:
1. Sets `team.finishDT`.
2. Computes `timeOnTrack = finishDT - startDT`.
3. Computes `timeOver = timeOnTrack - contestClass.duration`.
4. If `timeOver > 0`: `penalty = ceil(timeOver / overDurationUnit) * overDurationPenalty`.
5. `finalScore = max(0, score + bonus - penalty)`.
6. If `contestClass.maxDuration` is set and exceeded, `finalScore = 0`.

Response: `statusOk: true`, `statusCode: 3 (EventFinished)`, full `UserTeamActivation` with `finishDT`, `penalty`, and `finalScore` populated.

Any further `POST /api/v1/markings` against this user-team returns `statusOk: false`, `statusCode: 3 (EventFinished)`, and persists nothing.

### Step 9 â€” View live ranking

While the contest is still open, ranking endpoints work but the per-team detail view hides individual markings:

```
GET /api/v1/contests/{contestId}/results
GET /api/v1/contests/{contestId}/teams/{teamId}    # markings == [] until the contest closes
```

After `openTo <= now` passes, `GET .../teams/{teamId}` returns the full marking trail in chronological order â€” useful for reviewing a team's route.

---

## 5. Error response shape

Validation and not-found errors return:

```json
{
  "status": 400,
  "error": "TeamName: The TeamName field is required.; ContestClassId: â€¦"
}
```

(`RestApiErrorResponse`.) `status` is the numeric HTTP status code, `error` is a single human-readable string (joined from all model-state errors when there are multiple).

Domain-level rejections from `POST /markings` are **not** errors â€” they return `200` with `statusOk: false`. Reserve `4xx` checks for transport/auth concerns.

---

## 6. Quick reference â€” endpoint cheat sheet

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | `/api/v1/contests` | â€” | List visible contests |
| `GET`  | `/api/v1/contests/{id}` | â€” | Contest header + classes |
| `GET`  | `/api/v1/contests/{id}/results` | â€” | Ranked teams |
| `GET`  | `/api/v1/contests/{contestId}/teams/{teamId}` | â€” | Team detail (markings hidden until close) |
| `POST` | `/api/v1/contests/{contestId}/teams` | JWT | Register a new team |
| `GET`  | `/api/v1/contests/{contestId}/userteams` | JWT | Caller's teams in this contest |
| `GET`  | `/api/v1/userteams/{id}` | JWT | Caller's live activation state |
| `POST` | `/api/v1/markings` | JWT | Scan a checkpoint |
| `POST` | `/api/v1/identity/account/register` | â€” | Create account, get JWT |
| `POST` | `/api/v1/identity/account/login` | â€” | Get JWT |
| `POST` | `/api/v1/identity/account/refreshTokenData` | â€” | Refresh JWT |
| `POST` | `/api/v1/identity/account/logout` | JWT | Revoke refresh token |