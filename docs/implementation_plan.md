# LeadEngine Pro — Next Phase Implementation Plan

## Overview

Full next-phase roadmap covering 4 major feature tracks, based on complete repository scan. The system is a NestJS (API) + React/Vite (Web) + BullMQ Worker monorepo on Turborepo.

---

## Phase 1 — Lead Detail Deep-Dive (Tabbed UI + Website Template Prompt)

> **Goal:** Turn `LeadDetailPage.tsx` into a full intelligence cockpit with 5 tabs.

### Current state
- `LeadDetailPage.tsx` already has tabs: `intel | ai_analysis | assistant | outreach`
- Data is rich: `Business` model has `emails[]`, `phones[]`, `websites[]`, `socialProfiles[]`, `contacts[]`, `opportunities[]`, `deals[]`, `notes[]`, `activities[]`

### New Tab Architecture

| # | Tab Key | Label | Content |
|---|---------|-------|---------|
| 1 | `data` | 📊 Data | Full structured business intel card |
| 2 | `prompt` | ✨ Template Prompt | AI-generated website brief / HTML template prompt |
| 3 | `mail` | 📧 Mail | Compose & send email to lead (via SMTP) |
| 4 | `whatsapp` | 💬 WhatsApp | WhatsApp outreach setup |
| 5 | `ai` | 🤖 AI Analysis | Existing AI analysis + assistant chat |

### Tab: `data` — Full Business Intelligence Card
Shows all enriched data in structured sections:
- Basic info: name, category, address, city/state, coordinates, rating
- Website audit scores (performance, SEO, accessibility, mobile)
- All emails with status badges
- All phones with WhatsApp flags
- All social profiles (Facebook, Instagram, LinkedIn, etc.)
- All contacts (primary contact highlighted)
- Opportunities detected (type, value, priority)
- Tags, notes timeline, activity log

### Tab: `prompt` — Website Template Generator
A "copy-to-use" AI prompt that generates a complete HTML/CSS/JS website brief:

```
Template Prompt Structure:
- Business name, category, location (auto-populated)
- Detected opportunities mapped to services needed
- Color palette suggestion based on industry
- Technology recommendations (booking, WhatsApp, contact form)
- Full HTML/CSS/JS template with Motion/GSAP animations
- Sections: Hero, About, Services, Gallery, Contact, Footer
```

**API needed:** `POST /ai/generate-website-prompt` — takes `businessId`, returns structured prompt.

---

## Phase 2 — Email SMTP Integration (Multi-Account + Send from Platform)

> **Goal:** Users add their own SMTP accounts; the platform sends outreach emails.

### Database Changes (New Models)

```prisma
model SmtpAccount {
  id          String   @id @default(uuid())
  userId      String
  name        String   // e.g. "Gmail - Work"
  host        String   // smtp.gmail.com
  port        Int      // 587
  secure      Boolean  @default(false) // TLS
  user        String   // email@gmail.com
  passEncrypted String // AES-256 encrypted
  fromName    String?
  isDefault   Boolean  @default(false)
  isVerified  Boolean  @default(false)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(...)
  sentEmails  OutreachEmail[]
}

model OutreachEmail {
  id           String       @id @default(uuid())
  smtpAccountId String
  businessId   String
  toEmail      String
  subject      String
  body         String       // HTML
  templateId   String?
  status       String       @default("PENDING") // PENDING|SENT|FAILED|OPENED|CLICKED
  messageId    String?      // SMTP message-id for tracking
  sentAt       DateTime?
  openedAt     DateTime?
  clickedAt    DateTime?
  failReason   String?
  trackingId   String       @unique @default(uuid()) // for pixel tracking
  createdAt    DateTime     @default(now())
  smtpAccount  SmtpAccount  @relation(...)
  business     Business     @relation(...)
}
```

### API Endpoints Needed

```
# SMTP Accounts
GET    /api/smtp-accounts          — list user's SMTP accounts
POST   /api/smtp-accounts          — add new SMTP account (test connection)
PATCH  /api/smtp-accounts/:id      — update
DELETE /api/smtp-accounts/:id      — delete
POST   /api/smtp-accounts/:id/test — test connection + send test email
POST   /api/smtp-accounts/:id/set-default

# Email Sending
POST   /api/outreach-emails        — send email to lead
GET    /api/outreach-emails        — list sent emails (filters: businessId, status)
GET    /api/outreach-emails/analytics — open rates, click rates, failure rates

# Email Tracking (open pixel + click redirect)
GET    /api/track/open/:trackingId     — 1x1 pixel (sets openedAt)
GET    /api/track/click/:trackingId    — redirects to URL (sets clickedAt)
```

### UI Changes

**SettingsPage.tsx** → New "Email Accounts" section:
- List of connected SMTP accounts
- Add SMTP form (host, port, user, password, from name)
- Test connection button
- Set as default

**LeadDetailPage.tsx → `mail` tab:**
- "From" dropdown: pick SMTP account
- "To": auto-filled from lead emails (pick one)
- Subject + HTML body editor (with template picker)
- Sent history for this lead (status: sent/opened/failed)

