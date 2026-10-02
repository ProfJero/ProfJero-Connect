# ProfJero Connect — Customer Platform Brief

_Last updated: 2026-09-24. Read this alongside `docs/state.md`. State.md
covers the admin dashboard (built). This doc covers the customer platform
— the second product surface._

> **Status 2026-10-02:** CP1–CP7 are built (auth, dashboard, purchase,
> send, history, Sender ID requests, notifications), plus contacts/groups
> and self-service API keys, which the operator moved into v1 (overriding
> §9). Implementation notes and the deploy checklist: `docs/state.md` §14.

---

## 1. Why this document exists

State.md describes what exists today. This document describes what comes
next: the customer-facing product. It exists so a new chat can pick up the
customer platform milestone without re-deriving the vision from scratch.

Read order: `docs/state.md` first (technical + operational context), then
this file (product vision + open questions).

---

## 2. Mission

ProfJero Connect is not just an SMS gateway. It is a multi-service
communication platform. SMS is the first service. Airtime, Data Bundles,
and possibly others will follow on the same infrastructure.

The **customer platform** is the self-service product surface of ProfJero
Connect. It serves two distinct customer types:

1. **API integrators** — clients who already have their own applications
   (Firebase apps, Supabase apps, custom backends) and want to call
   ProfJero Connect programmatically.
2. **Self-service users** — businesses, organizations, or individuals who
   do NOT have their own system and want to use ProfJero Connect as a
   standalone product (like using Arkesel directly, but through our
   platform).

Both types matter. Both are supported by the same underlying infrastructure
that the admin dashboard already manages.

---

## 3. The three audiences

| Audience | UI | Auth | Billing | Example |
|---|---|---|---|---|
| **Admin (you)** | Admin dashboard | Firebase Auth (admins collection) | N/A — you own the platform | Operator |
| **API integrator** | No UI from us | API key (`pk_live_*` or `pub_live_*`) | Units purchased via admin or (future) self-service | GABS, DBI, Church A, Pharmacy, School |
| **Self-service user** | Customer platform UI | Firebase Auth (customer accounts — new) | Units purchased via customer platform | A local business with no dev team |

**The existing clients you have (GABS, DBI, etc.) are API integrators.**
They don't need a customer platform login. They call our `/v1/*` endpoints
with API keys that we issue via the admin dashboard.

**The customer platform is a new product for the third audience.** These
users have never heard of Arkesel. They see only "ProfJero Connect." They
sign up, pay, and send.

---

## 4. Auth surface decision — IMPORTANT, confirm before building

**Assumed: two separate auth surfaces.**

- **Admin dashboard** — Firebase Auth, `admins/{uid}` collection, roles
  (super_admin, admin, finance, support, viewer). Built.
- **Customer platform** — separate Firebase Auth user pool or a separate
  `customers` collection keyed by Firebase Auth UID. To be built.

Reasoning: an admin is an operator; a customer is a tenant. Merging them
into one login creates confusion (which dashboard do we show them?) and
complicates permission logic. Two surfaces keeps each clean.

**If this assumption is wrong** — e.g. you want a single login that
redirects based on role — say so at the start of the milestone. It changes
the shape of everything downstream.

---

## 5. Core capabilities — customer platform v1

What a self-service customer must be able to do:

1. **Sign up / sign in** — email + password. Separate from admin.
2. **Dashboard** — see wallet balance, recent sends, package options.
3. **Buy units** — pick a package, pay via Paystack, wallet credits
   automatically on webhook.
4. **Send SMS** — single or bulk, from a Sender ID the customer owns or has
   been assigned.
5. **Request a Sender ID** — submits a request that reaches the admin for
   approval (see §6 for the manual-registration caveat).
6. **See history** — past sends, per-recipient delivery status, past
   payments, wallet transactions.
7. **Manage profile** — email, password, company name, contact details.
8. **(Optional v1)** — API key access, for customers who want to integrate
   their own systems later. Reuses the existing `/v1/*` surface.

Everything a customer does is scoped to their own account. No cross-tenant
visibility.

---

## 6. The Sender ID blocker (READ CAREFULLY)

This is the single biggest UX problem for the customer platform. Solve it
or work around it deliberately — do not let it surface as a surprise mid-build.

