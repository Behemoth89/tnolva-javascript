# Nutikas Organiser API v1 â€” End-to-End Flow

This document describes the organiser-only REST API exposed under `/api/v1/organiser/` and walks through a complete contest lifecycle from the organiser's perspective: defining a contest, registering teams, watching markings stream in during the event, and correcting data afterwards.

The participant API (`/api/v1/contests/...`, `/api/v1/userteams/...`, `/api/v1/markings`) is documented separately in `flow.md`. This one is the **administration** surface that mirrors `/Organiser/...` Razor pages.

All endpoints return / accept JSON. Times are ISO 8601 UTC. Property names use camelCase on the wire â€” examples below show C# DTO names.

Interactive Swagger UI is available at `/swagger` once the app is running.

---

## 1. Authentication and authorisation

Every endpoint under `/api/v1/organiser/` requires:

1. **A valid JWT bearer token**, obtained from the existing identity API (same as for participants):

   | Method | Path | Body | Returns |
   |---|---|---|---|
   | `POST` | `/api/v1/identity/account/login` | `LoginInfo { email, password }` | `JWTResponse { jwt, refreshToken }` |
   | `POST` | `/api/v1/identity/account/refreshTokenData` | `TokenRefreshInfo { jwt, refreshToken }` | `JWTResponse { jwt, refreshToken }` |
   | `POST` | `/api/v1/identity/account/logout` | `LogoutInfo { refreshToken }` | `{ tokenDeleteCount }` |

2. **The `organiser` role** on the authenticated `AppUser`. The role is provisioned by the system administrator (e.g. via the seeded `organiser@taltech.ee` account or via `Areas/UserAdmin`).

3. **Membership of the target organisation.** Every read and write is filtered through `Organisation.AppUserOrganisations.Any(a => a.AppUserId == caller.Id)`. A contest, class, checkpoint, team, user-team, or marking that does not belong to one of your organisations is invisible to you â€” you will see `404 Not Found` on a direct GET, and it will be absent from list endpoints.

**Send the JWT** on every call as:

```
Authorization: Bearer <jwt>
```

### Status codes you'll see at the auth boundary

| Status | When |
|---|---|
| `401 Unauthorized` | Missing/invalid/expired JWT. |
| `403 Forbidden` | Authenticated, but the principal does not carry the `organiser` role. |
| `404 Not Found` | Authenticated organiser, but the resource is owned by a different organisation. (Deliberately mirrors "doesn't exist" so cross-organiser probing leaks nothing.) |

---

## 2. Listing your organisations

Before you can create a contest you need to know which organisations you belong to.

```
GET /api/v1/organiser/organisations
Authorization: Bearer <jwt>
```

Returns `OrganisationItem[]`, ordered by `organisationName` ascending. Only organisations the caller is a member of are returned.

```json
[
  { "id": "88888888-â€¦-0001", "organisationName": "TalTech Sport" }
]
```

Use the `id` value in subsequent contest-create calls.

---

## 3. Contest CRUD

A contest is the root object. Everything else (classes, checkpoints, teams, markings) hangs off of it.

### 3.1 List contests

```
GET /api/v1/organiser/contests
```

Returns `OrganiserContestDetails[]` ordered by `openTo` descending â€” newest-closing first, matching the MVC `/Organiser/Contests` table.

```json
[
  {
    "id": "â€¦",
    "name": "Korvemaa Rogain 2026",
    "visibleFrom": "2026-04-01T00:00:00Z",
    "openFrom":   "2026-05-07T08:00:00Z",
    "openTo":     "2026-05-07T18:00:00Z",
    "bonusTimeStart": null,
    "bonusTimeEnd":   null,
    "bonusPerMarking": 0,
    "organisationId":   "â€¦",
    "organisationName": "TalTech Sport"
  }
]
```

Compared with the participant `ContestListItem`, the organiser shape additionally exposes `bonusTimeStart`, `bonusTimeEnd`, `bonusPerMarking`, `organisationId`, and `organisationName`.

### 3.2 Get one contest

```
GET /api/v1/organiser/contests/{id}
```

Returns the same `OrganiserContestDetails` shape. `404` if the id is unknown or the contest belongs to another organisation.

### 3.3 Create a contest

```
POST /api/v1/organiser/contests
Content-Type: application/json
```

