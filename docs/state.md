# ProfJero Connect — Project State

_Last updated: 2026-09-24. Single source of truth for anyone continuing this
project. If picking up from a fresh chat, read this file first._

---

## 1. What this project is

ProfJero Connect is a multi-service communication platform that sits between
many client applications and backend service providers. SMS is the first
service shipped; Airtime, Data Bundles, and others will be added over time
using the same infrastructure.

**Problem it solves:** each client project currently integrates with service
providers directly. ProfJero Connect becomes the single gateway with:

- Per-project API credentials (ProfJero-issued API keys, no client-side
  database config ever stored)
- A per-project wallet with an append-only ledger, denominated in ProfJero
  Units (internal credits, independent of any provider's balance)
- Full audit trails for messages, wallet changes, and payments
- A provider abstraction layer so backend services can change without
  touching client integrations
- Automated payment settlement via Paystack

**Two product surfaces:**

1. **Admin dashboard** (built): the operator's command centre for managing
   client projects, wallets, Sender IDs, pricing, and provider accounts.
2. **Customer platform** (not built): a self-service surface where clients
   sign up, buy units, request Sender IDs, and send messages without operator
   involvement.

**Current status:** Admin dashboard is complete and deployed. Customer
platform is the next major milestone.

---

## 2. Where it's deployed

| Layer | URL | Notes |
|---|---|---|
| Admin dashboard | https://profjeroconnect.pages.dev | Cloudflare Pages |
| API (Worker) | https://profjero-sms-api-prod.amoakob947.workers.dev | Cloudflare Workers |
| API (source) | apps/api | Wrangler-deployed |
| Web (source) | apps/web | Wrangler Pages deployed |
| Database | Firestore | Project: profjero-sms-gateway |
| Auth | Firebase Authentication | Email/password, admin accounts only |

The API worker name is `profjero-sms-api-prod` (a legacy name from before the
rebrand). Renaming means re-uploading all secrets and updating any mobile
clients — defer until there's a reason to.

---

## 3. Repository structure
profjero-sms/ (repo name — legacy, unrenamed)
├── apps/
│ ├── api/ Cloudflare Worker (Hono + TypeScript)
│ │ ├── src/
│ │ │ ├── lib/ firestore, phone, datetime, domainError
│ │ │ ├── middleware/ auth, roles, apiKeyAuth, errors
│ │ │ ├── providers/ arkesel, paystack, mock provider switch
│ │ │ ├── repositories/ Firestore access per collection
│ │ │ ├── routers/ admin, v1, webhooks, health
│ │ │ ├── services/ business logic (sms, wallet, pricing, ...)
│ │ │ ├── types/ Env, AuthVariables
│ │ │ └── index.ts Worker entry (fetch + scheduled)
│ │ ├── wrangler.toml
│ │ └── .dev.vars gitignored
│ │
│ └── web/ React + Vite admin dashboard
│ ├── src/
│ │ ├── components/ shared UI + per-feature components
│ │ ├── features/ page-level components
│ │ ├── lib/ api client, auth, useApi, helpers
│ │ └── App.tsx router
│ ├── index.html
│ └── .env gitignored
│
├── packages/
│ └── shared/ Zod schemas + types shared by api and web
│ └── src/schemas/ admin, apiKey, dashboard, payment,
│ pricing, project, provider, senderId,
│ sms, v1, wallet, health
│
├── docs/
│ └── state.md This file
├── firebase/ (empty — reserved for rules + indexes)
└── package.json npm workspaces root

text

**Root uses npm workspaces:** `["apps/*", "packages/*"]`

---

## 4. Tech stack

**Frontend:**
- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 3.4 (v3, not v4)
- Lucide React (icons)
- Recharts (charts)
- React Router 7

**Backend:**
- Cloudflare Workers
- Hono 4
- TypeScript 6
- Firebase Admin via `jose` + Firestore REST (no firebase-admin SDK — the SDK doesn't work cleanly on Workers)

**Data:**
- Firestore (native mode)
- Firebase Auth (admin accounts only)

**Integrations:**
- Arkesel (SMS provider, v2 API)
- Paystack (payments, test mode currently)

**Hosting:**
- Cloudflare Workers (API)
- Cloudflare Pages (dashboard)

---

## 5. Design system

**Colors:**
- Sidebar background: `#0c1e38`
- Primary action: `#1976d2` (hover: blue-600)
- Active nav: `#1976d2`
- Body background: `#f1f5f9`
- Cards: white with `border-slate-200/80`
- Status colors: emerald (success), rose (danger), amber (warning), blue (info), purple (refunded)

**Typography:**
- Font: Inter (Google Fonts, loaded in index.html)
- Base size: 13px
- Card titles: `text-sm font-bold text-slate-800`
- Section labels: `text-xs text-slate-500`

**Components:**
- Cards: `bg-white rounded-xl border border-slate-200/80 shadow-xs`
- Buttons: `rounded-lg`, small text (`text-xs`)
- Tables: `text-xs`, `divide-y divide-slate-100`
- Modal: bottom sheet on mobile, centered panel on sm+

**Layout:**
- Desktop (≥ lg): fixed sidebar, content scrolls independently
- Mobile: sidebar becomes drawer with backdrop
- Page padding: `p-4 sm:p-6 lg:p-7`
- Wide tables wrapped in `<TableScroll>`

---

## 6. Architecture decisions

These have been implemented and must not be improvised against.

### Two-layer Sender ID approval
Client requests → ProfJero approves → operator registers manually with Arkesel.
Arkesel has no public API for Sender ID management; registration is dashboard-only.
At scale, batch manual registration rather than building automation.

### Wallet model — Reserve / Confirm / Release
Units are never deducted directly. The flow is:
AVAILABLE → RESERVED → SEND TO PROVIDER → CONFIRM (success) OR RELEASE (failure)

text
Every change goes through a `walletTransactions` entry with deterministic doc IDs
(e.g. `reserve__{batchId}`, `confirm__{batchId}__{recordId}`). This makes
idempotency atomic — a replay attempt fails at the Firestore level.

### No provider call inside a Firestore transaction
External APIs never run inside transactions. Transaction retries would cause
duplicate external operations. Correct flow:
1. Firestore transaction: claim idempotency + reserve units + create batch
2. Commit
3. Provider call (outside any transaction)
4. Firestore transaction: confirm or release + update records

### Segment-aware SMS billing
ProfJero Units are charged per SMS segment, matching GSM 03.38:
- GSM-7 (160 chars single, 153 per segment when split, extended chars count as 2)
- UCS-2 (70 chars single, 67 per segment when split, emoji = 2 units)
The calculator lives in `packages/shared/src/lib/smsSegments.ts`. Used by both
backend (billing) and frontend (live cost preview).

### Provider abstraction
Every backend service is behind a provider interface. Today:
- SMS: `sms_gw_01` → Arkesel driver
- Payments: Paystack driver (not yet abstracted into multiple providers)

Provider IDs are opaque (`{service}_gw_{NN}`). The driver name (`arkesel`,
`paystack`) never leaves the backend — not in API responses, not in URLs.
This is deliberate: clients should never know which upstream providers we use.

### Publishable vs. secret API keys
- **Secret keys** (`pk_live_...`) — server-side only, full API access
- **Publishable keys** (`pub_live_...`) — browser-safe, with:
  - Recipient restrictions (allowlist / prefix / any)
  - Rate limits (per minute/hour/day)
  - Lifetime spend cap

Browser keys can send to multiple recipients per request, but each recipient
counts as one rate-limit slot. Rate limits and spend cap are enforced via
Firestore counters on the key doc.

### Currency
All monetary values stored as integers in the smallest unit (pesewas for GHS).
Never store money as floats.

---

## 7. Data model

### Core collections

| Collection | Doc ID pattern | Purpose |
|---|---|---|
| `admins` | Firebase Auth UID | Dashboard users with roles |
| `projects` | auto | External clients |
| `wallets` | projectId | Balance + reserved units per project |
| `walletTransactions` | deterministic | Append-only ledger. Authority for wallet state |
| `apiKeys` | auto | Per-project credentials (secret + publishable) |
| `senderIds` | value (e.g. "GABS") | Global Sender ID registry |
| `senderIdAssignments` | `{projectId}__{senderId}` | Which project can use which Sender ID |
| `smsBatches` | `{idempotencyKey}` | One per send request |
| `smsRecords` | `{batchId}__r{N}` | Per-recipient record |
| `payments` | `{reference}` | Paystack payment records |
| `packages` | auto | Purchasable unit bundles |
| `pricingSettings` | service (`sms`, `airtime`, `data`) | Unit rate + package config |
| `providers` | `{service}_gw_{NN}` | Provider configuration |
| `providerRequests` | auto (7-day retention) | Rolling log of provider API calls |

### Wallet semantics

Every `walletTransactions` entry has `availableDelta` and `reservedDelta`:

| Type | availableDelta | reservedDelta |
|---|---|---|
| `reserve` | -N | +N |
| `confirm` | 0 | -N |
| `release` | +N | -N |
| `purchase` | +N | 0 |
| `refund` | -N | 0 |
| `manual_credit` | +N | 0 |
| `manual_debit` | -N | 0 |

Wallet doc has `availableUnits` and `reservedUnits`. Ledger is the authority;
wallet is a snapshot.

### SMS record statuses

`queued` → `submitting` → `submitted` → `delivered` | `failed` | `unknown` | `released`

- **submitted** = provider accepted the request. Not the same as delivered.
- **unknown** = no definitive answer (provider timeout, network error). Units stay reserved.
- **delivered** = provider confirmed delivery via webhook or polling.

---

## 8. Integrations

### Arkesel (SMS provider)
- **API key**: stored as `ARKESEL_API_KEY` Worker secret
- **Sandbox mode**: `ARKESEL_SANDBOX=true` (dev/staging), `false` (production)
- **Webhook URL**: `ARKESEL_WEBHOOK_URL` — passed as `callback_url` on every send
- **Endpoints used**: `POST /api/v2/sms/send`, `GET /api/v2/clients/balance-details`, `POST /api/v2/sms/message-reports`, `GET /api/v2/sms/{uuid}`
- **Not available**: Sender ID management API. Registration is manual via dashboard.
- **Note**: In practice, unregistered Sender IDs have been observed to work for Ghana traffic despite docs claiming they should fail with error `106`.

### Paystack (payment provider)
- **API key**: `PAYSTACK_SECRET_KEY` Worker secret (currently `sk_test_...`)
- **Webhook**: signature-verified via HMAC-SHA512 using the secret key
- **Events handled**: `charge.success`, `charge.failed`
- **Settlement**: automatic — webhook credits wallet on `charge.success`. Manual verify endpoint exists as a fallback.
- **Idempotency**: deterministic `purchase__{reference}` ledger IDs prevent double-crediting

### Firebase Admin (via jose + REST)
- ID token verification: fetches Google x509 certs, caches per isolate
- Firestore access: mints OAuth2 access token from service account private key
- All secrets stored as Worker secrets

---

## 9. API surface

### Public (no auth)
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/v1/pricing` | Public pricing catalog |
| POST | `/webhooks/arkesel` | Arkesel delivery callbacks |
| POST | `/webhooks/paystack` | Paystack payment events |

### Client API (API key auth)
| Method | Path | Secret | Publishable |
|---|---|---|---|
| GET | `/v1/me` | ✓ | ✓ |
| GET | `/v1/whoami` | ✓ | ✓ (alias) |
| GET | `/v1/wallet` | ✓ (full) | ✓ (limited) |
| GET | `/v1/wallet/transactions` | ✓ | ✗ |
| GET | `/v1/sms/batches` | ✓ | ✗ |
| GET | `/v1/sms/batches/:id` | ✓ | ✓ (own project only) |
| POST | `/v1/sms/send` | ✓ (unrestricted) | ✓ (recipient + rate + spend restrictions) |
| GET | `/v1/sender-ids` | ✓ | ✓ |

### Admin API (Firebase Auth)
Every route under `/admin/*` except `/admin/me` and `/admin/health` requires a role.
Full endpoint list mirrors the dashboard's capability surface. See individual
router files in `apps/api/src/routers/` for exact paths.

### Scheduled (Cloudflare cron)
| Expression | Job |
|---|---|
| `*/15 * * * *` | Reconciliation sweep — polls `unknown` SMS records against Arkesel |
| `0 4 * * *` | Provider request log cleanup (7-day retention) |

---

## 10. What's built (admin dashboard)

All routes are live and functional.

| Route | Purpose | Status |
|---|---|---|
| `/login` | Firebase Auth sign-in | ✓ |
| `/dashboard` | KPIs, charts, activity, low-balance alerts, pending Sender IDs | ✓ real data |
| `/projects` | Client list with filters, sorting, create/edit/archive | ✓ real data |
| `/projects/:id` | Project details + Sender IDs + API keys summary | ✓ real data |
| `/projects/:id/api-keys` | Manage secret + publishable keys | ✓ real data |
| `/sender-ids` | Sender ID registry + approval queue | ✓ real data |
| `/pricing` | Unit rate + package catalog editor | ✓ real data |
| `/sms-logs` | Batch list with per-recipient details | ✓ real data |
| `/wallets` | Wallet list, distribution, transaction history, quick actions | ✓ real data |
| `/payments` | Payment list, initiate (walk-in flow), verify | ✓ real data |
| `/providers` | Provider list grouped by service | ✓ real data |
| `/providers/:id` | Provider details, balance refresh, request log | ✓ real data |
| `/reports` | KPIs, charts, financial analytics, provider activity | ✓ real data |
| `/send-sms` | 3-step wizard: project → compose → review | ✓ real data |
| `/settings` | Platform settings | ⏳ still mock — deferred |

---

## 11. What's not built

### Customer platform (next major milestone)
The self-service surface for clients. Scope to be designed:

- Public signup (Firebase Auth, separate from admin)
- Self-service dashboard (different UI from admin)
- Package purchase flow
- Sender ID request flow (submits for admin approval)
- Public API documentation + client-facing SDKs/snippets
- Support/invoicing/receipts

### Deferred admin features
- Settings page (currently mock)
- Team / Admin management (deferred from earlier — you're the only admin)
- Notifications system (low balance, failed payments, pending Sender IDs)
- Global rate limits / security hardening
- Webhook signature verification for Arkesel (they don't provide one — we rely on UUID recognition)
- Arkesel delivery webhook verification — live test showed webhook didn't fire; deferring to real-traffic diagnosis

### Infrastructure
- Custom domain (`api.profjero.com`, `profjeroconnect.com`)
- Staging worker (config exists, not deployed)
- Firestore TTL policies (rate limit buckets, provider request log)
- Automated backups
- Error tracking (Sentry or similar)

---

## 12. Environment variables

### apps/api/.dev.vars (local dev, gitignored)
FIREBASE_PROJECT_ID=profjero-sms-gateway
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SMS_PROVIDER=arkesel
ARKESEL_API_KEY=...
ARKESEL_SANDBOX=true
DEFAULT_SMS_PROVIDER_ID=sms_gw_01
PAYSTACK_SECRET_KEY=sk_test_...

text

### Cloudflare Worker secrets (production)
Set via `npx wrangler secret put <NAME> --env production`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SMS_PROVIDER`
- `ARKESEL_API_KEY`
- `ARKESEL_SANDBOX`
- `ARKESEL_WEBHOOK_URL`
- `PAYSTACK_SECRET_KEY`
- `DEFAULT_SMS_PROVIDER_ID`

### apps/web/.env (gitignored)
VITE_API_URL=https://profjero-sms-api-prod.amoakob947.workers.dev
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=profjero-sms-gateway.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=profjero-sms-gateway
VITE_FIREBASE_APP_ID=...

text

---

## 13. Operations

### Deploy the API
```cmd
cd apps\api
npm run typecheck
npx wrangler deploy --env production
Deploy the web
cmd
cd apps\web
npm run build
npx wrangler pages deploy dist --project-name=profjeroconnect
Watch live logs
cmd
cd apps\api
npx wrangler tail --env production --format pretty
Manually trigger reconciliation
powershell
Invoke-RestMethod -Uri "https://profjero-sms-api-prod.amoakob947.workers.dev/admin/sms/reconcile" `
  -Method Post -Headers $h -ContentType "application/json" `
  -Body (@{ olderThanMinutes = 30; limit = 200 } | ConvertTo-Json)
Switch Arkesel sandbox mode
cmd
npx wrangler secret put ARKESEL_SANDBOX --env production
# enter: true or false
14. Known issues
Arkesel delivery webhook never fired during live tests. SMS delivers fine; the webhook callback isn't arriving at /webhooks/arkesel. Fallback: the cron poll endpoint resolves delivery status every 15 minutes.

Submitted records aren't swept by reconciliation. Reconciliation only sweeps unknown records. Submitted records that never receive delivery confirmation stay submitted indefinitely. Fix: extend the reconciliation cron to also poll stale submitted records (small follow-up).

Firestore TTL not configured for apiKeyRateLimits (removed in C.19c.1) or providerRequests. Cron cleanup handles providerRequests daily; rate limits now live on the key doc.

apiKeyRateLimits collection may contain orphaned docs from before C.19c.1. Safe to manually delete.

Old providerSettings collection may still exist (superseded by providers). Safe to delete.

features/arkesel/, components/arkesel/, mock/arkesel.ts — dead code from before the rebrand. Nothing imports them.

apps/web/src/mock/* — several mock files are still on disk but not imported. Cleanup pending.

Firebase Auth password resets have been frequent during development. Consider a password manager for the admin account.

15. Conventions
Code:

TypeScript strict mode

Functional components with hooks

Feature-based folder structure

import type for type-only imports

Named exports for components and pages

Business logic in lib/ or feature hooks, not in components

No any

Styling:

Tailwind classes inline

Brand colors used literally where needed (#1976d2, #0c1e38)

rounded-xl for cards, rounded-lg for buttons/inputs

shadow-xs (custom, defined in Tailwind config)

Data:

All components accept typed props

Data never hardcoded in components

Zod schemas in packages/shared are the source of truth for both API and frontend

Git:

Commit after each screen or significant refactor

Message style: feat:, refactor:, fix:, chore:, docs:

Icons:

Lucide React only

16. Notes for the next assistant
Run npm run typecheck before every deploy. It catches type errors that Wrangler's build silently ignores.

.dev.vars and .env are gitignored. Never commit them. Never paste real secrets in chat.

The user prefers step-by-step batches — split large deliveries into "Batch A" and "Batch B" so they can verify between steps.

User is on Windows — use del, mkdir, dir, not bash equivalents.

User is on VS Code. Occasionally files land in the wrong folder if the explorer selection is off — dir /s /b src\*{filename}* finds duplicates.

User is learning. Explain why a decision is made, not just what.

Do not silently mock things. Label mock data clearly.

Do not use placeholder functionality and pretend it's production-ready.

Test responsive behavior in DevTools (Ctrl+Shift+M). Windows display scaling can cause wide monitors to report narrow viewports.

text

---

## Verify checklist for C

- [ ] The file at `docs/state.md` is replaced with the content above
- [ ] No factual errors (compare against what you know of the system)
- [ ] Nothing you consider wrong is stated as fact

## Once that's saved

C is done. Then we're at the natural pre-customer-platform checkpoint. When you're ready, we design the customer platform milestone — signup, self-service dashboard, purchase flow, Sender ID request flow.

Also — check the tail. It should have fired by now. If you see `[cron] trigger fired` and `[cron] reconciliation: nothing to do`, **B is verified and done**.