# testing-standards Specification

## Purpose
TBD - created by archiving change create-fullstack-app-with-docker. Update Purpose after archive.
## Requirements
### Requirement: Backend test suite passes

The `backend/` subproject SHALL include a Jest test suite that exits with code `0` on success. The suite SHALL include at least one unit test for the health route's response shape and at least one integration test that exercises the full Express app via Supertest.

#### Scenario: npm test exits 0

- **WHEN** a developer runs `npm test` inside `backend/`
- **THEN** the command exits with code `0`
- **AND** at least one unit test and at least one Supertest integration test are reported as passed

#### Scenario: Unit test asserts response shape

- **WHEN** the unit test for the health route runs
- **THEN** it asserts that the route's response object contains `status`, `uptime`, and `timestamp` fields with the expected types

#### Scenario: Integration test asserts HTTP behavior

- **WHEN** the Supertest integration test runs
- **THEN** it asserts that a `GET /api/health` request returns HTTP `200` and a JSON body matching the contract

### Requirement: Frontend test suite passes

The `frontend/` subproject SHALL include a Vitest test suite that exits with code `0` on success. The suite SHALL include at least one component test for the `HealthCheck` component that uses React Testing Library to render the component and assert on its output.

#### Scenario: npm test exits 0

- **WHEN** a developer runs `npm test` inside `frontend/`
- **THEN** the command exits with code `0`
- **AND** at least one component test is reported as passed

#### Scenario: HealthCheck component test asserts rendered behavior

- **WHEN** the `HealthCheck` component test runs
- **THEN** it renders the component with a mocked `/api/health` response
- **AND** it asserts that the online indicator and uptime value are visible

### Requirement: Test command shape is consistent

Both `backend/package.json` and `frontend/package.json` SHALL expose an `npm test` script that runs the corresponding test runner in CI-friendly mode (no watch loop).

#### Scenario: No watch mode in CI

- **WHEN** `npm test` is invoked in either subproject
- **THEN** the test runner executes once and exits
- **AND** no interactive prompt is shown