**The problem:** Arkesel has no public API for Sender ID registration. It
is done manually through their dashboard. The architecture we already
built reflects this:
Customer requests Sender ID
↓
Our system records it as "pending"
↓
Admin (you) logs into Arkesel dashboard
↓
Admin registers the Sender ID manually
↓
Admin returns to our admin dashboard and clicks "Approve"
↓
Customer can now send from that Sender ID

text

**The consequence:** the customer's request is genuinely pending. It can
take minutes, hours, or a day depending on when you see it. This is not
something we can automate away today.

**What the customer platform must therefore do:**

- **Set honest expectations** — "Your request will be reviewed within X
  hours. You'll be notified when it's ready."
- **Send notification** when approved (requires a notification system —
  see §7)
- **Allow usage before approval** — the customer should be able to use the
  platform for other things (buy units, explore, prepare contacts) while
  their Sender ID is pending
- **Show pending status clearly** — "Sender ID: PENDING — awaiting approval"
- **Not block signup** — a customer should be able to sign up, buy units,
  and request a Sender ID even if it takes time to be approved

**The alternative workflows we considered and rejected:**

- Auto-register via Arkesel API — impossible, no such API exists
- Partner/reseller API — Arkesel offers one but its T&C don't fit the
  current plan (see conversation history from 2026-09-24)
- Bypass Sender ID requirement — Arkesel docs say unregistered Sender IDs
  fail, though in practice Ghana traffic has been observed to deliver
  anyway. Not a foundation to build on.

**Do NOT design the customer platform with an assumption of instant Sender
ID approval.** That will lead to a design that breaks the first time a real
customer waits hours.

---

## 7. Notifications are a dependency

The customer platform cannot ship without some form of notification:

- "Your Sender ID was approved"
- "Your payment was received"
- "Your wallet balance is low"
- "Your batch has completed"

Options:
- **Email** (via a service like Resend, Postmark, SendGrid)
- **In-app** (a `notifications` collection + a bell in the customer UI)
- **SMS** (using our own SMS service — nice dogfooding but costs units)

**Recommendation:** start with in-app notifications (simplest, no external
dependency) plus email for critical events (Sender ID approval, payment
receipt). We can wire email through Resend — free tier is generous and
their API is clean.

This is a separate small milestone before or alongside customer platform v1.

---

## 8. Pricing recap

ProfJero Units are the customer-facing currency. Providers (Arkesel,
future) are an implementation detail hidden behind `{service}_gw_{NN}`
IDs. The customer never sees or hears the provider's name.

**Launch packages (already live in the pricing catalog):**

| Package | Price (GHS) | Units | Effective rate |
|---|---|---|---|
| Starter | 20 | 500 | 0.0400 |
| Basic | 50 | 1,300 | 0.0385 |
| Growth | 100 | 2,750 | 0.0364 |
| Business | 200 | 5,700 | 0.0351 |
| Professional | 500 | 14,800 | 0.0338 |
| Enterprise | 1,000 | 30,000 | 0.0333 |
| Business Plus | 2,000 | 64,000 | 0.0313 |
| Enterprise Plus | 5,000 | 165,000 | 0.0303 |

Gross margins cluster at ~20–22% against Arkesel's GHS 0.013 per unit
cost, which is stored in `providers/sms_gw_01.costPerUnitGhs`.

**Future services (Airtime, Data) will reuse the same pricing model:**
- `pricingSettings/{service}` — unit rate + service config
- `packages` collection — service-namespaced bundles
- Wallet stays unit-denominated; the same unit can be spent on any service

**Do not hardcode prices in the customer platform UI.** Always fetch from
`GET /v1/pricing`.

---

## 9. What's out of scope for customer platform v1

To prevent scope creep, explicitly deferred:

- **Custom Sender ID branding workflows** — e.g. customer submits letterhead
  documents for review. Keep the flow simple: request → admin approves.
- **Team/seat management per customer** — one account = one owner for now.
- **Invoicing / tax receipts** — Paystack provides receipts; we don't need
  our own system yet.
- **Scheduled sends** — Arkesel supports it; customer platform v1 is
  immediate-send only.
- **Contact lists / groups** — Arkesel supports groups; keep v1 to
  per-send recipient entry.
- **Templates** — Arkesel supports variable SMS; defer.
- **Two-factor auth for customer logins** — deferred.
- **Self-service API key management** — customers who want to integrate
  later can request a key from admin manually. Self-service key creation
  is a future milestone.
- **Data and Airtime** — v1 is SMS only. Other services come after SMS
  is proven end-to-end.