---

## Phase 3 — WhatsApp Integration

> **Goal:** Connect WhatsApp Business API or Baileys (WA Web JS) to send messages.

### Strategy
Two-tier approach:
1. **Phase 3A** (Quick): WhatsApp click-to-chat links + QR code deep links
2. **Phase 3B** (Full): Baileys (WhatsApp Web unofficial API) via worker service

### Database Changes

```prisma
model WhatsappAccount {
  id          String   @id @default(uuid())
  userId      String
  name        String
  status      String   @default("DISCONNECTED") // DISCONNECTED|QR_PENDING|CONNECTED
  sessionData Json?    // encrypted Baileys session
  qrCode      String?  // base64 QR
  phone       String?  // connected phone number
  createdAt   DateTime @default(now())
  messages    WhatsappMessage[]
}

model WhatsappMessage {
  id               String           @id @default(uuid())
  accountId        String
  businessId       String
  toPhone          String
  message          String
  status           String           @default("PENDING")
  sentAt           DateTime?
  deliveredAt      DateTime?
  readAt           DateTime?
  createdAt        DateTime         @default(now())
  account          WhatsappAccount  @relation(...)
  business         Business         @relation(...)
}
```

### UI Changes

**SettingsPage.tsx** → "WhatsApp" section:
- Connect WhatsApp (scan QR code modal)
- Connection status indicator
- Disconnect button

**LeadDetailPage.tsx → `whatsapp` tab:**
- Phase 3A: "Open in WhatsApp" button (wa.me link) with pre-filled message
- Message composer with template picker
- Sent messages history for this lead

---

## Phase 4 — Full Automation Engine

> **Goal:** Set daily lead targets + automated outreach sequences with full analytics.

This is the biggest feature. Architecture:

### Database Changes

```prisma
enum AutomationStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
}

model AutomationCampaign {
  id              String            @id @default(uuid())
  userId          String
  name            String
  description     String?
  status          AutomationStatus  @default(DRAFT)
  
  // Lead Discovery Settings
  searchQuery     String            // e.g. "restaurants"
  location        String?
  dailyLeadTarget Int               @default(10)
  totalLeadTarget Int?              // null = unlimited
  
  // Schedule Settings
  startDate       DateTime
  endDate         DateTime?
  timezone        String            @default("UTC")
  sendWindowStart String            @default("09:00") // HH:MM
  sendWindowEnd   String            @default("18:00")
  daysOfWeek      Json              @default("[1,2,3,4,5]") // Mon-Fri
  
  // Filters for discovered leads
  leadFilters     Json?             // min score, has email, has website, etc.
  
  // Stats
  leadsDiscovered Int               @default(0)
  emailsSent      Int               @default(0)
  emailsOpened    Int               @default(0)
  emailsClicked   Int               @default(0)
  emailsFailed    Int               @default(0)
  replies         Int               @default(0)
  
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  user            User              @relation(...)
  sequences       AutomationSequence[]
  runs            AutomationRun[]
}

model AutomationSequence {
  id            String             @id @default(uuid())
  campaignId    String
  stepIndex     Int                // order: 0, 1, 2, ...
  channel       String             // EMAIL | WHATSAPP
  templateId    String?
  customSubject String?
  customBody    String?
  delayDays     Int                @default(0)  // days after previous step
  delayHours    Int                @default(0)
  condition     String?            // "NOT_OPENED" | "NOT_REPLIED" | "ALWAYS"
  campaign      AutomationCampaign @relation(...)
}

model AutomationRun {
  id          String             @id @default(uuid())
  campaignId  String
  businessId  String
  currentStep Int                @default(0)
  status      String             @default("ACTIVE") // ACTIVE|COMPLETED|OPTED_OUT
  startedAt   DateTime           @default(now())
  nextActionAt DateTime?
  campaign    AutomationCampaign @relation(...)
  business    Business           @relation(...)
}
```

### New Worker: `automation.worker.ts`

BullMQ worker listening on `automation` queue:
- Job type `RUN_AUTOMATION_TICK`: runs every 15 minutes via cron
  - Finds active automation campaigns
  - Checks if within send window
  - Discovers new leads if daily target not met
  - Processes pending `AutomationRun` items (send next sequence step)
  - Updates analytics

### New API Module: `automations/`

```
GET    /api/automations              — list user's automations
POST   /api/automations              — create automation
GET    /api/automations/:id          — detail + stats
PATCH  /api/automations/:id          — update
DELETE /api/automations/:id          — delete
POST   /api/automations/:id/start    — activate
POST   /api/automations/:id/pause    — pause
POST   /api/automations/:id/resume   — resume
GET    /api/automations/:id/analytics — open/click/fail rates by day
GET    /api/automations/:id/runs     — per-lead status
```

### New Page: `AutomationPage.tsx`

Route: `/automations`