Body â€” `OrganiserContestUpsertRequest`:

```json
{
  "name": "Korvemaa Rogain 2026",
  "visibleFrom": "2026-04-01T00:00:00Z",
  "openFrom":   "2026-05-07T08:00:00Z",
  "openTo":     "2026-05-07T18:00:00Z",
  "bonusTimeStart": null,
  "bonusTimeEnd":   null,
  "bonusPerMarking": 0,
  "organisationId": "<id from /organisations>"
}
```

Validation:
- `name` â€” required, max 128 chars.
- `organisationId` â€” must be one of the caller's organisations (otherwise `400`).
- All `DateTime` fields are coerced to UTC by the EF value converter; sending zone-less times that represent local time will silently shift them.

On success: `201 Created`, `Location: /api/v1/organiser/contests/{newId}`, body is the new `OrganiserContestDetails`.

### 3.4 Update a contest

```
PUT /api/v1/organiser/contests/{id}
```

Same body as `POST`. **Full replace** of the writable fields. If `organisationId` is changed, the new value must also be one the caller belongs to.

- `200 OK` with the updated `OrganiserContestDetails` on success.
- `400` if the new `organisationId` is not yours.
- `404` if the contest is unknown or owned by another organisation.

### 3.5 Delete a contest

```
DELETE /api/v1/organiser/contests/{id}
```

- `204 No Content` on success.
- `404` if unknown or owned elsewhere.
- `500 Internal Server Error` if the contest still has classes / checkpoints / teams attached. Cascade delete is intentionally disabled in `AppDbContext` â€” clean up dependents first.

---

## 4. Contest classes (durations / scoring rules)

Classes define the per-team scoring window: nominal `duration` (no penalty), an optional `maxDuration` (over which `finalScore = 0`), and the over-duration penalty unit + amount.

### 4.1 List classes for a contest

```
GET /api/v1/organiser/contests/{contestId}/contest-classes
```

Ordered by `orderNr` ascending then `name` ascending. `404` if the contest is unknown or cross-organiser.

### 4.2 Get one class

```
GET /api/v1/organiser/contest-classes/{id}
```

Returns `OrganiserContestClassDetails`:

```json
{
  "id": "â€¦",
  "contestId": "â€¦",
  "name": "Easy",
  "orderNr": 1,
  "duration": 3600,
  "maxDuration": 7200,
  "overDurationUnit": 60,
  "overDurationPenalty": 1
}
```

`duration`, `maxDuration`, and `overDurationUnit` are in **seconds**. `overDurationPenalty` is the score deducted per `overDurationUnit` of over-time.

### 4.3 Create / update / delete a class

```
POST   /api/v1/organiser/contests/{contestId}/contest-classes
PUT    /api/v1/organiser/contest-classes/{id}
DELETE /api/v1/organiser/contest-classes/{id}
```

Body â€” `OrganiserContestClassUpsertRequest`:

```json
{
  "name": "Easy",
  "orderNr": 1,
  "duration": 3600,
  "maxDuration": 7200,
  "overDurationUnit": 60,
  "overDurationPenalty": 1
}
```

`PUT` does **not** accept a new `contestId` â€” moving a class between contests is intentionally disallowed. Delete and recreate if you need that.

---

## 5. Checkpoints

Checkpoints are the QR codes participants scan. Each one belongs to a single contest.

### 5.1 List checkpoints for a contest

```
GET /api/v1/organiser/contests/{contestId}/check-points
```

Ordered by `checkPointType` descending (Start â†’ Finish â†’ Regular â†’ NoScore), then `cpCode` ascending, then `cpid` ascending. `404` cross-organiser.

### 5.2 Get / create / update / delete a checkpoint

```
GET    /api/v1/organiser/check-points/{id}
POST   /api/v1/organiser/contests/{contestId}/check-points
PUT    /api/v1/organiser/check-points/{id}
DELETE /api/v1/organiser/check-points/{id}
```

Read shape â€” `OrganiserCheckPointDetails`:

```json
{
  "id": "â€¦",
  "contestId": "â€¦",
  "cpid": "OPEN-CP-1",
  "cpCode": "1",
  "checkPointType": 1,
  "score": 10,
  "lat": "59.4370",
  "lon": "24.7536"
}
```

`checkPointType`: `1 = Regular`, `2 = Finish`, `3 = Start`, `4 = NoScore`.

