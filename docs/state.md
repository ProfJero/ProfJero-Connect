# ProfJero SMS — Project State

_Last updated: 2026-09-18. This is the single source of truth for anyone
continuing this project — human developer or AI assistant. If you're picking
up from a fresh chat, read this file first._

---

## 1. What this project is

ProfJero SMS is a central SMS infrastructure and management platform that sits
between many independent client projects and an SMS provider (Arkesel).

**Problem it solves:** each client (GABS, DBI, Church A, Pharmacy, School,
HealthPlus, etc.) currently sends SMS independently. ProfJero SMS becomes the
single gateway with:

- Per-project API credentials (each client authenticates with a
  ProfJero-issued API key; **no client Firebase / Supabase / DB config is ever
  stored here**)
- A per-project wallet with an append-only ledger (separate from the Arkesel
  provider balance)
- Full audit trails for messages, wallet changes, payments
- Admin command centre for all projects
- Payment processing via Paystack (future gateways supported)

**Business model:** currently internal infrastructure for the owner's own
projects and clients. Later may evolve into multi-tenant SaaS. Data model is
tenant-shaped from day one so this doesn't require a rewrite.

**Status:** Frontend v1 is complete — **10 admin screens** built and
navigable, fully mocked. The app shell is responsive (mobile drawer).
Backend, Firebase, and real integrations are not yet implemented.

---

## 2. Current status (at a glance)

| Area | Status |
|---|---|
| Admin dashboard (frontend, mocked) | ✅ Done, desktop + mobile |
| Responsive shell (mobile drawer) | ✅ Done |
| Send SMS screen | ✅ Done |
| Project Details screen (standalone `/projects/:id`) | ✅ Done |
| Backend (`apps/api`, Cloudflare Workers + Hono) | ❌ Not started |
| Firebase Auth + Firestore | ❌ Not started |
| Arkesel integration | ❌ Not started |
| Paystack integration | ❌ Not started |
| Wallet ledger logic | ❌ Not started |

---

## 3. Repository structure
profjero-sms/
├── apps/
│ └── web/ # React + Vite admin dashboard (only app so far)
│ ├── src/
│ │ ├── components/
│ │ │ ├── layout/ # AppLayout, Sidebar, Topbar
│ │ │ ├── ui/ # Card, StatusBadge, StatusDot, TableScroll
│ │ │ ├── dashboard/ # Dashboard-specific components
│ │ │ ├── projects/ # Project list + project details components
│ │ │ ├── sms-logs/ # SMS Logs components
│ │ │ ├── wallets/ # Wallets components
│ │ │ ├── payments/ # Payments components
│ │ │ ├── arkesel/ # Arkesel components
│ │ │ ├── reports/ # Reports components
│ │ │ ├── settings/ # Settings components
│ │ │ └── send-sms/ # WizardBar, ComposeForm, SendSmsSidebar
│ │ ├── features/ # Page-level components (one per route)
│ │ │ ├── dashboard/
│ │ │ ├── projects/ # ProjectsPage.tsx + ProjectDetailsPage.tsx
│ │ │ ├── sms-logs/
│ │ │ ├── wallets/
│ │ │ ├── payments/
│ │ │ ├── arkesel/
│ │ │ ├── reports/
│ │ │ ├── settings/
│ │ │ ├── send-sms/
│ │ │ └── ComingSoon.tsx # Unused — kept for future
│ │ ├── lib/
│ │ │ ├── utils.ts # cn() classname helper
│ │ │ └── nav.ts # nav item definitions
│ │ ├── mock/ # ⚠️ ALL mock data lives here, clearly labelled
│ │ │ ├── dashboard.ts
│ │ │ ├── projects.ts
│ │ │ ├── projectDetails.ts
│ │ │ ├── smsLogs.ts
│ │ │ ├── wallets.ts
│ │ │ ├── payments.ts
│ │ │ ├── arkesel.ts
│ │ │ ├── reports.ts
│ │ │ ├── settings.ts
│ │ │ └── sendSms.ts
│ │ ├── App.tsx # Router
│ │ ├── main.tsx
│ │ └── index.css # Tailwind directives + custom scrollbar
│ ├── index.html
│ ├── package.json
│ ├── tailwind.config.js
│ ├── postcss.config.js
│ ├── vite.config.ts
│ └── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── packages/ # Currently empty (reserved for shared/)
├── firebase/ # Currently empty (reserved for rules + indexes)
├── docs/
│ └── state.md # This file
├── .gitignore
├── package.json # Root workspace config
└── package-lock.json

text