If a customer asks for any of the above, the answer is "we're working on
it" — not a redesign.

---

## 10. Technical surface already in place

The customer platform inherits a substantial backend. Do not rebuild these.

**Public reads (no auth):**
- `GET /v1/pricing` — pricing catalog

**Client API (API key auth):**
- `GET /v1/me` — identity
- `GET /v1/wallet` — balance
- `GET /v1/wallet/transactions` — ledger history (secret keys only)
- `GET /v1/sms/batches` — send history (secret keys only)
- `GET /v1/sms/batches/:id` — batch detail with per-recipient status
- `POST /v1/sms/send` — send SMS
- `GET /v1/sender-ids` — Sender ID assignments for this project

**Webhooks:**
- `POST /webhooks/paystack` — payment events (working)
- `POST /webhooks/arkesel` — delivery events (not firing in production — see state.md §14)

**Admin API for cross-tenant management:**
Every route under `/admin/*` — see the admin dashboard's UI, which mirrors
all admin capabilities.

**What's missing for customer platform:**
- Customer signup / login (new Firebase Auth surface)
- Customer-facing "buy units" flow (the Paystack call exists; the customer
  needs a UI and a customer-scoped endpoint)
- Customer-facing "request Sender ID" flow — currently admin-only

These are the three things the customer platform milestone must add.

---

## 11. Architecture decisions that constrain the customer platform

These were made for the admin platform and apply equally here:

**Never expose provider names.** No "Arkesel" or "Paystack" strings in
customer-facing URLs, UI text, or API responses. Providers are referenced
as `sms_gw_01`, `payment_gw_01`, etc.

**Units are the currency.** Customers buy units, spend units. They never
see Arkesel's SMS credits or per-credit cost. The unit abstraction is the
product.

**Wallet is append-only ledger + snapshot.** Reserve → confirm → release.
Never mutate balances directly. Reuse the existing wallet service — do not
build a second one for the customer side.

**Idempotency everywhere.** Every payment initiation, every SMS send uses
deterministic doc IDs so retries can't double-charge. See state.md §6.

**No provider call inside a Firestore transaction.** Same rule as the
admin platform.

**Two-layer Sender ID approval.** Customer requests → ProfJero approves →
provider registered. There is no third layer.

**CORS allowlists are explicit.** Adding a new customer platform origin
means editing `allowedOrigins` in `apps/api/src/index.ts` and redeploying.

---

## 12. Design principles inherited from the admin dashboard

**Honest UI, no fakes.** Every number displayed comes from a real source.
If a metric has no data, show "No data" — never placeholder numbers.

**Empty states over placeholders.** If a customer has no sends, show
"No messages yet" with a call-to-action. Never show fake sample rows.

**Error envelopes are consistent.** `{ error: { code, message, requestId } }`.
Always expose the requestId so support can correlate with Worker logs.

**Provider abstraction is invisible.** Never let a technical provider
detail leak into customer-facing copy. `sms_gw_01` is internal; customers
see "SMS service" or just "SMS."

**Mobile-first by default.** The customer platform will be used on phones
far more than the admin dashboard. Every screen designed mobile-first,
desktop second.

---

## 13. Open questions to resolve at milestone start

Before any customer platform code is written, get answers to:

1. **Auth surface confirmation** — two separate Firebase Auth surfaces
   (admin vs customer), or one with role-based routing? (Assumption in
   §4: two separate. Confirm or correct.)

2. **Customer self-signup vs. invite-only** — can anyone sign up and use
   the platform, or does the operator approve new customers first? If
   invite-only: how do invitations get sent (email link? admin-created
   account?).

3. **Free trial / starter credit** — do new customers get a small free
   balance (e.g. 100 units) to try the platform, or must they buy before
   sending? If free: how do we prevent abuse (duplicate accounts)?

4. **Sender ID request volume** — how many new Sender IDs do you expect
   per week at launch? This determines whether manual Arkesel registration
   is sustainable or whether we need to design a batching UI for it.

5. **Customer-facing branding** — the domain `profjeroconnect.com` — do
   you own it or is it aspirational? If not owned yet, the customer
   platform ships on `profjeroconnect.pages.dev` for now.

6. **Terms of Service / Privacy Policy** — customers will need to accept
   something at signup. Do you have these drafted, or do we stub the
   acceptance checkbox with placeholder text?

7. **Support model** — when a customer has an issue, how do they reach
   you? Email, in-app contact form, WhatsApp? This shapes whether we need
   a support inbox widget in the customer UI.