Write shape â€” `OrganiserCheckPointUpsertRequest`:

```json
{
  "cpid": "OPEN-CP-1",
  "cpCode": "1",
  "checkPointType": 1,
  "score": 10,
  "lat": "59.4370",
  "lon": "24.7536"
}
```

- `cpid` is the QR code payload â€” required, 1â€“128 chars. **Must be unique within the contest**: posting a duplicate returns `400 RestApiErrorResponse` with `error: "CPID '...' is already used in this contest."` instead of a raw EF/database exception.
- `cpCode` is the human label printed on the QR sheet â€” required, max 128 chars.
- `lat` / `lon` are optional strings (max 20 chars).
- `PUT` does **not** move a checkpoint between contests.

---

## 6. Teams

A team participates in a single contest under a single class. Each team has zero or more `UserTeam` rows linking it to the participants who can post markings on its behalf.

### 6.1 List teams for a contest

```
GET /api/v1/organiser/contests/{contestId}/teams
```

Returns `OrganiserTeamDetails[]` including the linked members:

```json
[
  {
    "id": "team-id",
    "name": "Foo Bar",
    "memberNames": "Alice; Bob",
    "contestId": "â€¦",
    "contestClassId": "â€¦",
    "contestClassName": "Easy",
    "createdDT": "2026-05-07T07:00:00Z",
    "startDT":   "2026-05-07T08:00:00Z",
    "finishDT":  null,
    "score": 30,
    "bonus": 0,
    "penalty": 0,
    "finalScore": 30,
    "members": [
      { "userTeamId": "ut-id", "userId": "user-id", "email": "alice@example.org" }
    ]
  }
]
```

### 6.2 Get / create / update / delete a team

```
GET    /api/v1/organiser/teams/{id}
POST   /api/v1/organiser/contests/{contestId}/teams
PUT    /api/v1/organiser/teams/{id}
DELETE /api/v1/organiser/teams/{id}
```

Body â€” `OrganiserTeamUpsertRequest`:

```json
{
  "name": "Foo Bar",
  "memberNames": "Alice; Bob",
  "contestClassId": "â€¦",
  "startDT": null,
  "finishDT": null,
  "score": 0,
  "bonus": 0,
  "penalty": 0,
  "finalScore": 0
}
```

Validation:
- `name` â€” required, max 128 chars.
- `memberNames` â€” required, max 255 chars.
- `contestClassId` â€” must belong to the team's contest. On `POST` that's the route `contestId`; on `PUT` it's the team's existing `contestId`. A cross-contest class returns `400`.
- `score`, `bonus`, `penalty`, `finalScore` â€” present so an organiser can correct numbers manually; tweaking them does **not** re-run the BLL scoring engine. (See section 8 on marking edits â€” same caveat.)

`POST` returns `201 Created` with the team's `OrganiserTeamDetails` and `Location: /api/v1/organiser/teams/{newId}`. `CreatedDT` is set to `UtcNow` server-side regardless of any value in the request.

`DELETE` returns `204` for a team with no markings. A team that still has markings attached via its user-teams will hit a foreign-key violation and surface as `500` â€” clean up markings (or `UserTeam`s with markings) first.

---

## 7. Team membership (UserTeams)

A `UserTeam` links an `AppUser` to a `Team`. Markings are attributed via the `UserTeam`, not directly to the `Team`.

### 7.1 List team membership

```
GET /api/v1/organiser/teams/{teamId}/user-teams
```

Returns `OrganiserUserTeamItem[]`:

```json
[
  {
    "id": "ut-id",
    "userId": "user-id",
    "email": "alice@example.org",
    "teamId": "team-id"
  }
]
```

### 7.2 Add a user to a team by email

```
POST /api/v1/organiser/teams/{teamId}/user-teams
Content-Type: application/json
```

Body â€” `OrganiserAddUserTeamRequest`:

```json
{ "email": "alice@example.org" }
```

The server resolves the email via `UserManager.FindByEmailAsync`. The user must already exist in the system â€” there is no auto-create.

- `201 Created` with the new `OrganiserUserTeamItem` on success.
- `400 RestApiErrorResponse` â€” no `AppUser` matches the email, or the user is already a member of this team.
- `404` â€” the team doesn't exist or is owned by another organisation.

### 7.3 Remove a user-team

