# LeadEngine — Phase 2 Platform Spec
**Theming, API Documentation, RBAC, Admin Panel & Location Intelligence**  
**Status**: Draft for engineering  
**Owner**: (assign)  
**Last updated**: 2026-09-17  

This document defines the next phase of work after the UI/visual refactor. It is committed to the repo at `/docs/PHASE-2-PLATFORM-SPEC.md` and used as the source of truth for implementation, PR scoping, and onboarding. Each section is independently implementable — do not block one on another unless noted.

---

## Table of Contents
1. [Theming System (Dark / Light Mode)](#1-theming-system-dark--light-mode)
2. [Backend API Documentation (OpenAPI / Swagger)](#2-backend-api-documentation-openapi--swagger)
3. [RBAC (Role-Based Access Control)](#3-rbac-role-based-access-control)
4. [Admin Panel](#4-admin-panel)
5. [Location Intelligence (Country / State / City Dropdowns)](#5-location-intelligence-country--state--city-dropdowns)
6. [Rollout Plan & Milestones](#6-rollout-plan--milestones)
7. [Open Questions](#7-open-questions)

---

## 1. Theming System (Dark / Light Mode)

### 1.1 Goal
Support both dark and light themes from a single token source, with no hardcoded colors anywhere in components. This must reuse the token palette from the UI refactor phase — light mode is not a new design, it's the same system inverted.

### 1.2 Architecture
- Define tokens as CSS custom properties on `:root`, scoped by a `data-theme` attribute (`data-theme="dark"` / `data-theme="light"`), not by Tailwind's `dark:` class alone — this makes the theme controllable by both system preference and explicit user choice.
- Persist user choice in `localStorage` (`theme-preference: system | light | dark`), default to `system`.
- Respect `prefers-color-scheme` when preference is `system`.
- **No flash-of-wrong-theme on load**: set the `data-theme` attribute via an inline `<script>` in `<head>` before React hydrates, reading from `localStorage` synchronously.

### 1.3 Token Table (Extend, Don't Replace, the Phase 1 Tokens)

| Token | Dark value | Light value |
| :--- | :--- | :--- |
| `--bg-base` | `#0A0A0B` | `#FAFAFA` |
| `--bg-surface` | `#131315` | `#FFFFFF` |
| `--bg-surface-hover` | `#1B1B1E` | `#F2F2F3` |
| `--border-subtle` | `#232326` | `#E5E5E7` |
| `--border-default` | `#2E2E32` | `#D4D4D6` |
| `--text-primary` | `#EDEDEF` | `#18181B` |
| `--text-secondary` | `#9B9BA1` | `#52525B` |
| `--text-tertiary` | `#6B6B70` | `#8A8A8F` |
| `--accent` | `#7C7FE0` | `#5457C7` (darkened for AA contrast on white) |
| `--success` | `#34A874` | `#1F8A5A` |
| `--warning` | `#C98A2E` | `#A66A1B` |
| `--danger` | `#D14D4D` | `#B23B3B` |

### 1.4 Requirements
- A theme toggle in the top bar (sun/moon icon, `lucide-react`) with three states: **System / Light / Dark**, shown as a small dropdown or segmented control — not just a binary switch, since "system" matters.
- Every existing component from the Phase 1 refactor must be audited to confirm it reads colors from tokens, not literals. This is a hard gate — no PR merges with a hardcoded hex value in a component file.
- **Contrast check**: run WCAG AA validation on both themes (4.5:1 for body text, 3:1 for large text/UI elements) before shipping either.
- Charts/graphs (lead score visualizations, funnel bars) must also theme-swap — don't leave them dark-only.

### 1.5 Acceptance Criteria
- [ ] Toggling theme updates the entire app instantly, no reload
- [ ] No flash of unstyled/wrong theme on first paint
- [ ] Preference persists across sessions
- [ ] All pages pass AA contrast in both modes
- [ ] Zero hardcoded color literals remain in component code

### 1.6 Tooling
Add a lint rule (e.g. ESLint or stylelint config) that flags raw hex/rgb values in `className`/`style` props outside the token definition file, to prevent regression.

---

## 2. Backend API Documentation (OpenAPI / Swagger)

### 2.1 Goal
Every current and future backend endpoint is documented in a single OpenAPI 3.1 spec, auto-generated where possible, and browsable via Swagger UI / Redoc — both for internal engineering and for any future public/partner API.

### 2.2 Approach
- Generate the OpenAPI schema directly from NestJS decorators (`@nestjs/swagger`) on DTOs and controllers.
- Serve the generated spec at `/api/openapi.json` and mount Swagger UI at `/api/docs` (dev/staging only — gate behind auth or disable in production unless this becomes a public API product).
- Version the spec (`info.version`) matching the API version scheme (e.g. semver or `/v1`, `/v2` path versioning).

### 2.3 Endpoint Groups to Document

| Group | Current Endpoints | Planned (Phase 2+) |
| :--- | :--- | :--- |
| **Auth** | login, logout, session/me | refresh tokens, SSO, 2FA |
| **Discovery / Scraping** | run discovery, get scrape status | scheduled/recurring scrapes, webhook callbacks on completion |
| **Leads** | list, get by id, search/filter, export CSV/JSON | bulk update, bulk delete, lead merge/dedupe, lead activity timeline |
| **Opportunities** | list, score detail | opportunity scoring rule config via API |
| **Deals Pipeline** | list stages, move deal, create deal | pipeline automation rules, deal history/audit log |
| **Website Audits** | run audit, get report | scheduled re-audits, audit diff over time |
| **Campaigns / Outreach** | list campaigns, send outreach | outreach sequence builder API, reply webhook ingestion |
| **Settings** | scoring weights, scraper config | per-workspace settings, API key management |
| **Admin** *(new)* | — | users CRUD, roles CRUD, usage stats, audit logs, billing |

### 2.4 API Key / Developer Credentials
The current "Generate Key" UI in Settings needs a real backend contract:
- `POST /api/keys` — create key (returns raw key once, stores hash only)
- `GET /api/keys` — list keys (masked, e.g. `sk_live_****1234`)
- `DELETE /api/keys/:id` — revoke
- Keys must be scoped (read-only vs read-write) and rate-limited per key.

### 2.5 Standards Across All Endpoints
- Consistent error shape: `{ "error": { "code": "string", "message": "string", "details": {} } }`
- Consistent pagination: `?page=&limit=` with `{ "data": [], "meta": { "total": 0, "page": 1, "limit": 20 } }`
- All list endpoints support filtering/sorting query params, documented per-endpoint
- Every endpoint declares required auth scope/role in the OpenAPI spec (`security` field) — this doubles as living documentation for the RBAC system in §3.

### 2.6 Acceptance Criteria
- [ ] `/api/openapi.json` reflects real, current routes with zero manual drift
- [ ] Swagger UI browsable and testable (try-it-out) in dev/staging
- [ ] Every endpoint has: description, request schema, response schema, error responses, required role/scope
- [ ] Postman/Insomnia collection can be generated from the spec for QA

---

## 3. RBAC (Role-Based Access Control)

### 3.1 Goal
Move from the current single "Admin Engineer" implicit-superuser model to real, enforced roles — both on the backend (API-level authorization) and frontend (UI hides/disables what a role cannot do).

### 3.2 Proposed Roles

| Role | Description |
| :--- | :--- |
| **owner** | Full control, billing, can delete workspace, manage admins |
| **admin** | Full operational control (users, settings, all data) — no billing/delete-workspace |
| **manager** | Manage leads/campaigns/deals, view stats, cannot manage users or system settings |
| **member** | Standard user: view/work leads, run discovery, cannot change settings or see other users' data unless shared |
| **viewer** | Read-only across assigned resources — for stakeholders/clients |

### 3.3 Enforcement Layers
- **Backend (source of truth)**: Middleware/guards that check role + resource ownership on every route. Never trust frontend concealment alone.
- **Frontend**: Hide/disable UI elements the current role cannot use with informative tooltips.
- **Data-level scoping**: Determine whether leads/deals are workspace-wide (all members see all) or assigned/owned (only assigned rep + managers/admins see it).

### 3.4 Permission Matrix

| Action | owner | admin | manager | member | viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View leads** | ✅ | ✅ | ✅ | ✅ (own/assigned) | ✅ (read-only) |
| **Run discovery/scrape** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Edit scoring rules** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage users/roles** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View admin stats** | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| **Generate API keys** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Billing** | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Implementation Notes
- Store role as an enum on the user/membership record, not a free-text string.
- Unit-testable permission evaluator: `can(user, action, resource)` used by backend guards and surfaced to frontend via `GET /api/me/permissions`.

### 3.6 Acceptance Criteria
- [ ] All five roles enforced on backend for every existing endpoint
- [ ] Frontend hides/disables actions per role
- [ ] Attempting a disallowed action via direct API call returns `403` with a clear error code
- [ ] Role changes take effect without requiring re-login (session/token refresh)

---

## 4. Admin Panel

### 4.1 Goal
A dedicated `/admin` section (visible only to `owner` and `admin` roles) covering user management, platform stats, and system controls — separate from the day-to-day lead-working UI.

### 4.2 Sections

#### 4.2.1 Users
- **Table**: name, email, role, status (active/invited/suspended), last login, date joined
- **Actions**: invite user (email-based), change role, suspend/reactivate, remove
- **Bulk actions**: bulk role change, bulk deactivate
- **Detail drawer**: activity log (logins, key actions taken), assigned leads/deals count

#### 4.2.2 Stats / Usage
- Platform-wide metrics dashboard: total scrape runs (day/week/month), API credit consumption
- Active users (DAU/WAU/MAU)
- Error rate on scrape jobs (failures vs successes)
- Exportable as CSV for reporting

#### 4.2.3 System Controls
- Relocate "Scraper Worker Engine Settings" (concurrency, delay, UA rotation) to Admin
- Feature flags: toggle features per workspace
- Org-wide API key management
- Audit log: every admin action (role changes, deletions, settings changes) with actor, timestamp, before/after diff

#### 4.2.4 Infrastructure Health
- Relocate "Cluster Status" (PostgreSQL / Redis health) here from the main sidebar.

#### 4.2.5 Billing *(if applicable)*
- Plan, seats used/available, invoice history — restricted to `owner` role.

### 4.3 Acceptance Criteria
- [ ] Non-admin roles get a `404` (not a 403 redirect) on `/admin/*`
- [ ] All admin actions write to the audit log
- [ ] User invite flow sends real email with expiring invite links
- [ ] Stats page loads under 2s with server-side aggregation

---

## 5. Location Intelligence (Country / State / City Dropdowns)

### 5.1 Problem
The current Discovery form uses a free-text "City, State, or Country" input, causing typos, inconsistent data, and poor mobile UX.

### 5.2 Solution
Replace the free-text field with cascading dropdowns: **Country &rarr; State/Region &rarr; City**, each dependent on the previous selection.

### 5.3 Data Source Options
- **Primary**: `country-state-city` npm package — free, offline JSON dataset, no API calls needed, complete coverage.
- **Secondary (Optional future layer)**: Google Places Autocomplete for unlisted rural locations.

### 5.4 UX Requirements
- **Country**: Searchable (type-to-filter), flag emoji + name, defaults to detected locale/country.
- **State/Region**: Disabled until country is selected, populates dynamically.
- **City**: Disabled until state is selected; searchable/type-to-filter. Supports "All Cities in State".
- Preserves existing radius slider.
- Stores structured fields (`country_code`, `state_code`, `city_name`) in the database.
- Upgrades Leads Database city filters to dynamic multi-select using distinct stored city records.

### 5.5 Acceptance Criteria
- [ ] Discovery form location input is fully dropdown-driven, no free text
- [ ] Selections stored as structured fields, not concatenated strings
- [ ] Existing leads' location data backfilled/normalized via migration script
- [ ] Dropdowns are keyboard-navigable and screen-reader labeled (a11y)
- [ ] Works smoothly on mobile viewports

---

## 6. Rollout Plan & Milestones

| Milestone | Scope | Dependencies |
| :--- | :--- | :--- |
| **M1** | Theming system (§1) | Baseline — all pages adapt to CSS custom property inverted tokens |
| **M2** | Location dropdowns (§5) | Independent — runs in parallel with M1 |
| **M3** | RBAC backend enforcement (§3) | Foundation for Admin Panel roles |
| **M4** | OpenAPI / Swagger docs (§2) | Incrementally populated alongside endpoint touches |
| **M5** | Admin Panel (§4) | Depends on M3 (RBAC) and M4 (API Docs) |

---

## 7. Open Questions
1. **Lead/Deal Assignment**: Are leads and deals workspace-wide (all members see all) or assigned to individual sales reps?
2. **Multi-Tenancy**: Is this planned for multi-tenant customer workspaces, or a single-org internal platform?
3. **API Consumer Scope**: Is OpenAPI/Swagger purely for internal dev & QA, or intended for external partner integrations?
4. **Billing Gateway**: Stripe or another preferred gateway for subscription & seat management?
5. **Location Data Source**: Confirm `country-state-city` offline package as the preferred default.
