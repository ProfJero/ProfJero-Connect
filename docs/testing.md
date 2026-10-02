# ProfJero Connect — Testing & Security Report

_Last run: 2026-10-02, branch `claude/nifty-babbage-1reeo5`._

This covers both platforms (admin `apps/web`, customer `apps/customer`) and
the shared API (`apps/api`). Every suite runs locally without any Firebase,
Paystack, Arkesel or Resend account: the real API code runs against an
in-memory fake of those services (`apps/api/test/fakeCloud.ts`).

## How to run

Windows CMD and macOS/Linux use the same commands, from the repo root.

| What | Command | Needs |
|---|---|---|
| Typecheck all apps | `npm run typecheck` | — |
| Lint | `npm run lint --workspace=web` and `--workspace=customer` | — |
| API: customer journey (27 checks) | `npm run test:customer --workspace=@profjero/api` | `openssl` on PATH (Git for Windows has one) |
| API: security & reliability (61 checks) | `npm run test:security --workspace=@profjero/api` | `openssl` |
| API: both of the above | `npm test --workspace=@profjero/api` | `openssl` |
| Load test | `npm run test:load --workspace=@profjero/api` (options: `-- --customers=50 --rounds=40`) | `openssl` |
| Firestore rules (6 tests) | `cd firebase`, `npm install`, `npm test` | Java 11+ (for the emulator) |
| Browser: UI, accessibility, mobile (17 tests) | `npm run test:e2e` | `npx playwright install chromium` once |
| Local API for manual testing | `npm run dev:fake --workspace=@profjero/api` | `openssl` |

`npm run test:e2e` starts the fake-cloud API on :8787, the admin app on
:5173 and the customer app on :5174 by itself. Seeded logins for the admin
app: `root@ops.example` (super admin) and `viewer@ops.example` (viewer);
any password works because Firebase Auth is answered inside the browser.

## Results

| # | Area | Priority | Covered by | Result |
|---|---|---|---|---|
| 1 | Authentication | 🔴 | security suite §Authentication | ✅ 8/8 |
| 2 | Authorisation (RBAC) | 🔴 | security suite §RBAC, e2e viewer test | ✅ 5/5 |
| 3 | Firestore rules | 🔴 | `firebase/test/rules.test.mjs` | ✅ 6/6 |
| 4 | Wallet integrity | 🔴 | ledger invariant after every money test + load test | ✅ |
| 5 | Payment security | 🔴 | security suite §Payment security | ✅ 6/6 |
| 6 | API security | 🔴 | security suite §Tenant isolation & API security | ✅ 7/7 |
| 7 | Idempotency | 🔴 | security suite §Idempotency, customer suite | ✅ 3/3 |
| 8 | Race conditions | 🔴 | security suite §Race conditions | ✅ 5/5 |
| 9 | Business logic | 🔴 | security suite §Business rules, customer suite | ✅ 7/7 |
| 10 | Provider failures | 🔴 | security suite §Provider failures | ✅ 6/6 |
| 11 | Input validation | 🟠 | security suite §Input validation (fuzzing) | ✅ 3/3 |
| 12 | Rate limiting | 🟠 | security suite §Rate limiting | ✅ 4/4 |
| 13 | Secrets | 🔴 | scan of tracked files, git history, built bundles | ✅ none found |
| 14 | Dependencies | 🟠 | `npm audit` | ✅ 0 vulnerabilities (was 13) |
| 15 | Load testing | 🟠 | `test/load.ts` | ✅ 3,000 requests, 0 errors |
| 16 | Regression | 🟠 | all of the above + typecheck/lint/build | ✅ |
| 17 | UI testing | 🟡 | `e2e/admin.spec.ts`, `e2e/customer.spec.ts` | ✅ 13/13 |
| 18 | Accessibility | 🟡 | `e2e/accessibility.spec.ts` (axe, WCAG 2.1 A/AA) | ✅ 33 screens, 0 serious/critical |
| 19 | Mobile | 🟠 | `e2e/mobile.spec.ts` (Pixel 7) | ✅ 2/2 |
| 20 | Monitoring & recovery | 🔴 | security suite §Monitoring & recovery | ✅ 7/7 |