```
DELETE /api/v1/organiser/user-teams/{id}
```

- `204 No Content` on success.
- `404` if unknown or cross-organiser.

The underlying `Team` and `AppUser` rows are unaffected. If the user-team has markings, the FK violation surfaces as `500`.

---

## 8. Markings (read / on-behalf submit / edit / delete)

### 8.1 List markings in a contest (paginated)

```
GET /api/v1/organiser/contests/{contestId}/markings
       ?teamId={teamId}
       &page={page}
       &pageSize={pageSize}
```

Default `page = 1`, `pageSize = 25`. `pageSize` is clamped to `[1, 100]`; `page < 1` is bumped to 1.

Items are ordered by `dt` descending (newest first â€” same as MVC). The `teamId` filter is optional; when supplied, only markings whose `userTeam.teamId == teamId` are returned.

Response â€” `PagedResponse<OrganiserMarkingListItem>`:

```json
{
  "items": [
    {
      "id": "marking-id",
      "dt": "2026-05-07T08:05:00Z",
      "markingType": 0,
      "score": 10,
      "lat": "59.4370",
      "lon": "24.7536",
      "checkPointId": "â€¦",
      "checkPointCPID": "OPEN-CP-1",
      "checkPointCPCode": "1",
      "checkPointType": 1,
      "userTeamId": "ut-id",
      "teamId": "team-id",
      "teamName": "Foo Bar"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "totalCount": 137,
  "totalPages": 6
}
```

`page` beyond `totalPages` returns an empty `items` array (with the supplied `page` echoed back) and the real `totalCount` / `totalPages`.

### 8.2 Get a single marking

```
GET /api/v1/organiser/markings/{id}
```

Returns `OrganiserMarkingDetails` â€” same shape as the list item plus `contestId` and `contestName`.

### 8.3 Submit a marking on behalf of a team

```
POST /api/v1/organiser/teams/{teamId}/markings
Content-Type: application/json
```

Body â€” `OrganiserMarkingCreateRequest`:

```json
{
  "checkPointId": "<CheckPoint.Id GUID, NOT the QR string>",
  "dt": "2026-05-07T08:05:00Z",
  "lat": "59.4370",
  "lon": "24.7536"
}
```

- `checkPointId` is the `CheckPoint.Id` (GUID) â€” different from the participant API, which takes the QR-code string.
- `dt` defaults to `UtcNow` server-side if omitted (or set to `default`).
- The marking is attributed to the **first** `UserTeam` of the team (mirrors MVC behaviour).
- The CP must belong to the team's contest; cross-contest CPs return `400`.

The endpoint dispatches to `BLL.App.CpMarking.StandardRogain(..., bypassTime: true)`. The `bypassTime` flag matches the MVC organiser's "Create marking" form and means:

- The contest's open window is **not** enforced. You can record a START or any later CP after `openTo` has passed (e.g. to retroactively register a paper-recorded scan).
- Other domain rules still apply: scanning a START twice yields `EventAlreadyStarted`; scanning anything other than START before any START exists yields `EventNotStarted`; scanning after the FINISH still yields `EventFinished`.

Response is **always** `200 OK` (mirroring the participant marking endpoint). Inspect `statusOk` and `statusCode`:

```json
{
  "statusOk": true,
  "statusCode": 0,
  "message": "Event started",
  "result": { /* UserTeamActivation reflecting post-mark state */ }
}
```

Failure modes that **do** map to HTTP errors:

| Status | When |
|---|---|
| `400` | The team has no `UserTeam` to attribute the marking to; or `checkPointId` belongs to a different contest. |
| `404` | The team doesn't exist or is owned by another organisation. |

### 8.4 Edit a raw marking row

```
PUT /api/v1/organiser/markings/{id}
```

Body â€” `OrganiserMarkingUpdateRequest`:

```json
{
  "dt": "2026-05-07T08:05:00Z",
  "lat": "59.4370",
  "lon": "24.7536",
  "markingType": 0,
  "score": 10,
  "checkPointId": "<CheckPoint.Id GUID>",
  "userTeamId": "<UserTeam.Id GUID>"
}
```

This rewrites the raw `Marking` row directly. **It does not re-run scoring** â€” the team's `score` / `bonus` / `penalty` / `finalScore` are unchanged. If you alter the score field, fix the team totals manually via `PUT /teams/{id}` afterwards.