**Layout:**
1. **Header stats bar**: Active automations, leads in sequence, emails sent today, open rate
2. **Automation cards**: Per-campaign summary (status badge, progress bar, daily stats)
3. **Create/Edit modal**: 6-step wizard
   - Step 1: Name + Description
   - Step 2: Lead target (query, location, daily target, filters)
   - Step 3: Schedule (date range, timezone, send window, days of week)
   - Step 4: Email accounts (pick SMTP account)
   - Step 5: Sequence builder (drag-drop steps, each step: template + delay + condition)
   - Step 6: Review + Launch

**Analytics Panel per Automation:**
- Timeline chart (emails sent/opened/clicked by day)
- Funnel visualization (discovered → emailed → opened → clicked → replied)
- Per-lead breakdown table

---

## Implementation Order

```
Week 1:  Phase 1 (Lead Detail Tabs + Template Prompt)
Week 2:  Phase 2 (SMTP Integration: DB + API + Settings UI + Mail Tab)
Week 3:  Phase 2 (Email tracking pixel + analytics)
Week 4:  Phase 3A (WhatsApp click-to-chat + message tab)
Week 5:  Phase 4 (Automation DB schema + API + Worker)
Week 6:  Phase 4 (Automation UI: page + wizard + analytics)
Week 7:  Phase 3B (Full Baileys WhatsApp session)
Week 8:  Polish, bug fixes, end-to-end testing
```

---

## Files to Create / Modify

### Backend (API)

#### [NEW] `apps/api/src/smtp-accounts/`
- `smtp-accounts.module.ts`
- `smtp-accounts.controller.ts`
- `smtp-accounts.service.ts` — nodemailer, AES-256 password encrypt, test connection

#### [NEW] `apps/api/src/outreach-emails/`
- `outreach-emails.module.ts`
- `outreach-emails.controller.ts`
- `outreach-emails.service.ts` — send email, tracking pixel endpoint

#### [NEW] `apps/api/src/whatsapp/`
- `whatsapp.module.ts`
- `whatsapp.controller.ts`
- `whatsapp.service.ts`

#### [NEW] `apps/api/src/automations/`
- `automations.module.ts`
- `automations.controller.ts`
- `automations.service.ts`

#### [MODIFY] `apps/api/src/ai/ai.service.ts`
- Add `generateWebsitePrompt(businessId)` method

#### [MODIFY] `apps/api/src/app.module.ts`
- Register new modules + `automation` queue

#### [MODIFY] `packages/database/prisma/schema.prisma`
- Add `SmtpAccount`, `OutreachEmail`, `WhatsappAccount`, `WhatsappMessage`, `AutomationCampaign`, `AutomationSequence`, `AutomationRun`

### Worker

#### [NEW] `apps/worker/src/workers/automation.worker.ts`
- BullMQ processor for `automation` queue
- Cron-triggered tick logic

#### [MODIFY] `apps/worker/src/main.ts`
- Register `AutomationWorker`

### Frontend (Web)

#### [MODIFY] `apps/web/src/pages/LeadDetailPage.tsx`
- Restructure tabs: `data | prompt | mail | whatsapp | ai`
- Add full data tab layout
- Add prompt tab with generate + copy button
- Add mail tab (compose, history)
- Add WhatsApp tab

#### [MODIFY] `apps/web/src/pages/SettingsPage.tsx`
- Add "Email Accounts" section (SMTP management)
- Add "WhatsApp" section (QR connect)

#### [NEW] `apps/web/src/pages/AutomationPage.tsx`
- Full automation management page

#### [MODIFY] `apps/web/src/App.tsx`
- Add `/automations` route

#### [MODIFY] `apps/web/src/components/layout/Sidebar.tsx`
- Add "Automations" nav item with ⚡ icon

#### [MODIFY] `apps/web/src/lib/api.ts`
- Add API client methods for smtp-accounts, outreach-emails, whatsapp, automations

---

## Open Questions

> [!IMPORTANT]
> **Password encryption key for SMTP**: Where should the AES-256 key live? Suggest adding `SMTP_ENCRYPTION_KEY` to `.env` and docker-compose.

> [!IMPORTANT]
> **Email tracking**: Open-pixel tracking requires a public URL. The `/api/track/open/:id` endpoint is already served publicly. Confirm `leads.kachakaran.me` domain is accessible.

> [!WARNING]
> **WhatsApp Baileys (Phase 3B)**: Baileys uses WhatsApp Web protocol — it's unofficial and can get numbers banned if abused. Recommend rate-limiting heavily (max 50 msgs/day per account). Shall we go ahead?

> [!NOTE]
> **Nodemailer**: `npm install nodemailer @types/nodemailer` needed in `apps/api`. Also `npm install node-forge` or `crypto` (built-in) for AES encryption — built-in `crypto` is sufficient.

> [!NOTE]
> **Sidebar item**: Currently sidebar has: Dashboard, Discover, Leads, Opportunities, Deals, Websites, Campaigns, Outreach, Settings. Adding "Automations" between Campaigns and Outreach makes logical sense.
