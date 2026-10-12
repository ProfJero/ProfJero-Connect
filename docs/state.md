# ProfJero SMS — Project State

_Last updated: 2026-10-02. This is the single source of truth for anyone
continuing this project — human developer or AI assistant. If you're picking
up from a fresh chat, read this file first._

---

## 0. Read first

If you're picking up this project from a new chat:

1. Read this file in full. It covers the entire platform — admin + customer.
2. Check the current git status and confirm what's deployed:
   `npx wrangler deployments list --env production` from `apps/api`.
3. If you're doing backend work, also see `docs/customer-platform.md` for
   the product vision of the customer side.

Then ask before assuming. The platform has been through many iterations and
some decisions are non-obvious. When in doubt, check the reasoning in §7
(Architectural decisions) before improvising.

---

## 1. What this project is

**ProfJero Connect** is a central SMS and communications infrastructure
platform. Two distinct product surfaces serve two distinct audiences:

### Admin platform (`apps/web`)
Serves the operator (you). Manages:
- External client projects (GABS, DBI, Church A, Pharmacy, School, etc.)
- Per-project wallets with an append-only ledger
- API keys issued to clients
- Arkesel provider account
- Payments received via Paystack
- Reports, platform settings, team/admin users, audit log, alerts, system health

**Tech-independence rule:** clients authenticate with ProfJero-issued API
keys. No client Firebase/Supabase/DB config is ever stored on our side.

### Customer platform (`apps/customer`)
Serves ProfJero's own customers — businesses, organisations or individuals
who want to send SMS without their own system. They:
- Sign up self-service
- Buy units via mobile money or card
- Send SMS
- Track transactions and history
- Request Sender IDs
- Integrate via API

**Product direction:** SMS-first, multi-service-ready (Airtime, Data
Bundles to follow on the same infrastructure).

### Central SMS infrastructure
Both surfaces feed the same backend. Client calls go:
External Project (API key) ──┐
├──► ProfJero API ──► Firestore + Arkesel
Customer platform (Firebase) ┘

text

**Status:**
- Admin platform: **built, deployed, functional**.
- Customer platform: **built end to end (CP1–CP7), awaiting deploy** — see §14.

---

## 2. Current status (at a glance)

| Area | Status |
|---|---|
| **Admin frontend** (React, 10 screens) | ✅ Done, desktop + mobile |
| **Admin backend** (Cloudflare Workers + Hono) | ✅ Done, deployed |
| **Admin auth** (Firebase Auth, roles) | ✅ Done |
| **Public Project API** (`/v1/*`) | ✅ Done |
| **Admin API** (`/admin/*`) | ✅ Done |
| **Paystack webhook** | ✅ Done |
| **Arkesel integration** | ✅ Done |
| **Wallet ledger logic** | ✅ Done |
| **Customer frontend** (React, 13 screens) | ✅ Done, all screens on live `/customer/*` data — no mocks |
| **Customer backend** (`/customer/*` surface) | ✅ Done (§14), e2e-tested, not yet deployed |
| **Customer auth** (self-signup, Firebase) | ✅ Done — signup, login, reset/change password |
| **Customer-facing Paystack flow** | ✅ Done — packages + custom amount, MoMo/card |
| **Notifications system** (in-app + email) | ✅ Done — in-app + Resend email (optional) |
| **Arkesel delivery receipts** | ⚠️ Not firing in production (see §10.5) |
| **Admin Settings / Team / Audit / System** | ✅ Done, real (§15) — no mocks left in the admin app |
| **Alert bell + live provider balance** | ✅ Done (§15) |
| **Rate limiting + security hardening** | ✅ Done (§15) |
| **Firestore security rules** | ✅ Deny-all + emulator tests (§15) — deploy them |
| **Background sending + personalised SMS + campaigns** | ✅ Done (§16) |
| **Monitoring** (health, traffic, latency, errors, abuse) | ✅ Done (§16) — admin → Monitoring |
| **Logo, SEO, share previews, public API docs** | ✅ Done (§16) |
| **Data bundles** (catalogue, checkout, delivery, refunds, admin orders) | ✅ Done (§17) — needs the Firestore indexes |
| **Services-first customer UI** (catalogue-driven nav, Buy menu, launcher) | ✅ Done (§17) |
| **Automatic Sender ID approval + provider verification** | ✅ Done (§18) |
| **Verified sign-ups** (email link, Google, confirmed passwords) | ✅ Done (§18) — Firebase console steps below |
| **Multi-service dashboard, update notices** | ✅ Done (§18) |
| **Test suites** (API, security, features, load, rules, browser, a11y, mobile) | ✅ All passing — see `docs/testing.md` |

---