Validation:
- The new `userTeamId` must reference a user-team whose `team.contestId` matches the new `checkPointId`'s `contestId`. Otherwise `400`.

Returns `200 OK` with the updated `OrganiserMarkingDetails`. `404` cross-organiser.

### 8.5 Delete a marking

```
DELETE /api/v1/organiser/markings/{id}
```

- `204 No Content` on success.
- `404` cross-organiser.

Same caveat as `PUT`: the team's score totals are **not** recomputed on delete.

---

## 9. End-to-end organiser flow

This is the path a typical organiser walks from "I'm setting up a new event" to "I've corrected a typo after the event closed".

### Step 1 â€” Log in and discover your organisations

```
POST /api/v1/identity/account/login          â†’ JWT
GET  /api/v1/organiser/organisations         â†’ pick organisationId
```

### Step 2 â€” Create the contest

```
POST /api/v1/organiser/contests
{ "name": "Korvemaa Rogain 2026",
  "visibleFrom": "2026-04-01T00:00:00Z",
  "openFrom":   "2026-05-07T08:00:00Z",
  "openTo":     "2026-05-07T18:00:00Z",
  "bonusPerMarking": 0,
  "organisationId": "<from step 1>" }
```

Capture `id` from the response â€” that's the `contestId` for every subsequent call.

### Step 3 â€” Define classes

```
POST /api/v1/organiser/contests/{contestId}/contest-classes
{ "name": "Easy",  "orderNr": 1, "duration": 3600,  "maxDuration": 7200,  "overDurationUnit": 60, "overDurationPenalty": 1 }

POST /api/v1/organiser/contests/{contestId}/contest-classes
{ "name": "Hard",  "orderNr": 2, "duration": 7200,  "maxDuration": 14400, "overDurationUnit": 60, "overDurationPenalty": 2 }
```

### Step 4 â€” Define checkpoints

A typical rogain has at least one Start, one Finish, and the regular CPs:

```
POST /api/v1/organiser/contests/{contestId}/check-points
{ "cpid": "OPEN-START",  "cpCode": "S", "checkPointType": 3, "score": 0  }
{ "cpid": "OPEN-FINISH", "cpCode": "F", "checkPointType": 2, "score": 0  }
{ "cpid": "OPEN-CP-1",   "cpCode": "1", "checkPointType": 1, "score": 10 }
{ "cpid": "OPEN-CP-2",   "cpCode": "2", "checkPointType": 1, "score": 20 }
```

Print the QR codes for each `cpid` (the QR scanner reads `cpid`, not the GUID).

### Step 5 â€” (Pre-event) seed teams on behalf of participants

Some events let participants self-register via the participant API (`POST /api/v1/contests/{id}/teams`). Others want the organiser to set everything up beforehand:

```
POST /api/v1/organiser/contests/{contestId}/teams
{ "name": "Foo Bar", "memberNames": "Alice; Bob", "contestClassId": "<class-id>" }
```

Then add member emails one at a time:

```
POST /api/v1/organiser/teams/{teamId}/user-teams
{ "email": "alice@example.org" }
```

Each user must already have a registered `AppUser`. They can self-register via `POST /api/v1/identity/account/register`.

### Step 6 â€” During the event: live monitoring

Watch markings stream in, paginated, ordered newest-first:

```
GET /api/v1/organiser/contests/{contestId}/markings?page=1&pageSize=50
GET /api/v1/organiser/contests/{contestId}/markings?teamId={teamId}&pageSize=100
```

Inspect a specific team's standings via `GET /api/v1/organiser/teams/{id}` â€” the `members` array tells you who's holding the phone.

### Step 7 â€” On-behalf marking (rare but supported)

If a team's phone died and they recorded checkpoints on paper, you can register them after the event has closed:

```
POST /api/v1/organiser/teams/{teamId}/markings
{ "checkPointId": "<CP guid>", "dt": "2026-05-07T08:05:00Z" }
```

`bypassTime: true` is always applied here â€” the contest can be closed.

### Step 8 â€” Post-event corrections

If a marking was logged with the wrong CP (rare â€” usually a paper-recorded one):

```
PUT /api/v1/organiser/markings/{id}
{ "dt": "...", "score": 10, "checkPointId": "<correct CP>", "userTeamId": "<ut>", "markingType": 0 }
```