Answer these before scoping, not during.

---

## 14. Suggested batch sequence

Once the open questions are answered, the customer platform can be built
in this order. Each batch is independently verifiable.

**CP1 — Customer auth foundation**
- Firebase Auth: create `customers/{uid}` collection (or a separate
  Firebase project — decide per Q1)
- Signup + login pages in a new `apps/customer` Vite app
- Route guards
- Password reset flow
- No business logic yet — just prove signup works

**CP2 — Customer dashboard shell**
- Layout, nav, page structure
- Empty states for wallet / sends / payments
- Fetch from `/v1/*` — but with what auth? (Customer apps don't have
  API keys. Need to decide: customer session → backend endpoint that
  mints short-lived API access, or a new `/customer/*` API surface with
  Firebase Auth.)

**Important architectural fork here:** the existing `/v1/*` API uses API
key auth. Customer platform users sign in with Firebase Auth, not API
keys. So either:
- (a) the customer platform talks to a NEW `/customer/*` API surface
  authenticated with Firebase ID tokens (recommended)
- (b) the customer platform's backend-for-frontend (a thin Worker) mints
  per-user API keys on the fly — complex, not recommended

Decide this at CP2.

**CP3 — Wallet and purchase flow**
- Customer sees their wallet balance
- Picks a package from `/v1/pricing`
- Initiates a payment (customer-scoped endpoint — new)
- Redirects to Paystack
- Webhook credits the wallet (existing mechanism, no change)
- Returns to a success page

**CP4 — Send SMS**
- Single and bulk recipient entry
- Sender ID picker (only their own approved Sender IDs)
- Compose + segment preview (reuse from admin)
- Send → existing `/v1/sms/send` mechanism, but customer-scoped endpoint
- Success page with batch ID

**CP5 — History**
- Send history list
- Batch detail with per-recipient statuses
- Payment history
- Wallet transaction history

**CP6 — Sender ID request**
- Customer submits a Sender ID request
- Appears in the admin's `/sender-ids` queue (existing mechanism)
- Customer sees pending status in their own dashboard
- Notification when approved

**CP7 — Notifications**
- In-app notification center
- Email notifications for Sender ID approval, payment receipt, low balance
- Reuses a `notifications` collection

**CP8 — Polish and launch**
- Terms acceptance
- Landing page / marketing site (optional, could be a separate small app)
- Support contact
- Analytics (privacy-respecting — no Google Analytics if avoidable)

CP1 through CP8 is roughly 8 batches. Roughly the same scale as the admin
dashboard build.

---

## 15. What the customer platform is NOT

To prevent drift:

- It is not a rebrand of the admin dashboard. Different users, different
  purpose, different codebase (`apps/customer`, not `apps/web`).
- It is not a fork of Arkesel's dashboard. Arkesel's UI is dense and
  technical; ours should be friendlier for non-technical buyers.
- It is not multi-tenant in the way the admin dashboard is. Each customer
  sees only their own data. No cross-account anything.
- It is not feature-complete with Arkesel. Ship v1 small, iterate based
  on actual customer feedback.

---

## 16. Reference — the original motivation

Quoting the operator directly, because this framing should anchor design
decisions:

> "I'd like to create my own client side SMS platform also just like
> arkesel so businesses, organizations or individuals who do not have any
> system but want to send SMS can still use my SMS platform."

> "When we get to the customer side, we'll know what to do."

> "The platform will not be for only SMS but for other services such as
> Airtime and Data Bundles. Just that we are first building the SMS
> platform."

The customer platform is an **SMS-first, multi-service-ready** product
for non-technical users. Design accordingly.
Part 2 — Add a "read first" section to docs/state.md
Open docs/state.md. Near the top, right after the "Last updated" line and before "## 1. What this project is", insert:

markdown
## 0. Read first

If you're picking up this project from a new chat:

1. Read this file (state.md) in full. It covers the admin dashboard,
   which is built and deployed.
2. Read `docs/customer-platform.md` if it exists. It covers the customer
   platform, the next major milestone — the product side that clients
   actually use.
3. Check the current git status and confirm what's deployed by running
   `npx wrangler deployments list --env production` from `apps/api`.

Then ask before assuming. The platform has been through many iterations
and some decisions are non-obvious. When in doubt, check the reasoning
in state.md §6 (Architecture decisions) before improvising.