**Root `package.json`** uses npm workspaces:
```json
{ "workspaces": ["apps/*", "packages/*"] }
4. Tech stack
Frontend (implemented)
React 19.2 — UI

TypeScript 6.0

Vite 8 — dev server + build

Tailwind CSS 3.4 — styling (v3, NOT v4)

Lucide React 1.47 — icons

Recharts 3.10 — charts

React Router 7 — routing

Backend (planned, not built)
Cloudflare Workers

Hono

TypeScript

Firebase Admin SDK (for Firestore access)

Data (planned)
Firestore — primary database

Firebase Auth — admin authentication

Integrations (planned)
Arkesel — SMS provider

Paystack — payments (initial gateway)

Hosting (planned)
Cloudflare (Workers + Pages or static)

5. Design system
Tokens (implemented in Tailwind classes)
Sidebar

Background: #0c1e38

Active nav item: #1976d2 (white text)

Hover: bg-slate-800/50

Width: w-[260px] desktop, hidden drawer on < lg (1024px)

Card bg: #142646, footer accent: #122646

Body / page

Background: #f1f5f9

Content text: text-slate-800, base font 13px

Primary action (buttons, links)

#1976d2 (hover: bg-blue-600)

Status colors (in StatusBadge.tsx)

Success: emerald

Danger: rose

Warning: amber

Info: blue

Purple: refunded

Typography

Font family: Inter (loaded via Google Fonts in index.html)

Card titles: font-bold text-sm text-slate-800

Section labels: text-xs text-slate-500

Components

Cards: bg-white rounded-xl border border-slate-200/80 shadow-xs

Buttons: rounded-lg, small font (text-xs)

Tables: text-xs, divide-y divide-slate-100

Layout rules
Desktop (≥ lg / 1024px): fixed sidebar visible, content scrolls independently

Mobile (< lg): sidebar becomes drawer with backdrop, hamburger in topbar

Page padding: p-4 sm:p-6 lg:p-7

Wide tables: wrapped in <TableScroll> which adds horizontal scroll +
right-edge fade hint

Two-column page grids default to lg: breakpoint. The Send SMS page
is an intentional exception — it uses sm: because the compose form + summary
look fine side-by-side from 640px+.

6. What's built (frontend)
Shell
apps/web/src/components/layout/AppLayout.tsx — owns drawer state, closes
on route change and Escape key, resolves per-route subtitle

apps/web/src/components/layout/Sidebar.tsx — responsive drawer + fixed
desktop mode, controlled by open / onClose props; "Send SMS" quick action
links to /send-sms

apps/web/src/components/layout/Topbar.tsx — hamburger (mobile only), page
subtitle, date pill (md+ only), notifications, profile

Screens (routes in App.tsx)
Route	Page	Notes
/	→ redirects to /dashboard	
/dashboard	Dashboard	8 KPI cards, 2 charts, tables, right sidebar
/projects	Projects / Clients	5 KPI cards, 10-col table, details panel
/projects/:id	Project Details	Header card + 7 KPI cards + 5 sub-cards + 2 tables
/sms-logs	SMS Logs	5 KPI cards, filter bar, 11-col table, details inspector
/wallets	Wallets & Units	4 KPI cards, wallets table, donut, transaction history
/payments	Payments	7 narrow KPI cards, 12-col table, details inspector
/arkesel	Arkesel Account	8-card provider grid, Sender IDs, API monitoring
/reports	Reports	KPI row, 5 charts, 2 tables, footer banners
/settings	Settings	7 tabs, forms, promo cards
/send-sms	Send SMS	3-step wizard, compose form, summary + preview
*	→ redirects to /dashboard	
Shared UI components
Card, CardHeader, CardTitle, ViewAllLink — from components/ui/Card.tsx

StatusBadge — auto-maps statuses to color variants

StatusDot — small dot + label for Active/Suspended

TableScroll — wrapper for horizontally scrollable tables (adds fade hint)

WizardBar — 3-step indicator used on Send SMS (components/send-sms/)

Responsive behavior
Dashboard, Projects, SMS Logs: explicitly swept (page padding, KPI grid
breakpoints, table scroll, filter bars)

Send SMS: explicitly tuned (form/summary side-by-side from sm:)

Wallets, Payments, Arkesel, Reports, Settings: desktop-first, verified
visually acceptable on mobile but not formally swept — revisit if issues
appear

Project Details: built responsive from the start

7. Architectural decisions (summary)
These were agreed during Stage 2 & Stage 3 planning. The backend MUST follow
these. Do not improvise.

Wallet model — Reserve / Confirm / Release
Units are never deducted directly. The flow is:

text
AVAILABLE → RESERVED → SEND TO PROVIDER → CONFIRM (success) OR RELEASE (failure)
The wallet document has two fields: availableUnits and reservedUnits.
Every change goes through a walletTransactions entry.

Ledger semantics
Every ledger entry has availableDelta and reservedDelta:

Type	availableDelta	reservedDelta
reserve	-N	+N
confirm	0	-N
release	+N	-N
purchase	+N	0
refund	-N	0
manual_credit	+N	0
manual_debit	-N	0
reversal	signed	signed
adjustment	signed	signed
The ledger is the immutable source of truth; the wallet is a snapshot.
Ledger entries are never updated or deleted. Corrections use compensating
entries. Doc IDs for reserve/confirm/release/purchase/refund/reversal are
deterministic (e.g. reserve__{batchId}, confirm__{batchId}__{recordId}).

No provider call inside a Firestore transaction
External API calls (Arkesel, Paystack) never occur inside a Firestore
transaction. Transaction retries would cause duplicate external operations.

Correct flow:

Firestore transaction: claim idempotency + reserve units + create batch

Commit

Provider call (outside any transaction)

Firestore transaction: confirm or release + update records

Idempotency — atomic claim
Simple check→process→save is not enough. Use a dedicated collection with
states processing, completed, failed. The claim happens inside a
Firestore transaction so two concurrent requests can't both see a missing key.

Doc ID pattern: {scope}__{projectId}__{key} (deterministic).

Per-recipient accounting
A batch request to /v1/sms/send creates one smsBatch and N smsRecords.
Each record owns its own unitsReserved, unitsCharged, unitsReleased.
A partial batch outcome (some sent, some failed, some unknown) resolves
per-record — never charge or release the whole batch.

SMS statuses (defined for future backend)
queued, submitting, submitted, delivered, failed, unknown, released

submitted means the provider accepted the request. It does NOT mean the
recipient received the message. Real delivery confirmation requires
Arkesel's delivery mechanism, which is not yet implemented.

Treat provider timeouts as unknown — do not release units immediately,
because the SMS may have actually gone out. Reconciliation handles these.

Idempotency for public API
POST /v1/sms/send requires an idempotency key

Webhooks (Paystack, future Arkesel) use the gateway's event ID

Same key + different body → 409

Refunds vs Reversals
Three distinct concepts:

Payment — the customer paid

Gateway Refund — money returned via Paystack

Wallet Reversal — compensating ledger entry (may partially recover units;
shortfall is recorded in unitsUnrecovered)

Marking a payment refunded does NOT auto-reverse the wallet credit.

Three API surfaces (backend design)
Public Project API (/v1/*) — API-key auth, for external clients

Admin API (/admin/*) — Firebase Auth + backend role check

Webhook API (/webhooks/*) — signature verification, no user auth

The Worker is the security boundary. /admin/* routes are publicly
reachable over HTTPS — they rely on auth, not obscurity.

API keys
Cryptographically random

Prefix for fast lookup (not secret)

HMAC-SHA256 or Argon2id hash of the secret (never plaintext)

Plaintext shown once at creation

Revoked keys rejected immediately

Rotation = create new + overlap window + revoke old

Provider abstraction
SMS and Payments each behind a provider interface

Arkesel is the first SMS provider

Paystack is the first payment provider

Multiple providers can be added without touching domain services

No over-engineering for v1
No Kafka, no Kubernetes, no CQRS, no event sourcing, no microservices, no
unnecessary Durable Objects. Reliable, correct, secure — not fashionable.

8. Data model (conceptual — not implemented)
Full field-level spec was designed during Stage 3. Summary of collections:

Collection	Purpose
admins	Dashboard users. Roles: super_admin, admin, finance, support, viewer
projects	External clients. Never store their Firebase/Supabase config
apiKeys	Per-project credentials. keyHash, keyPrefix, status
wallets	One doc per project. availableUnits, reservedUnits, thresholds
walletTransactions	Append-only ledger. Authority for wallet state
smsBatches	One per public API send request
smsRecords	One per recipient. Owns its own reservation/charge/release
senderIds	Global sender ID registry
senderIdAssignments	M:N link — which project may use which sender ID
payments	Paystack payments. Links to wallet credit
refunds	Gateway refunds + wallet reversal outcome
packages	Purchasable unit bundles
providerAccounts	Arkesel account metadata (secrets live in Worker env)
providerRequests	Rolling operational log of provider calls
idempotencyKeys	Atomic claim with TTL, for public API + webhooks
auditLogs	Every sensitive admin/system action
notifications	Low balance, payment, failed SMS, provider errors
settings	Fixed ID docs: platform, sms, payments, notifications, security
Detailed field specs available in the chat history (Stage 3). Reconstruct
before coding the backend — do not improvise.

9. What's mocked
Everything under apps/web/src/mock/*.ts is mock data for UI development.
Every file starts with a clear comment:

text
// ⚠️ MOCK DATA — replace with Admin API calls once the backend is wired.
Files:

dashboard.ts

projects.ts

projectDetails.ts

smsLogs.ts

wallets.ts

payments.ts

arkesel.ts

reports.ts

settings.ts

sendSms.ts

Do not present mocked values as real. When the backend lands, each mock
file gets replaced with an API call + loading/error states.

10. What's next (in order)
Done — all frontend screens
✅ Dashboard

✅ Projects / Clients

✅ SMS Logs

✅ Wallets & Units

✅ Payments

✅ Arkesel Account

✅ Reports

✅ Settings

✅ Send SMS

✅ Project Details

Next (start a fresh chat)
Start by reading this document. Then:

Scaffold apps/api — Cloudflare Workers + Hono. Use
npm create cloudflare@latest or manual setup. Folder structure:
routers/, middleware/, services/, providers/, repositories/,
lib/, types/.

Shared package — packages/shared for types + Zod schemas used by
both apps/web and apps/api.

Firebase project — Auth (email/password, admin accounts only) +
Firestore in prod mode. Empty collections for now.

Admin auth — Firebase Auth on frontend, ID token verification on
Worker, custom claims for roles, admins collection.

Projects CRUD — real, backed by Firestore.

Wallets + Ledger — implement the reserve/confirm/release flow from §7.

Public API + Arkesel — API-key auth, SMS send, reserve/confirm/release.

Payments — Paystack webhook, verification, wallet credit.

Reports — replace mocks with real aggregates.

Notifications + Audit log viewer.

Hardening — rate limits, reconciliation sweep, security review.

Deploy — Cloudflare + Firebase prod.

10.5 Known issues / cleanup
Send SMS breakpoint at sm: (640px) — this page's grid uses
sm:grid-cols-12 instead of md: or lg:, so the two-column layout kicks
in earlier than other screens. Chosen because the compose form + summary look
good side by side from 640px+. Do not "fix" this without testing.

Mock unit calculation — Send SMS HTML showed "97 characters, 2 units."
Real GSM-7 calc for 97 chars is 1 unit. Mock preserves HTML values for UI
parity; real calculation lives in the backend.

ProjectDetailsPage ignores the URL :id — always shows GABS data.
Replace with a real fetch when the backend exists.

Projects table row → details navigation — clicking a row navigates to
/projects/proj_00N. The details page ignores the id.

ComingSoon.tsx — no longer imported by any route. Can be deleted or
kept for future use.

11. Conventions
Code
TypeScript strict mode

Functional components with hooks

Feature-based folder structure (see §3)

import type for type-only imports

Named exports for components and pages; App.tsx uses default export

Prefer small, focused components over large pages

Business logic in lib/ or feature hooks, not in components

Styling
Tailwind classes inline

Never use arbitrary hex values where a Tailwind token exists — but where
brand colors are needed (#1976d2, #0c1e38) they're used literally

Rounded corners: rounded-xl for cards, rounded-lg for buttons/inputs

Shadows: shadow-xs (custom, defined in tailwind config)

Data
All components accept typed props (TypeScript interfaces in the same file
or in mock/*.ts)

No any

Never hardcode data inside components — put it in mock/ files

Git
Commit after each screen or significant refactor

Commit message style: feat: ..., refactor: ..., fix: ..., chore: ...,
docs: ...

Icons
Lucide React only

If an icon is missing, swap to the closest equivalent — no new icon libraries

12. How to run
From repo root:

cmd
cd apps\web
npm install        # first time
npm run dev        # http://localhost:5173
Build:

cmd
npm run build      # outputs to apps/web/dist
No environment variables needed yet. When Firebase + Cloudflare are added,
.env.example will be committed.

13. Notes for the next assistant / developer
The user prefers step-by-step batches. When delivering code, split into
"Batch A" (routing/small files) and "Batch B" (larger content) so they can
verify between steps.

They use Windows Command Prompt. Use del, mkdir, dir /s /b etc.,
not bash.

They use VS Code. Occasionally files land in the wrong folder if the
explorer selection is off — if an import fails, run
dir /s /b src\*{filename}* to find duplicates.

They are learning. Explain why a decision is made, not just what.

Do not silently mock things. If something is faked, label it clearly.

Do not use placeholder functionality and pretend it's production-ready.

Test responsive behavior in DevTools (Ctrl+Shift+M) with a specific
viewport width. Windows display scaling sometimes makes wide monitors report
narrow viewports, triggering mobile breakpoints unexpectedly.