## 3. Repository structure
profjero-sms/
├── apps/
│ ├── web/ # ADMIN dashboard (React + Vite)
│ │ ├── src/
│ │ │ ├── components/
│ │ │ │ ├── layout/ # AppLayout, Sidebar, Topbar
│ │ │ │ ├── ui/ # Card, StatusBadge, StatusDot, TableScroll
│ │ │ │ ├── dashboard/ # Admin dashboard components
│ │ │ │ ├── projects/ # Project list + details components
│ │ │ │ ├── sms-logs/
│ │ │ │ ├── wallets/
│ │ │ │ ├── payments/
│ │ │ │ ├── arkesel/
│ │ │ │ ├── reports/
│ │ │ │ ├── settings/
│ │ │ │ ├── auth/ # LoginPage pieces (LoginHero, LoginForm)
│ │ │ │ └── send-sms/ # WizardBar, ComposeForm, SendSmsSidebar
│ │ │ ├── features/ # Page-level components (one per route)
│ │ │ ├── lib/
│ │ │ │ ├── utils.ts # cn() helper
│ │ │ │ ├── nav.ts
│ │ │ │ └── auth.tsx # Admin auth context (Firebase)
│ │ │ ├── mock/ # ⚠️ All mock data labelled clearly
│ │ │ ├── App.tsx
│ │ │ ├── main.tsx
│ │ │ └── index.css
│ │ └── package.json
│ │
│ └── customer/ # CUSTOMER platform (React + Vite)
│ ├── src/
│ │ ├── components/
│ │ │ ├── layout/ # CustomerLayout, CustomerSidebar, CustomerTopbar
│ │ │ ├── ui/ # Card, StatusBadge, TableScroll
│ │ │ ├── auth/ # LoginHero, LoginForm, SignupForm, ProtectedRoute
│ │ │ ├── dashboard/ # Customer dashboard components
│ │ │ ├── messaging/ # MessagingTabs, MessagingStatCard, etc.
│ │ │ ├── send-sms/ # ComposeForm, MessageSummary
│ │ │ ├── contacts/ # ContactsStats, ContactsTable, GroupCard
│ │ │ ├── sender-ids/ # SenderIdStatusBadge, RequestForm, etc.
│ │ │ ├── wallet/ # BalanceCard, SpendingOverviewCard, etc.
│ │ │ ├── add-funds/ # AmountSelector, PaymentMethodSelector, etc.
│ │ │ ├── transactions/ # TransactionMetricCard, TransactionsTable
│ │ │ ├── api/ # ApiStatusCard, ApiKeyCard, UsageMetrics
│ │ │ ├── notifications/ # NotificationFilters, NotificationItem
│ │ │ ├── services/ # FeaturedServiceBanner, ServiceCard
│ │ │ └── settings/ # SettingsNav, SettingsCards, Org* cards
│ │ ├── features/ # Page-level components
│ │ │ ├── auth/ # LoginPage, SignupPage
│ │ │ ├── dashboard/
│ │ │ ├── messaging/ # MessagingOverviewPage, CampaignsPage, MessageHistoryPage
│ │ │ ├── send-sms/
│ │ │ ├── contacts/ # ContactsPage, ContactGroupsPage
│ │ │ ├── sender-ids/ # SenderIdsPage, RequestSenderIdPage
│ │ │ ├── wallet/ # WalletPage, AddFundsPage
│ │ │ ├── transactions/
│ │ │ ├── api/
│ │ │ ├── notifications/
│ │ │ ├── services/
│ │ │ ├── settings/ # SettingsPage, OrganisationProfilePage
│ │ │ └── ComingSoonPage.tsx # Data / Airtime
│ │ ├── lib/
│ │ │ ├── utils.ts
│ │ │ ├── nav.ts
│ │ │ ├── auth.tsx # Customer auth (Firebase) — signup/login/reset
│ │ │ ├── api.ts # fetch wrapper, ApiError, idempotency keys
│ │ │ ├── useApi.ts # useApi / useCursorList data hooks
│ │ │ ├── account.tsx # Shared wallet + unread-notification context
│ │ │ ├── types.ts # /customer/* response types
│ │ │ ├── format.ts, statusLabels.ts, phone.ts, csv.ts, recipients.ts
│ │ │ └── theme.tsx # Dark/light mode provider
│ │ │ (mock/ removed — every screen reads /customer/*)
│ │ ├── App.tsx
│ │ ├── main.tsx
│ │ └── index.css
│ └── package.json
│
├── apps/api/ # Cloudflare Worker (backend, built)
│ ├── src/
│ │ ├── routers/
│ │ │ ├── public/ # /v1/* — API-key auth
│ │ │ ├── admin/ # /admin/* — Firebase Auth + roles
│ │ │ └── webhooks/ # /webhooks/* — signature verification
│ │ ├── middleware/
│ │ ├── services/ # Domain logic: wallet, sms, payment, etc.
│ │ ├── providers/ # Arkesel, Paystack adapters
│ │ ├── repositories/ # Firestore access
│ │ └── lib/
│ └── wrangler.toml
│
├── packages/
│ └── shared/ # Types + Zod schemas (shared web/api)
│
├── firebase/
│ ├── firestore.rules
│ └── firestore.indexes.json
│
├── docs/
│ ├── state.md # This file
│ └── customer-platform.md # Product brief for customer platform
│
├── .gitignore
├── package.json # Root workspace config
└── package-lock.json

text

**Root `package.json`** uses npm workspaces:
```json
{ "workspaces": ["apps/*", "packages/*"] }
Root scripts:

npm run dev:web — starts admin dashboard on :5173

npm run dev:customer — starts customer platform on :5174

4. Tech stack
Frontend (both apps)
React 19.2

TypeScript 6.0

Vite 8

Tailwind CSS 3.4 (v3, NOT v4)

Lucide React 1.47 — icons

Recharts 3.10 — charts (admin + customer)

React Router 7 — routing

TanStack Query — server state (customer app only, once wired)

Backend (built)
Cloudflare Workers

Hono

TypeScript

Firebase Admin SDK

Data
Firestore — primary database

Firebase Auth — admin + (future) customer auth

Integrations
Arkesel — SMS provider (admin-side)

Paystack — payment gateway

Hosting
Cloudflare (Workers + Pages for static assets)

5. Design system
Admin tokens
Sidebar: #0c1e38 (bg), #1976d2 (active)

Body: #f1f5f9

Content text: text-slate-800, base font 13px

Card: bg-white rounded-xl border border-slate-200/80 shadow-xs

Primary action: #1976d2

Font: Inter

Customer tokens
Sidebar: #0c192c (bg), #1a6cf0 (active)

Body: #f5f7fb

Content text: text-slate-800, base font default (16px) — no text-[13px]

Card: bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs

Primary action: #1a6cf0

Font: Inter

Dark mode: class-based (darkMode: 'class' in tailwind config), toggled from topbar, persisted in localStorage

Shared conventions
Rounded corners: rounded-xl for cards, rounded-lg for buttons/inputs

Shadows: shadow-xs (custom token)

Status colors (both apps): Success = emerald, Danger = rose, Warning = amber, Info = blue, Refunded = purple

Layout rules
Desktop (≥ lg / 1024px): fixed sidebar, content scrolls independently

Mobile (< lg): sidebar becomes drawer with backdrop, hamburger in topbar

Page padding: p-4 sm:p-6 lg:p-7 (admin), p-4 sm:p-6 lg:p-8 (customer)

Wide tables: wrapped in <TableScroll> — horizontal scroll + right-edge fade hint (dark mode aware)

Two-column page grids default to lg: breakpoint.

6. What's built
Admin frontend (apps/web, routes in App.tsx)
Route	Page
/login	Admin login
/dashboard	Dashboard — 8 KPI cards, 2 charts, tables
/projects	Projects / Clients list
/projects/:id	Project Details (header, 7 KPIs, usage, API, wallet)
/sms-logs	SMS Logs — 5 KPIs, filter bar, 11-col table
/wallets	Wallets & Units — 4 KPIs, wallets table, donut
/payments	Payments — 7 narrow KPIs, 12-col table
/arkesel	Arkesel Account — provider grid, Sender IDs, API monitoring
/reports	Reports — KPIs, 5 charts, 2 tables
/settings	Settings — 7 tabs, forms
/send-sms	Send SMS — 3-step wizard, compose + summary
Customer frontend (apps/customer, routes in App.tsx)
Route	Page	Status
/login	Customer login (split hero + form)	✅
/signup	Self-service signup	✅
/dashboard	Dashboard — balance, quick actions, KPIs, charts, recent	✅
/messaging	Messaging hub — Overview tab	✅
/messaging/sms	Send SMS — compose + summary	✅
/messaging/sender-ids	Sender IDs list	✅
/messaging/sender-ids/request	Request Sender ID form	✅
/messaging/campaigns	Campaigns — one-time, recurring, birthday + templates (§16)	✅
/messaging/history	Message History — filters, load more	✅
/messaging/history/:batchId	Message detail — per-recipient status, CSV export	✅
/contacts	Contacts list	✅
/contacts/groups	Contact Groups grid	✅
/services	Services hub (featured hero + catalog)	✅
/services/data	Data — coming soon	✅ (honest stub)
/services/airtime	Airtime — coming soon	✅ (honest stub)
/wallet	Wallet — balance, spending chart, activity table	✅
/wallet/add-funds	Add Funds — live packages + custom amount, MoMo/card	✅
/wallet/add-funds/complete	Payment return page — verifies + polls	✅
/forgot-password	Password reset email	✅
/transactions	Transactions — metrics, filter bar, table	✅
/api	API & Integrations — status, key, usage, integrations	✅
/notifications	Notifications — filters, list, summary	✅
/settings	Settings — one tab at a time (?tab=profile|organisation|security|notifications|billing|api)	✅
/settings/organisation	Redirects to /settings?tab=organisation	✅
/developers	Public API documentation	✅
Bulk SMS: intentionally dropped. Send SMS already handles bulk via its
Bulk Upload / Import from File recipient tabs. Personalisation, scheduling and CSV column
mapping shipped in phase 3 (§16).

Backend (apps/api)
Public Project API (/v1/*, API-key auth):

GET /v1/pricing — public, no auth

GET /v1/me, GET /v1/wallet, GET /v1/wallet/transactions

GET /v1/sms/batches, GET /v1/sms/batches/:id

POST /v1/sms/send

GET /v1/sender-ids

Admin API (/admin/*, Firebase Auth + roles):

Projects, wallets, ledger, api keys, sender IDs, payments, refunds

Packages, reports, audit logs, Arkesel monitoring

Admin CRUD for everything the admin dashboard manages

Webhooks (/webhooks/*, signature verification):

POST /webhooks/paystack — working

POST /webhooks/arkesel — not firing in production

Shared packages
packages/shared — Zod schemas + inferred types consumed by both apps

7. Architectural decisions
These were agreed during Stage 2 & Stage 3 planning. The backend follows
them. Do not improvise.

Wallet model — Reserve / Confirm / Release
Units are never deducted directly. Flow:

text
AVAILABLE → RESERVED → SEND TO PROVIDER → CONFIRM (success) OR RELEASE (failure)
Wallet doc has availableUnits and reservedUnits. Every change goes
through a walletTransactions entry.

Ledger semantics
Every entry has availableDelta and reservedDelta:

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
deterministic (reserve__{batchId}, confirm__{batchId}__{recordId}).

No provider call inside a Firestore transaction
External API calls (Arkesel, Paystack) never occur inside a Firestore
transaction. Transaction retries would cause duplicate external operations.

Correct flow:

Firestore transaction: claim idempotency + reserve units + create batch

Commit

Provider call (outside any transaction)

Firestore transaction: confirm or release + update records

Idempotency — atomic claim
Dedicated collection with states processing, completed, failed. Claim
happens inside a Firestore transaction so two concurrent requests can't
both see a missing key.

Doc ID pattern: {scope}__{projectId}__{key} (deterministic).

Per-recipient accounting
A batch request creates one smsBatch and N smsRecords. Each record owns
its own unitsReserved, unitsCharged, unitsReleased. Partial batch
outcomes resolve per-record — never charge or release the whole batch.

SMS statuses
queued, submitting, submitted, delivered, failed, unknown, released

submitted means the provider accepted the request. It does NOT mean the
recipient received the message. Delivery confirmation is future work.

Treat provider timeouts as unknown — do not release units immediately.
Reconciliation handles these.

Idempotency for public API
POST /v1/sms/send requires an idempotency key

Webhooks use the gateway's event ID

Same key + different body → 409

Refunds vs Reversals
Three distinct concepts:

Payment — the customer paid

Gateway Refund — money returned via Paystack

Wallet Reversal — compensating ledger entry (may partially recover units;
shortfall recorded in unitsUnrecovered)

Marking a payment refunded does NOT auto-reverse the wallet credit.

Three API surfaces
Public Project API (/v1/*) — API-key auth

Admin API (/admin/*) — Firebase Auth + role check

Webhook API (/webhooks/*) — signature verification

Customer platform API (/customer/*) — Firebase ID token auth with the
`customer: true` claim + an active customers/{uid} doc (customerAuth
middleware). Built — see §14.

API keys
Cryptographically random

Prefix for fast lookup (not secret)

HMAC-SHA256 or Argon2id hash (never plaintext)

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

Customer-facing rules (from customer-platform.md)
No provider names in customer UI. Never "Arkesel" or "Paystack" in
customer-facing copy, URLs, or API responses.

Units are the currency. Customers buy units, spend units. They never
see the provider's SMS credits or per-credit cost.

Two-layer Sender ID approval. Customer requests → ProfJero approves →
provider registered. Manual registration means honest expectation-setting
("reviewed within X hours"), never instant approval.

Mobile-first. Customer platform is used on phones far more than the
admin dashboard.

8. Data model
Full field-level spec was designed during Stage 3 (admin) and CP1-CP8
(customer). Summary of collections:

Collection	Purpose
admins	Admin users. Roles: super_admin, admin, finance, support, viewer
projects	External clients (API integrators)
apiKeys	Per-project credentials. keyHash, keyPrefix, status
wallets	One doc per project. availableUnits, reservedUnits, thresholds
walletTransactions	Append-only ledger. Authority for wallet state
smsBatches	One per send request
smsRecords	One per recipient. Owns its own reservation/charge/release
senderIds	Global Sender ID registry
senderIdAssignments	M:N link — which project may use which Sender ID
payments	Paystack payments. Links to wallet credit
refunds	Gateway refunds + wallet reversal outcome
packages	Purchasable unit bundles
providerAccounts	Arkesel account metadata (secrets in Worker env)
providerRequests	Rolling operational log of provider calls
idempotencyKeys	Atomic claim with TTL
auditLogs	Every sensitive admin/system action
notifications	Low balance, payment, failed SMS, provider errors
settings	Fixed ID docs: platform, sms, payments, notifications, security
Customer platform additions (planned):

Collection	Purpose
customers	Customer accounts (keyed by Firebase Auth UID). Owns one project.
notifications	Customer in-app notifications, keyed by projectId (§14)
contacts	Customer address book: {projectId}__{phone} doc IDs
contactGroups	Customer contact groups; membership is contacts.groupIds
tenants	Future multi-tenant org (not v1)
Field specs available in the chat history. Reconstruct before coding —
do not improvise.

9. What's mocked
Customer app: nothing. apps/customer/src/mock/ has been deleted; every
screen reads /customer/* (or the public /v1/pricing) with loading, empty
and error states. Static marketing copy for the Services page lives in
apps/customer/src/lib/servicesContent.ts and is clearly not account data.

Admin app: see the admin notes (mostly real API calls).

10. What's next
Frontend — done
✅ Admin: 10 screens

✅ Customer: 13 screens + auth

✅ Bulk SMS: intentionally dropped (see §10.5)

✅ State document (this file)

Customer platform — done (CP1–CP7, see §14)
✅ /customer/* API, auth, payments, SMS, history, Sender IDs, contacts,
   API keys, notifications (in-app + email)

Customer platform — still to do
- Deploy: API (wrangler deploy) + customer app (Pages). Checklist in §14.
- Admin UI: show a Sender ID request's purpose/description (now stored on
  the assignment) in the admin approval queue.
- ~~Campaigns / scheduled sends~~ — done (§16).
- Data and Airtime (coming-soon pages are live).
- Large sends: services/sms.ts writes records one by one; sends of many
  hundreds of recipients can hit Worker subrequest limits. Batch the
  record writes (firestoreBatchWrite) before marketing bulk sends.
- Team seats (one owner login per organisation today).

Admin backend — maintenance
Arkesel delivery receipts — see §10.5

Audit log viewer (currently empty UI)

10.5 Known issues / cleanup
Intentional decisions
Send SMS breakpoint at sm: (640px) on admin — earlier than other
screens. Do not "fix" without testing; the form/summary look good side
by side from 640px+.

Customer platform base font is default (16px), not 13px like admin.
This was a deliberate decision — customer UI needs more breathing room.

Bulk SMS dropped. Send SMS already handles bulk via recipient tabs.
Personalisation, scheduling and CSV mapping: done (§16).

Mock unit calculation on Send SMS — HTML showed "97 chars, 2 units"
but real GSM-7 calc is 1 unit. Mock preserves HTML values for parity; real
calc lives in the backend.

ProjectDetailsPage (admin) ignores URL :id — always shows GABS.
Replace with real fetch when backend exists.

Open backend issues
Arkesel delivery receipts not firing. /webhooks/arkesel receives
nothing. Need to confirm Arkesel's mechanism (webhook vs polling). Until
resolved, SMS records show submitted, not delivered.

ComingSoon.tsx (admin) — unused. Can be deleted.

Defensive redirects
/messaging/bulk-sms → /messaging/sms (customer)

11. Conventions
Code
TypeScript strict mode

Functional components with hooks

Feature-based folder structure

import type for type-only imports

Named exports for components and pages; App.tsx uses default export

Prefer small, focused components over large pages

Business logic in lib/ or feature hooks, not in components

Styling
Tailwind classes inline

Never arbitrary hex values where a Tailwind token exists — but brand colors
(#1976d2, #1a6cf0, #0c1e38, #0c192c) are used literally

Rounded: rounded-xl cards, rounded-lg buttons/inputs

Shadows: shadow-xs

Data
Typed props; interfaces in the same file or in mock/*.ts

No any

Never hardcode data inside components — put it in mock/ files

Git
Commit after each screen or significant refactor

Style: feat:, refactor:, fix:, chore:, docs:

Icons
Lucide React only — both apps

If an icon is missing, swap to closest equivalent — no new libraries

12. How to run
From repo root:

cmd
npm run dev:web        # Admin dashboard → http://localhost:5173
npm run dev:customer   # Customer platform → http://localhost:5174
Or cd into an app and run npm run dev:

cmd
cd apps\web && npm run dev
cd apps\customer && npm run dev
Backend (from apps/api):

cmd
npx wrangler dev              # local dev server
npx wrangler deploy           # deploy
npx wrangler deployments list --env production   # check status
Build:

cmd
npm run build --workspace=apps/web
npm run build --workspace=apps/customer
Environment variables: see apps/api/.dev.vars.example for the backend.
Customer app env vars: apps/customer/.env.example (VITE_API_URL, Firebase
web config, optional VITE_SUPPORT_EMAIL).

Customer-platform e2e test (no credentials needed):
  npm run test:customer --workspace=@profjero/api

Previously: frontend apps didn't need env vars — customer Firebase config would be
added during CP1.

13. Notes for the next assistant / developer
User prefers step-by-step batches. When delivering code, split into
"Batch A" (routing/small files) and "Batch B" (larger content) so they can
verify between steps.

User is on Windows Command Prompt. Use del, mkdir, dir /s /b,
not bash.

User uses VS Code. Occasionally files land in the wrong folder if the
explorer selection is off — if an import fails, run
dir /s /b src\*{filename}* to find duplicates.

User is learning. Explain why a decision is made, not just what.

Do not silently mock things. If something is faked, label it clearly.

Do not use placeholder functionality and pretend it's production-ready.

Test responsive in DevTools (Ctrl+Shift+M) with specific viewport
widths. Windows display scaling can make wide monitors report narrow
viewports, triggering mobile breakpoints unexpectedly.

Two design languages. Admin uses #1976d2 / #0c1e38 / 13px. Customer
uses #1a6cf0 / #0c192c / 16px + dark mode. Do not mix them.



---

## 14. Customer platform — implementation notes (CP1–CP7)

Built 2026-10-02. Product decisions taken with the operator for this
milestone: contacts & groups are in v1; Add Funds offers packages **and**
a custom amount (billed at pricingSettings/sms.unitPriceGhs within
min/max); customers create their own **secret** API keys (max 5 active);
notifications are in-app **plus** email via Resend.

### /customer/* endpoints (Firebase ID token + customer claim)

| Method | Path | Notes |
|---|---|---|
| POST | /customer/register | CP1. Creates project + wallet + 3 starter units + customer doc |
| GET/PUT | /customer/me | Profile (now includes phone, createdAt, emailNotifications) |
| PUT | /customer/me/preferences | `{ emailNotifications }` |
| GET | /customer/wallet | Balance |
| PUT | /customer/wallet/threshold | `{ threshold: number \| null }` — low-balance alert level |
| GET | /customer/wallet/transactions | `view=summary` hides per-recipient confirms; `types=a,b` filter |
| POST | /customer/payments | **Idempotency-Key**. `{ packageId }` or `{ units }`, optional `method: mobile_money\|card`. Returns `checkoutUrl` |
| GET | /customer/payments | List + `summary` totals |
| GET | /customer/payments/:ref | One payment |
| POST | /customer/payments/:ref/verify | Return-page check. Never marks an unfinished checkout failed |
| POST | /customer/sms/send | **Idempotency-Key**. `{ senderId, message, recipients?, contactIds?, groupIds? }` (≤1000 unique) |
| GET | /customer/sms/batches | History; `status`, `senderId`, `source=api\|dashboard`, `q`, cursor |
| GET | /customer/sms/batches/:id | Batch + per-recipient records |
| GET | /customer/sms/stats?days=N | Totals, previous period, per-source, per-day series |
| GET/POST | /customer/sender-ids | List / request `{ value, purpose, description }` |
| GET/POST | /customer/contacts | List (q, groupId, offset) / create |
| POST | /customer/contacts/import | Bulk upsert ≤2000, optional groupId; reports skipped rows |
| POST | /customer/contacts/delete | Bulk delete `{ ids }` |
| PUT/DELETE | /customer/contacts/:id | Edit (phone change moves the doc) / delete |
| GET/POST/PUT/DELETE | /customer/contact-groups[/:id] | Groups; delete keeps contacts |
| POST | /customer/contact-groups/:id/members[/remove] | `{ contactIds }` |
| GET/POST | /customer/api-keys | List / create (plaintext returned once) |
| POST | /customer/api-keys/:id/revoke | Immediate |
| GET | /customer/notifications | `type`, `unread=true`, cursor; returns unreadCount + counts |
| POST | /customer/notifications/:id/read, /read-all | |

customerAuth runs **once** for the whole surface (routers/customer/index.ts);
sub-routers must not add their own `use('*')` (Hono merges it into the
parent, which re-verified the token per sub-router).

### Decisions worth knowing

- **Idempotency is project-scoped.** Payment references and SMS batch IDs
  are `sha256(projectId:key)` prefixes (`pjc_…`, `cs_…`), so two customers
  can never collide on a client key.
- **Provider names are scrubbed** from every customer response
  (lib/scrub.ts): ledger descriptions, payment failure reasons, SMS errors.
- **Never-sent batches are hidden.** A send refused for balance leaves a
  `queued` batch (by design, for retry); customer history/stats skip them.
- **Ledger display.** A send shows as its `reserve` (−N available) and any
  `release` (+N); `confirm` rows are hidden (view=summary). Amounts are
  availableDelta, so the running balance matches what the customer sees.
- **Notifications are best-effort and deduplicated** by deterministic IDs
  (`payment__{ref}`, `sender_id__{project}__{value}__{status}__{decidedAt}`,
  `low_balance__{batchId}`, `sms__{batchId}`). Webhook replays never
  duplicate a receipt or an email. Low-balance fires only on the crossing.
- **Sender ID decisions notify** from services/senderIds.ts, so approving
  in the admin dashboard is all the operator needs to do.
- **Project docs from customer signup now match ProjectSchema** (contact +
  audit fields). parseProject also defaults those fields for older CP1
  docs — previously such projects were skipped by listProjects, hiding
  them from the admin dashboard and dropping their Sender ID requests from
  the approval queue.
- **"Remember me"** now chooses local vs session Firebase persistence.

### Environment (apps/api) — new, all optional

| Var | Purpose |
|---|---|
| RESEND_API_KEY | Enables notification email. Unset → in-app only |
| EMAIL_FROM | e.g. `ProfJero Connect <hello@yourdomain>` (domain verified in Resend) |
| CUSTOMER_APP_URL | e.g. `https://profjeroconnect-customer.pages.dev` — email links + payment return when Origin is unknown |

See apps/api/.dev.vars.example.

### Deploy checklist

1. `npm run typecheck` and `npm run test:customer --workspace=@profjero/api`.
2. Set secrets: `npx wrangler secret put RESEND_API_KEY --env production`
   (and EMAIL_FROM, CUSTOMER_APP_URL as vars or secrets).
3. Confirm the customer app's production origin in `apps/api/src/lib/origins.ts`
   (both lists), then `npm run deploy:prod --workspace=@profjero/api`.
4. Make sure pricingSettings/sms has `unitPriceGhs` + `minPurchaseUnits`
   if you want the custom-amount option (otherwise it's hidden).
5. Build + deploy the customer app with `VITE_API_URL` pointing at
   production; optionally `VITE_SUPPORT_EMAIL`.
6. Smoke test: sign up → buy the Starter package (test key) → request a
   Sender ID → approve it in admin → send to your own number.

### Testing

`apps/api/test/customer.e2e.ts` runs the real Worker against an in-memory
fake of Firestore/Google/payment gateway/Resend (test/fakeCloud.ts) and
walks the whole journey: signup, top-up + webhook replay, Sender ID
request/approval, contacts/import, send with failures, replay, history,
stats, low-balance alert, API keys on /v1, notifications, and cross-tenant
isolation. Needs `openssl` on PATH (Git for Windows ships one).

---

## 15. Admin platform — settings, team, audit, alerts, security (phase 2)

Everything on the admin dashboard is now real: the old Settings mock-up,
the topbar's fake date range and badge, and all `src/mock/*` data are gone.

### What the operator can do

| Where | What |
|---|---|
| Settings → General | Platform name, support email/phone (shown to customers), address, time zone |
| Settings → SMS | Welcome credit for new signups (default 3 units, 0 = off), default low-balance alert, max recipients per send, Sender ID review time shown to customers |
| Settings → Payments | Pause customer top-ups with a message (webhooks for payments already in flight still credit) |
| Settings → Notifications | Admin alert emails (≤10) for: new Sender ID request, new customer, payment received, provider balance low (+ level) |
| Settings → Security | Close/open customer sign-ups; customer sends/min and API calls/min |
| Settings → Team | Invite admins (creates the Firebase login, returns a password-setup link and emails it if Resend is set), change roles, disable/re-enable (also disables the Firebase login), reset links |
| Settings → Audit Log | Every successful admin change, who/when/what, secrets redacted (super admin + admin) |
| Settings → System | Config health (SMS mode, webhook + token, payments, email), cron heartbeats, stuck/held queues, DB latency; run reconciliation / clean up orphans (super admin) |
| Settings → My Profile | Display name, password change |
| Topbar bell | Live alerts: Sender ID requests, low-balance wallets, provider errors/low credits, failed payments, stuck messages, new customers, stale cron (prod). Unread per admin; opening marks read |
| Sidebar SMS balance | Live provider credits + status (refreshed every 15 min by cron), links to the provider page |
| Sidebar quick actions | Send SMS, Add Project, Create Payment Link — open the real dialogs |

Who may edit which settings section: general/SMS/notifications = super
admin + admin; payments = + finance; security = super admin only. Team
changes are super admin only; nobody can change their own role/status and
at least one active super admin must remain.

Settings live in Firestore `settings/{general|sms|payments|notifications|security}`,
merged over defaults (`packages/shared/src/schemas/settings.ts`) and cached
30 s per Worker isolate.

### New API endpoints (all under `/admin`, audit-logged when they change something)

`GET /settings`, `PUT /settings/:section`, `PATCH /me`, `GET|POST /admins`,
`PATCH /admins/:uid`, `POST /admins/:uid/reset-link`, `GET /audit-logs`,
`GET /alerts`, `POST /alerts/seen`, `GET /system`. Public: `GET /health/ready`
(DB check, 503 when down), `GET /v1/platform`. Customer: `GET /customer/config`.

### Security changes (found by the test matrix — details in docs/testing.md)

- Paystack webhook checks amount + currency before crediting.
- Delivery webhook token: set `ARKESEL_WEBHOOK_SECRET`; the callback URL
  gets `?token=…` and callbacks without it are rejected (401).
- Suspended/archived projects can't send from any surface.
- Idempotency-Key misuse is 409 everywhere; a key reused by another
  project no longer exposes that project's batch.
- Provider 5xx → units held as "unknown" (reconciliation decides).
- API-key cap enforced atomically; document IDs validated before Firestore.
- Rate limits (Firestore-backed `rateLimits/*` + per-isolate): customer
  API calls/min and sends/min (configurable), 10 sign-ups/hour per IP,
  10 checkouts/min, 10 API keys/hour, 10 Sender ID requests/day; 429 +
  `Retry-After`.
- Localhost CORS origins refused when `ENVIRONMENT=production`.
- Admins can't sign up as customers; customers can't be invited as admins.
- `firebase/firestore.rules` is deny-all (both apps go through the API).

### Environment (apps/api) — new

| Var | Purpose |
|---|---|
| ARKESEL_WEBHOOK_SECRET | Recommended in production: shared token for delivery callbacks |

### Deploy checklist (phase 2)

1. Deploy the API (`npm run deploy:prod --workspace=@profjero/api`). The
   `*/15` cron now also refreshes the provider balance and writes
   heartbeats to `systemStatus/cron`.
2. Set `ARKESEL_WEBHOOK_SECRET` (`npx wrangler secret put ARKESEL_WEBHOOK_SECRET --env production`).
   The callback URL sent to Arkesel picks it up automatically.
3. Deploy the Firestore rules: `cd firebase` then
   `npx firebase deploy --only firestore:rules --project profjero-sms-gateway`.
   Check first that nothing else reads Firestore directly from a browser.
4. Deploy both front ends. Open Settings once and fill in General
   (support email) and Notifications (alert emails).
5. Point an uptime monitor at `GET /health/ready`.
6. Existing admins keep working. New admins are invited from Settings → Team.

### Testing

See **docs/testing.md** for how to run everything and the full results:
API customer journey (27), security & reliability (61), features (32), data
bundles (15), load test, Firestore rules (6), and Playwright browser tests
(28: UI, accessibility, mobile).

---

## 16. Phase 3 — fast sending, personalisation, campaigns, monitoring, branding

### Fast bulk sending

`POST /customer/sms/send` and `/v1/sms/send` now return as soon as the
batch and its records exist and the units are reserved (one transaction
that also sets the batch to `submitting` with a 90-second lease). Delivery
runs after the response (`ctx.waitUntil`) in chunks of 200: mark the chunk
in flight → one provider call per distinct text → settle the chunk (records
+ confirm/release ledger entries) in one transaction. The request itself
costs ≤ 20 database round-trips at any size.

If a worker dies mid-send, the **per-minute cron** (`* * * * *`,
`runDispatcher`) picks up batches whose lease expired. Records that were
in flight become "unknown" with units held (never sent twice); queued ones
continue. The Send page shows live progress; nothing waits on the page.

### Personalised SMS

Templates use `{field}` and `{field|fallback}`
(`packages/shared/src/lib/template.ts`, used by API and both apps). Built-in
fields: first_name, last_name, name, phone, email, date_of_birth; any
contact custom field works too. Each recipient is billed by their own
text. A field that is empty for some recipients and has no fallback is
refused before anything is charged. `POST /customer/sms/preview` returns
units and rendered samples (the Send page shows them live).

Contacts gained first name, last name, date of birth and custom fields.
CSV import lets the user map each column (phone, names, email, date of
birth, custom field, skip), with headers guessed automatically; up to 5,000
rows; optional "update existing contacts".

### Campaigns (`services/campaigns.ts`)

One-time, recurring (daily / weekly / monthly) and birthday campaigns,
time-zone aware. Every minute the dispatcher claims due campaigns in a
transaction (so each run happens once), resolves the audience (numbers,
contacts, groups), sends a batch and computes the next run. Failures (e.g.
not enough units) are recorded on the campaign and notified. Saved message
templates live in `messageTemplates`. API scheduled sends (`scheduleAt`)
are one-time campaigns.

### Monitoring (admin → Monitoring, super admin + admin)

- `lib/monitor.ts` counts every request (by route group, status class,
  latency bucket), provider calls, SMS outcomes and security events in
  memory and flushes them as Firestore increments into
  `metricsMinute/{yyyyMMddHHmm}` and `metricsHour/{yyyyMMddHH}`.
- Sampled detail (5xx errors with request ID, security events with IP,
  browser crash reports from both apps via `POST /monitor/client-error`)
  goes to `monitorEvents`.
- The page polls every 10 s: health of every component, traffic, error
  rate, p95 latency, blocked requests, busiest/slowest routes, top IPs,
  latency histogram, recent errors and security events.
- Incidents (error spike, abuse spike, many client errors) raise a bell
  alert and email the alert list at most hourly (Settings → Notifications
  → Incidents). A dispatcher that stops running raises a stale-job alert.

### Branding, SEO and share previews

- Logos come from `branding/source/` (`icon.png`, `logo-text.png`);
  favicons, app icons, `logo-tile.webp` and the 1200×630 `og-image.jpg` are
  generated into each app's `public/`. To use a different logo, replace
  the two source files and regenerate the public assets.
- Customer app: title/description, canonical URL, Open Graph + Twitter
  card, JSON-LD, `robots.txt`, `sitemap.xml`, web manifest, per-page
  titles. Admin app: `noindex` and `Disallow: /`.
- Share tags need absolute URLs: set **`VITE_SITE_URL`** (e.g.
  `https://connect.profjero.com`) when building; the default is
  `https://profjeroconnect.pages.dev`.

### Public API docs

`/developers` in the customer app (public, no login) documents every
`/v1` endpoint with cURL, JavaScript, PHP and Python examples. Linked from
sign-in, sign-up, API & Integrations, the API settings tab and the sidebar.

### Deploy checklist (phase 3)

1. Deploy the API — `wrangler.toml` adds the `* * * * *` cron trigger
   (sending recovery + campaigns). Check it shows under the Worker's
   Triggers in the Cloudflare dashboard.
2. Firestore TTL policies on field `expiresAt` for collection groups
   `metricsMinute`, `metricsHour` and `monitorEvents` (Firestore →
   Time-to-live), so monitoring data cleans itself up.
3. Build the customer app with `VITE_SITE_URL` set to its real domain;
   check a link at https://www.opengraph.xyz/ after deploy.
4. If not done in phase 2: `ARKESEL_WEBHOOK_SECRET`.
5. Open admin → Monitoring and confirm the dispatcher shows as healthy
   within two minutes.

---

## 17. Data bundles (DB3) and the services-first customer app

### How a data purchase works

1. Customer picks a number and a bundle on **/services/data** and pays at
   checkout (mobile money or card). Nothing comes out of the SMS wallet:
   the customer pays exactly the bundle price.
2. `POST /customer/data/orders` (Idempotency-Key) creates `dataOrders/pjd_…`
   and the checkout. The order ID is also the payment reference and the
   provider's `clientReference`, so a retry never charges or buys twice.
3. The payment webhook (references starting `pjd_`) or the return page
   (`POST /customer/data/orders/:id/refresh`) confirms the **exact amount**,
   then submits to the data provider once (claimed in a transaction).
4. Outcomes:
   - delivered → in-app notification;
   - provider refuses (4xx) → **automatic full refund** through the
     payment gateway, customer notified;
   - provider answer lost (timeout/5xx) or wrong amount paid → order
     flagged `needsReview` (bell alert); never refunded or re-bought
     blindly. An operator checks the provider dashboard, then uses
     **Resend**, **Delivered** or **Refund** on admin → Data Orders.
5. Orders still "sending" are re-checked every 15 minutes
   (`runDataOrderReconciliation`, shown on admin → Settings → System).

Network detection (`packages/shared/src/lib/networks.ts`) maps Ghana
prefixes to MTN / Telecel / AirtelTigo. Numbers can be ported, so a
mismatch is a warning the buyer must confirm, not a block.

Bundles must be synced and switched **on** in admin → Data Bundles before
customers see them; with none on sale the shop shows "being stocked".
Checkout follows the same pause switch as SMS top-ups
(Settings → Payments).

### Customer app structure

`apps/customer/src/lib/services.ts` is the service catalogue. The sidebar
(Services / Workspace groups), the topbar **Buy** menu, the dashboard
"What would you like to do today?" launcher and the Services page are all
generated from it. To add a service: add an entry (`status: 'soon'` until
it can be bought, then `'live'`) and its pages; nothing else needs to
change. Billing (SMS wallet, Buy SMS units, Purchase history with SMS and
Data tabs) and Developers (API keys, API docs) are grouped under Workspace.

### Deploy checklist (data bundles)

1. Deploy the API (the 15-minute cron now also checks data orders).
2. Secrets: `ELITEDATA_API_KEY` (and `ELITEDATA_BASE_URL` only if told
   to use another host).
3. Firestore indexes — `cd firebase` then
   `npx firebase deploy --only firestore:indexes --project profjero-sms-gateway`
   (definitions in `firebase/firestore.indexes.json`; includes the
   dataOrders indexes for customer lists, the admin filters and the
   reconciliation job).
4. In the payment gateway dashboard, make sure refunds are enabled for
   the account (automatic refunds use its refund API).
5. Admin → Data Bundles → Sync, set prices, switch bundles on.
6. Make a small real purchase to your own number and watch it go
   Payment → Sending → Delivered.

---

## 18. Phase 5 — automatic Sender IDs, verified sign-ups, account overview

### Sender IDs

- `packages/shared/src/lib/senderIdCheck.ts` screens a requested name in
  microseconds, with no database or network calls. The same code runs in the request
  form (live feedback) and on the server (decision):
  - **refused** (400, nothing stored): bad format, government / regulator
    / security-service / utility names, protected brands (networks, banks,
    payments, big platforms, SMS providers), generic spoof words (INFO,
    ALERT, BANK, OTP…), scam bait (WINNER, LOTTERY…), profanity, our own
    brand, description under 50 characters;
  - **held for review**: close look-alikes (G00GLE, PAYSTAK), names
    starting with a short protected brand (MTN…, MOMO…), a brand
    requested by an organisation whose name contains it, thin
    descriptions, or a name another project already uses;
  - **approved instantly** otherwise (approver `system:auto-check`).
- Admin → Settings → SMS → "Approve Sender IDs automatically" turns this
  off (everything then waits for an admin).
- The admin queue now shows the customer's purpose, description and why
  the request was held. Each request appears once (previously twice).
- **Verification by our SMS provider** happens on the first send.
  `providerStatus` on the assignment moves not_sent → pending (first
  message accepted) → verified (first delivery receipt), or rejected (every
  message refused for a sender reason). The customer is notified at each
  step and sees it in the Sender IDs list. An admin can override it from
  the registry ("Mark verified / Mark refused"). The cost is one read per
  finished batch until the Sender ID is verified.

### Sign-up and sign-in (customer app)

- **Sign up:** Google; or name + organisation + email → a **sign-up link**
  (no password); or a password plus a **confirmation email**
  (`/verify-email` waits and continues by itself).
- **Sign in:** Google, password, or an **emailed sign-in link**
  (`/auth/link`; it asks for the email when the link is opened on another
  device, as Firebase recommends).
- The server (`/customer/register`) creates an account, and grants the
  free starter units, only for a **verified** email. It refuses common
  throwaway email domains (`packages/shared/src/lib/emailCheck.ts`).
  Existing customers are unaffected.
- **Firebase console** (Security → Authentication):
  1. Sign-in method: Email/Password **on**, Email link (passwordless)
     **on**, Google **on** (support email set).
  2. Settings → Authorized domains: add the customer app's domain(s), e.g.
     `profjeroconnect.pages.dev` and any custom domain.
  3. Templates → Email address verification / Email link sign-in: set the
     sender name to ProfJero Connect (optional, recommended).

### Dashboard

- `GET /customer/overview?days=7|30|90` returns, in one request, spend per
  service, usage, a per-day series, a mixed activity feed and next steps.
- The dashboard shows next steps, then services, then **Account overview**
  (spent across services, messages, data delivered, SMS balance, a
  spending-by-service chart, recent activity), then the Bulk SMS detail.

### Data pricing

- Costs use the provider's **published API price list**
  (`packages/shared/src/lib/dataPricing.ts`; MTN 1GB = GH₵4.00 … 30GB =
  GH₵120.00), not the price the bundle list reports. The provider's
  guest price is stored too, so admin can see when we're dearer than
  buying direct.
- The default markup is **10%** (MTN 1GB → GH₵4.40, below the GH₵4.70
  guest price). Admin → Pricing → Data Bundles sets one markup for every
  bundle, and that markup is remembered for new bundles.
- Fixed: the 6-hourly sync used to overwrite admin prices and markup with
  25%. It now keeps them unless our cost changes.
- Fixed: floating-point rounding added 10 pesewas (4.00 × 1.10 gave 4.50).
- After deploying, open Data Bundles → **Sync** once. Existing bundles get
  the correct cost but keep their current markup. To re-price everything,
  apply 10% (or your choice) on Pricing → Data Bundles.

### Admin

- Providers shows the data provider (`data_gw_01`, created automatically
  when `ELITEDATA_API_KEY` is set) with its wallet balance. The balance
  refreshes hourly and emails when it drops below GH₵50.

### Updates and caching

- Every build writes `/version.json`. Open tabs check it every 5 minutes,
  on focus and on navigation (a static file, no database reads), and show
  "A new version is ready → Update now" with the newest entry of
  `apps/*/release-notes.json`. **Add a line there for each release.**
- `public/_headers` (Cloudflare Pages): `version.json` is never cached;
  hashed `/assets/*` are cached long-term.
- The customer app shares GET responses for 15 seconds (and de-duplicates
  identical in-flight requests). Any write or sign-in change clears the
  cache. This cuts repeated Firestore reads when moving between pages.

### Deploy checklist (phase 5)

1. Deploy the API.
2. Firebase console steps above (Email link, Google, authorised domains).
3. Deploy both front ends (Pages picks up `_headers` and `version.json`).
4. Admin → Data Bundles → Sync; Pricing → Data Bundles → check markup.
5. Admin → Settings → SMS: confirm "Approve Sender IDs automatically".