## What each area checks

**1. Authentication** — missing/malformed/empty bearer tokens; expired,
wrong-issuer, wrong-audience, unknown-key and forged (other key) tokens;
`alg: none` and tampered payloads; customer token on admin routes and admin
token on customer routes; a forged `customer` claim without a record;
disabled admins and suspended customers are locked out immediately; an
admin can't register as a customer.

**2. RBAC** — a matrix of 42 admin endpoints × 5 roles (super admin, admin,
finance, support, viewer): every allowed role gets past the role check,
every other role gets 403, nobody gets 401/5xx. Plus: settings report
per-role edit rights; nobody can change their own role or status; the last
active super admin can't be demoted or disabled; a customer can't be
invited as an admin; the viewer UI is read-only.

**3. Firestore rules** — deny-all for every client SDK read and write (both
apps go through the API, which uses a service account). The tests fail if
the rules are loosened.

**4. Wallet integrity** — after every test that moves money, for every
project: wallet snapshot = sum of its ledger, nothing negative, and
reserved units = units held by unresolved messages.

**5. Payment security** — webhooks without, with a wrong, or with a
stale-after-tampering signature are rejected and credit nothing; a signed
webhook with the wrong amount or currency is **not credited** and is held
for review; webhook replay (6 concurrent + 1 late) credits once; manual
verify never credits a gateway amount mismatch; refunded payments can't be
re-credited; prices are always computed server-side.

**6. API security** — tenants can't read each other's batches, payments or
Sender IDs; an Idempotency-Key reused by another project gets 409 and no
data; revoked keys fail immediately with a generic message; no hashes,
secrets or stack traces in responses; every error has a request ID; CORS
echoes only known origins (and no localhost in production); checkout never
redirects to an attacker's origin.

**7. Idempotency** — same key + same body replays without charging again;
same key + different message/recipients/package is 409 (customer send,
`/v1` send, checkout); `/v1` send requires the header.

**8. Race conditions** — 25 concurrent sends on a 10-unit wallet never
overdraw; the same key sent 5× at once makes one batch and charges once;
5 concurrent registrations make one customer and one project; 9 concurrent
API-key creations respect the 5-key cap; concurrent admin credits/debits
keep the ledger exact.

