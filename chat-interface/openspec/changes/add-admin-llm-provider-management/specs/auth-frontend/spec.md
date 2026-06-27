## ADDED Requirements

### Requirement: Admin nav links to provider and model management

The frontend SHALL render navigation links to `/admin/llm-providers`
and `/admin/llm-provider-models` alongside the existing `/admin` link.
Both links SHALL be rendered only when the auth context's user has
`is_admin === 1`. The non-admin "Admin privileges required" pattern
already established for `/admin` is reused: each new route is wrapped
in `RouteGuard` and additionally renders a denial view when
`user.is_admin !== 1`.

#### Scenario: admin sees both new nav links

- **WHEN** an admin user (`is_admin === 1`) is logged in
- **THEN** the nav contains links to `/admin/llm-providers` and
  `/admin/llm-provider-models`

#### Scenario: non-admin does not see the new nav links

- **WHEN** a non-admin user (`is_admin === 0`) is logged in
- **THEN** the nav does not contain links to `/admin/llm-providers`
  or `/admin/llm-provider-models`

#### Scenario: non-admin denied at the new routes

- **WHEN** a non-admin user navigates to `/admin/llm-providers` or
  `/admin/llm-provider-models`
- **THEN** the route renders an "Admin privileges required" message
- **AND** no request to the corresponding admin API is made
