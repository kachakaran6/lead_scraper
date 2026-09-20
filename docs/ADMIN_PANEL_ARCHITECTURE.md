# Lead Scrapper — Production Admin Panel & Security Architecture

## 1. Overview & Core Mission

The **Lead Scrapper Admin Panel** (`https://leadsadmin.kachakaran.me`) is a separate, dedicated administrative control plane and authorization gateway for the Lead Scrapper platform (`https://leads.kachakaran.me`).

### Core Authorization Invariant
> **No user can execute scrapers, discover leads, or consume worker pipelines unless explicitly authorized with `ACTIVE` account status and `scraperAccess: true` by an administrator.**

---

## 2. System Architecture

```text
                     Internet
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
leadsadmin.kachakaran.me          leads.kachakaran.me
(Admin Control Plane)             (Protected Scraper App)
       │                                 │
       ▼                                 ▼
 Admin Nginx (Port 5174)           Web Nginx (Port 5173)
       │                                 │
       │   /api/                         │   /api/
       └───────────────┬─────────────────┘
                       ▼
             leads-api.kachakaran.me
             NestJS API (Port 4000)
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
 [AdminGuard]               [ScraperAccessGuard]
 (Requires ADMIN/OWNER)      (Requires ACTIVE + scraperAccess)
       │                               │
       ▼                               ▼
 /api/admin/*               /api/scrape/*, /api/discovery/*,
 User Management            /api/jobs/*, /api/autopilot/*
       │                               │
       └───────────────┬───────────────┘
                       ▼
               PostgreSQL Database
          (User & AuditLog Schema)
```

---

## 3. User Authorization & Access Model

```text
User State Model:
- accountStatus: PENDING | ACTIVE | SUSPENDED | DISABLED
- scraperAccess: true | false
- role: OWNER | ADMIN | MEMBER | VIEWER
```

### Lifecycle Flow:
1. **New User Registration (`/auth/register`)**:
   - `accountStatus = PENDING`
   - `scraperAccess = false`
   - `role = MEMBER`
   - Scraper & Discovery APIs are denied (`403 Forbidden: ACCOUNT_PENDING_APPROVAL`).
2. **Admin Approval (`POST /api/admin/users/:id/approve`)**:
   - `accountStatus = ACTIVE`
   - `scraperAccess = true`
   - User is unblocked and can use the scraper immediately.
3. **Access Revocation (`POST /api/admin/users/:id/revoke-access`)**:
   - `scraperAccess = false`
   - Future scraping calls are immediately blocked (`403 Forbidden: SCRAPER_ACCESS_REVOKED`).
4. **Account Suspension (`POST /api/admin/users/:id/suspend`)**:
   - `accountStatus = SUSPENDED`
   - `scraperAccess = false`
5. **Account Disabling (`POST /api/admin/users/:id/disable`)**:
   - `accountStatus = DISABLED`
   - `scraperAccess = false`

---

## 4. Protected Endpoints Matrix

| Controller / Endpoint | Guard Applied | Requirement |
| :--- | :--- | :--- |
| `POST /api/scrape/enrich` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `POST /api/scrape/stream` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `POST /api/discovery/stream` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `POST /api/discovery/profiles` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `POST /api/autopilot/profiles` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `POST /api/jobs` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `GET /api/exports/*` | `ScraperAccessGuard` | `accountStatus == ACTIVE && scraperAccess == true` |
| `GET /api/admin/*` | `AdminGuard` | `role == ADMIN || role == OWNER` |

---

## 5. Initial Admin Bootstrap Procedure

To promote an existing verified account or create an initial administrator safely without hardcoding credentials:

```bash
# Inside the container or locally with DATABASE_URL configured:
npx ts-node scripts/bootstrap-admin.ts <admin_email> [password]
```

### Security Properties:
- Idempotent (safe to run multiple times).
- Promotes existing accounts to `OWNER` role with `accountStatus: ACTIVE` and `scraperAccess: true`.
- Creates an immutable `BOOTSTRAP_ADMIN` entry in the `AuditLog`.
- Never prints passwords or tokens in stdout or logs.

---

## 6. Audit Logging & Security Accountability

Every administrative action is recorded in PostgreSQL:

| Log Action | Trigger | Metadata Recorded |
| :--- | :--- | :--- |
| `USER_APPROVED` | Administrator approves user | Approver ID, Target User ID, Timestamp, IP |
| `SCRAPER_ACCESS_GRANTED` | Administrator grants scraper access | Approver ID, Target User ID, Timestamp, IP |
| `SCRAPER_ACCESS_REVOKED` | Administrator revokes access | Approver ID, Reason, Target User ID, IP |
| `USER_DISABLED` | Administrator disables account | Approver ID, Reason, Target User ID, IP |
| `USER_SUSPENDED` | Administrator suspends account | Approver ID, Reason, Target User ID, IP |
| `USER_ENABLED` | Administrator restores account | Approver ID, Target User ID, Timestamp, IP |
| `ROLE_CHANGED` | Administrator changes role | Old role, New role, Approver ID, IP |

---

## 7. Deployment Configuration (Coolify & Caddy)

The application stack in `docker-compose.yml` includes the new `admin` service container:

```yaml
admin:
  build:
    context: .
    dockerfile: apps/admin/Dockerfile
  restart: unless-stopped
  depends_on:
    - api
  networks:
    coolify:
      aliases:
        - admin
        - leads-admin
    leads-internal:
      aliases:
        - admin
        - leads-admin
  expose:
    - "80"
  ports:
    - "5174:80"
  labels:
    - "caddy=https://leadsadmin.kachakaran.me, http://leadsadmin.kachakaran.me, https://leadsadmin.kachakaran.tech, http://leadsadmin.kachakaran.tech, http://leadsadmin.141.148.214.132.sslip.io"
    - "caddy.reverse_proxy={{upstreams 80}}"
    - "caddy.networks=coolify"
```