**9. Business logic** — Unicode messages bill by the 70/67-character
segment rules; settings take effect (welcome credit, default low-balance
level, review time, max recipients enforced before reserving, closed
sign-ups, paused top-ups with the operator's message); suspended projects
can't send; pending/rejected Sender IDs can't be used.

**10. Provider failures** (`SMS_PROVIDER=arkesel` against a fake provider)
— a 4xx rejection fails the messages and releases units; a 5xx or network
error keeps units held as "unknown" (never refunded blindly);
reconciliation keeps fresh unknowns and releases ones older than 7 days;
delivery webhooks charge exactly once; a delivery webhook without the
shared token is rejected; a database outage returns a clean 5xx with no
partial writes.

**11. Input validation** — 21 hostile payloads (nulls, wrong types, huge
strings, 5,000 recipients, prototype pollution, path traversal, script and
SQL fragments) against 13 endpoints: always 4xx, never 5xx; settings reject
out-of-range values; stored text comes back verbatim as JSON data.

**12. Rate limiting** — sends per minute (configurable), API calls per
minute per account (configurable, doesn't affect other accounts), sign-ups
per network address, Sender ID requests per day: 429 with `Retry-After`.

**13. Secrets** — no live keys, private keys or tokens in tracked files,
git history or the built front-end bundles; the customer bundle contains
no provider names. `.env`/`.dev.vars` are git-ignored; only `.example`
files are tracked. The Firebase **web** API key in `apps/web/.env.example`
is public by design; restrict it to your domains in Google Cloud Console →
Credentials.

**14. Dependencies** — `npm audit` went from 13 findings (5 high) to 0 by
upgrading the customer app's Firebase SDK (10 → 12), wrangler (4.147) and
overriding `@grpc/grpc-js` (≥ 1.14.5).

**15. Load** — 30 customers × 20 rounds × 5 operations, all customers
concurrent: 3,000 requests, 0 server errors, 0 ledger problems, every send
accepted. Database round-trips per request (the number that matters in
production — multiply by your Firestore round-trip, ~20–60 ms):

| Operation | Round-trips |
|---|---|
| GET /customer/wallet | 2 |
| GET /customer/sms/batches | 2 |
| GET /customer/notifications | 2 |
| GET /admin/dashboard | 5 |
| POST /customer/sms/send (3 recipients) | 32 |

Sending is the expensive path (per-recipient records, reservation,
provider call, settlement): roughly 1–2 s for a small send in production.
It is correct under load; batching those writes is the next optimisation
if sends feel slow.

**17. UI** — every admin and customer page loads with no console errors,
uncaught exceptions or API 5xx; the alert bell's unread badge clears and
stays cleared after reload; the sidebar SMS balance links to the provider;
quick actions open the real dialogs; settings save, persist, appear in the
audit log and change the customer app (support email, review time, closed
sign-ups, paused top-ups); team invite returns a setup link; profile name
and password change; sign-out; a full customer journey (top up → Sender ID
approved → send → history); an API key is shown once only.

**18. Accessibility** — axe-core scans 17 admin and 16 customer screens
(plus the open alerts panel) for WCAG 2.1 A/AA. Every page also has
exactly one `<h1>`.

**19. Mobile** — on a Pixel 7 viewport, no page scrolls sideways, the menu
drawer opens and navigates, and the alerts panel fits the screen.

**20. Monitoring & recovery** — `/health/ready` returns 200, or 503 when
the database is unreachable (point an uptime monitor at it); scheduled jobs
write heartbeats that the System tab shows; a stale cron raises a bell
alert in production; alerts are unread per admin and clear on "seen";
admin changes are audit-logged with secrets redacted (failed and read-only
requests aren't logged); invited admins get a login and setup link, and
disabling an admin also disables their Firebase login.

## Bugs the tests found (all fixed)

| Severity | Bug | Fix |
|---|---|---|
| 🔴 | Payment webhook credited the wallet without checking the amount/currency | Mismatches are not credited; payment marked failed "needs review" |
| 🔴 | Anyone could POST forged delivery receipts (charging or refunding units) | Optional shared token `ARKESEL_WEBHOOK_SECRET` in the callback URL |
| 🔴 | `/v1` Idempotency-Key reused by another project returned that project's batch | 409, no data |
| 🔴 | Suspended/archived projects could still send through API keys and the app | Sending refused from every surface |
| 🔴 | Provider 5xx refunded units for messages that may have gone out | Kept as "unknown" for reconciliation |
| 🟠 | Concurrent requests could exceed the 5-API-key cap (9 created) | Count + create in one transaction |
| 🟠 | `packageId: "../../admins/x"` reached the database (500) | Document IDs validated before any request |
| 🟠 | Same key with a different message/package was replayed silently | 409 everywhere |
| 🟠 | A checkout retry counted against the rate limit | Replays skip the limiter |
| 🟠 | Localhost origins accepted by CORS in production | Refused in production |
| 🟠 | Auth failures logged full token claims (emails) | Only the error message is logged |
| 🟡 | 18 React lint errors (state reset in effects, impure renders) | Fixed; lint is clean |
| 🟡 | Text contrast below WCAG AA on most screens; one `<h1>` missing or duplicated on most pages; unlabelled dropdowns; unreachable scroll areas | Fixed |
| 🟡 | Wallets table "⋮" button did nothing | Now opens the project |
