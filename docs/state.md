# ProfJero SMS — Project State

_Last updated: 2026-09-26. This is the single source of truth for anyone
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
- Reports, settings, audit logs

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
- Customer platform: **frontend complete, backend not started**.

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
| **Customer frontend** (React, 13 screens) | ✅ Done, desktop + mobile |
| **Customer backend** (`/customer/*` surface) | ❌ Not started |
| **Customer auth** (self-signup, Firebase) | ❌ Not started |
| **Customer-facing Paystack flow** | ❌ Not started |
| **Notifications system** (in-app + email) | ❌ Not started |
| **Arkesel delivery receipts** | ⚠️ Not firing in production (see §10.5) |

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
│ │ │ └── PlaceholderPage.tsx
│ │ ├── lib/
│ │ │ ├── utils.ts
│ │ │ ├── nav.ts
│ │ │ ├── auth.tsx # Customer auth context (stubbed)
│ │ │ └── theme.tsx # Dark/light mode provider
│ │ ├── mock/
│ │ │ ├── dashboard.ts
│ │ │ ├── messaging.ts
│ │ │ ├── sendSms.ts
│ │ │ ├── contacts.ts
│ │ │ ├── contactGroups.ts
│ │ │ ├── senderIds.ts
│ │ │ ├── requestSenderId.ts
│ │ │ ├── wallet.ts
│ │ │ ├── addFunds.ts
│ │ │ ├── transactions.ts
│ │ │ ├── api.ts
│ │ │ ├── notifications.ts
│ │ │ ├── services.ts
│ │ │ ├── settings.ts
│ │ │ └── organisation.ts
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
/messaging/campaigns	Campaigns — placeholder	✅ (stub)
/messaging/history	Message History — placeholder	✅ (stub)
/contacts	Contacts list	✅
/contacts/groups	Contact Groups grid	✅
/services	Services hub (featured hero + catalog)	✅
/services/data	Data — placeholder	✅ (stub)
/services/airtime	Airtime — placeholder	✅ (stub)
/wallet	Wallet — balance, spending chart, activity table	✅
/wallet/add-funds	Add Funds — amount + method selector	✅
/transactions	Transactions — metrics, filter bar, table	✅
/api	API & Integrations — status, key, usage, integrations	✅
/notifications	Notifications — filters, list, summary	✅
/settings	Settings hub — 6 cards + sub-nav	✅
/settings/organisation	Organisation Profile	✅
Bulk SMS: intentionally dropped. Send SMS already handles bulk via its
Bulk Upload / Import from File recipient tabs. Deeper bulk features
(personalisation, scheduling, CSV mapping) are Campaigns territory — deferred
until Campaigns is scoped. See §10.5.

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

Customer platform will add a fourth surface: /customer/* — Firebase
ID token auth (customer accounts, not admins). Decision documented in
docs/customer-platform.md §14 (CP2 fork). This is not yet built.

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
customers	Customer accounts (keyed by Firebase Auth UID)
tenants	Future multi-tenant org (not v1)
Field specs available in the chat history. Reconstruct before coding —
do not improvise.

9. What's mocked
Everything under apps/customer/src/mock/*.ts is mock data for UI
development. Every file starts with a clear comment:

text
// ⚠️ MOCK DATA — replace with /customer/* API calls once that surface exists.
Files: dashboard, messaging, sendSms, contacts, contactGroups,
senderIds, requestSenderId, wallet, addFunds, transactions, api,
notifications, services, settings, organisation.

Admin mocks were the same, now mostly replaced with real API calls.

Do not present mocked values as real. When the customer backend lands,
each mock file gets replaced with an API call + loading/error states.

10. What's next
Frontend — done
✅ Admin: 10 screens

✅ Customer: 13 screens + auth

✅ Bulk SMS: intentionally dropped (see §10.5)

✅ State document (this file)

Backend — customer platform (start a fresh chat)
Extend API with /customer/* surface — Firebase ID token auth (not
API keys). New routers, middleware, services.

Customer auth — self-signup, email/password, customers collection.
Swap the stubbed useAuth() in apps/customer/src/lib/auth.tsx for real
Firebase Auth. Keep the same interface so page code doesn't change.

Customer wallet — top-up (mobile money / card via Paystack), balance,
ledger. Reuse the existing wallet service with a customer-scoped view.

Customer send SMS — scoped to the customer's own project, using the
existing reserve/confirm/release flow.

Sender ID request flow — customer submits → admin reviews → provider
registration. Notification on approval.

Notifications — in-app collection + email (Resend recommended). Needed
for Sender ID approval, payment receipts, low balance.

Reports/analytics — replace mock aggregates with real queries.

Hardening — rate limits, reconciliation, security review.

Deploy customer app — likely connect.profjero.com or
profjeroconnect.pages.dev for now.

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
Deeper bulk features = Campaigns territory, deferred.

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
Frontend apps don't need env vars yet — customer Firebase config will be
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