Then fix the team totals (no auto-recompute):

```
PUT /api/v1/organiser/teams/{teamId}
{ "name": "...", "memberNames": "...", "contestClassId": "<same>", "score": 30, "bonus": 0, "penalty": 0, "finalScore": 30 }
```

To remove a duplicate / spurious marking outright:

```
DELETE /api/v1/organiser/markings/{id}
```

(Again â€” adjust team totals manually afterwards if you changed the score-bearing CPs.)

### Step 9 â€” Closing out

There is no explicit "close contest" call. Once `openTo <= now` the participant API stops accepting fresh markings, the public results endpoint (`GET /api/v1/contests/{id}/results`) starts revealing the marking trail per team, and team-detail endpoints expose individual markings.

If you want to delete a one-off test contest, clean up dependents first (markings â†’ user-teams â†’ teams â†’ checkpoints â†’ classes â†’ contest), then `DELETE /api/v1/organiser/contests/{id}`.

---

## 10. Error response shape

Validation, scoping, and not-found errors return:

```json
{
  "status": 400,
  "error": "Name: The Name field is required."
}
```

(`RestApiErrorResponse`.) `status` is the numeric HTTP status code, `error` is a single human-readable string.

The on-behalf marking endpoint (`POST /teams/{teamId}/markings`) is the one place that returns `200 OK` with `statusOk: false` for **domain-level** rejections (event finished, START already scanned, â€¦) â€” same convention as the participant marking endpoint. Auth/scoping errors there still come back as `401`/`403`/`404` with the standard error body.

---

## 11. Quick reference â€” endpoint cheat sheet

All endpoints below require `Authorization: Bearer <jwt>` *and* the `organiser` role.

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/v1/organiser/organisations` | List your organisations |
| `GET`    | `/api/v1/organiser/contests` | List your contests |
| `GET`    | `/api/v1/organiser/contests/{id}` | One contest |
| `POST`   | `/api/v1/organiser/contests` | Create contest |
| `PUT`    | `/api/v1/organiser/contests/{id}` | Update contest |
| `DELETE` | `/api/v1/organiser/contests/{id}` | Delete contest |
| `GET`    | `/api/v1/organiser/contests/{contestId}/contest-classes` | List classes |
| `GET`    | `/api/v1/organiser/contest-classes/{id}` | One class |
| `POST`   | `/api/v1/organiser/contests/{contestId}/contest-classes` | Create class |
| `PUT`    | `/api/v1/organiser/contest-classes/{id}` | Update class |
| `DELETE` | `/api/v1/organiser/contest-classes/{id}` | Delete class |
| `GET`    | `/api/v1/organiser/contests/{contestId}/check-points` | List CPs |
| `GET`    | `/api/v1/organiser/check-points/{id}` | One CP |
| `POST`   | `/api/v1/organiser/contests/{contestId}/check-points` | Create CP (duplicate CPID â†’ 400) |
| `PUT`    | `/api/v1/organiser/check-points/{id}` | Update CP |
| `DELETE` | `/api/v1/organiser/check-points/{id}` | Delete CP |
| `GET`    | `/api/v1/organiser/contests/{contestId}/teams` | List teams |
| `GET`    | `/api/v1/organiser/teams/{id}` | One team |
| `POST`   | `/api/v1/organiser/contests/{contestId}/teams` | Create team |
| `PUT`    | `/api/v1/organiser/teams/{id}` | Update team |
| `DELETE` | `/api/v1/organiser/teams/{id}` | Delete team |
| `GET`    | `/api/v1/organiser/teams/{teamId}/user-teams` | List members |
| `POST`   | `/api/v1/organiser/teams/{teamId}/user-teams` | Add member by email |
| `DELETE` | `/api/v1/organiser/user-teams/{id}` | Remove member |
| `GET`    | `/api/v1/organiser/contests/{contestId}/markings` | List markings (paginated, optional `?teamId=`) |
| `GET`    | `/api/v1/organiser/markings/{id}` | One marking |
| `POST`   | `/api/v1/organiser/teams/{teamId}/markings` | On-behalf marking (bypassTime) |
| `PUT`    | `/api/v1/organiser/markings/{id}` | Edit raw marking row (no rescore) |
| `DELETE` | `/api/v1/organiser/markings/{id}` | Delete marking (no rescore) |