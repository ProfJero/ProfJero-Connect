# ProfJero Connect — API Reference

_Last updated: 2026-09-26. Covers the client-facing `/v1/*` API. Read
`docs/state.md` for architectural context and `docs/customer-platform.md`
for the product roadmap._

---

## Table of contents

1. Overview
2. Authentication
3. Error handling
4. Rate limits (publishable keys only)
5. Endpoints
   - Identity
   - Wallet
   - SMS
   - Sender IDs
   - Pricing (public)
   - Health (public)
6. Webhooks (internal)
7. Idempotency
8. Segment counting
9. Changelog

---

## 1. Overview

ProfJero Connect's public API lets client applications send SMS, check
wallet balances, view send history, and manage Sender IDs programmatically.

**Base URL (production):**
https://profjero-sms-api-prod.amoakob947.workers.dev

text

**Base URL (local development):**
http://localhost:8787

text

**Format:** All requests and responses are JSON. The API does not accept
form-encoded bodies or return XML.

**Time zone:** All timestamps are ISO 8601 UTC strings
(`2026-09-26T14:30:00.000Z`). Convert to local time in your client.

**Currency:** All monetary amounts are GHS. Where amounts represent
fractional currency (e.g. `0.05` GHS), they are stored as integers in
pesewas (the smallest GHS unit, 1 GHS = 100 pesewas). Fields ending in
`Pesewas` are always integers.

---

## 2. Authentication

The API uses **bearer tokens in the `Authorization` header**. There are
two kinds of API keys, each with different capabilities:

| Key kind | Prefix | Use from | Access |
|---|---|---|---|
| Secret key | `pk_live_...` | Server-side code only | Full API access |
| Publishable key | `pub_live_...` | Browser / mobile | Restricted access |

**Never embed a secret key in browser code, mobile apps, or any place a
user can read it.** Secret keys grant full access to your account's wallet
and send capability. Publishable keys are designed for client-side use and
carry restrictions (see §4).

### Header format
Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

text

Every request to `/v1/*` (except `/v1/pricing`) must include this header.
Requests without it return `401`.

### Creating a key

Keys are created through the admin dashboard. See
`https://profjeroconnect.pages.dev` → Project → API Keys → Create Secret
Key or Create Publishable Key.

The full plaintext key is shown **once** at creation. Store it securely
immediately. If you lose it, revoke the key and create a new one.

### Rotating a key

Rotation is: create a new key, deploy it to your application, verify
traffic, then revoke the old key. Revocation is immediate — the key
stops working on the next request.

---

## 3. Error handling

All errors use a consistent envelope:

```json
{
  "error": {
    "code": "http_400",
    "message": "Validation failed — recipients: Array must contain at least 1 element(s)",
    "requestId": "b1a2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
Field	Meaning
code	Short machine-readable string. Usually http_<status> for HTTP errors.
message	Human-readable explanation. Safe to display to developers.
requestId	Unique identifier for this request. Include this when reporting issues.
Status codes
Code	Meaning
200 OK	Success
201 Created	Resource created (e.g. batch accepted)
400 Bad Request	Invalid request — check the message for details
401 Unauthorized	Missing, malformed, expired, or revoked API key
402 Payment Required	Insufficient wallet balance
403 Forbidden	Publishable key attempted a restricted operation, or recipient not permitted
404 Not Found	Resource doesn't exist, or isn't accessible to your account
409 Conflict	Idempotency conflict (same key, different body), or duplicate operation
429 Too Many Requests	Rate limit exceeded (publishable keys only)
500 Internal Server Error	Our problem. Include requestId when reporting.
Client behavior recommendations
Retry on 5xx and 429 with exponential backoff (start at 1s, cap at 30s).

Do not retry on 4xx except 429. Fix the request first.

Log the requestId from every error. It's the only way support can trace a specific request.

4. Rate limits
Rate limits apply only to publishable keys (pub_live_*). Secret keys
have no rate limits.

Each publishable key has three configurable limits, set at creation:

Window	Default	Range
Per minute	5	1 – 10,000
Per hour	30	1 – 100,000
Per day	100	1 – 1,000,000
One rate-limit slot is consumed per recipient, not per request. A
single request sending to 50 recipients consumes 50 slots.

The three windows are checked independently. A request is rejected if any
window would be exceeded.

Spend cap
Every publishable key also has a lifetime spend cap (units). Once the
cap is reached, all further sends fail with 403 until the cap is raised
or the key is replaced.

Recipient restrictions
Publishable keys can be restricted to specific recipients. Three modes:

Mode	Behavior
allowlist	Recipients must match one of an explicit list of phone numbers
prefix	Recipients must start with one of the configured prefixes (e.g. +233)
any	No restriction. Use with caution.
Restrictions are enforced before the send is attempted. If any recipient
in a batch fails the check, the entire batch is rejected with 403 — no
partial sends.

Response on rate limit
json
{
  "error": {
    "code": "http_429",
    "message": "Rate limit exceeded (5/minute). Try again shortly.",
    "requestId": "..."
  }
}
The response does not currently include Retry-After headers. Use
exponential backoff with a base delay of 1–5 seconds.

5. Endpoints
Identity
GET /v1/me
Returns information about the API key and its project.

Request:

http
GET /v1/me
Authorization: Bearer pk_live_...
Response (200):

json
{
  "projectId": "e7hADD1MxLpNsUrqjDcZ",
  "projectName": "GABS",
  "keyId": "CTtJ5Xo0LAXZg0SZ7wda",
  "keyName": "Production backend",
  "keyKind": "secret",
  "time": "2026-09-26T14:30:00.000Z"
}
keyKind is either "secret" or "publishable". Useful for verifying
credentials and displaying account info in your app.

GET /v1/whoami
Alias for /v1/me. Same response.

Wallet
GET /v1/wallet
Returns the project's current wallet balance.

Response (200) for secret keys:

json
{
  "availableUnits": 500,
  "reservedUnits": 0,
  "totalUnits": 500,
  "lowBalanceThreshold": null,
  "updatedAt": "2026-09-26T14:30:00.000Z"
}
Response (200) for publishable keys:

json
{
  "availableUnits": 500,
  "reservedUnits": null,
  "totalUnits": 500,
  "lowBalanceThreshold": null,
  "updatedAt": "2026-09-26T14:30:00.000Z"
}
Note: reservedUnits and lowBalanceThreshold are hidden from
publishable keys. totalUnits always equals availableUnits + reservedUnits, so publishable clients can still show total spendable.

Field meaning:

availableUnits — units immediately usable

reservedUnits — units held for in-flight SMS (may or may not be charged)

totalUnits — sum of both

GET /v1/wallet/transactions
Returns the wallet's ledger history (newest first).

Secret keys only. Publishable keys receive 403.

Query parameters:

Name	Type	Default	Description
limit	integer	20	Max 100
before	ISO 8601 datetime	—	Cursor — return entries older than this timestamp
Response (200):

json
{
  "transactions": [
    {
      "id": "confirm__batch-abc__r0",
      "projectId": "e7hADD1MxLpNsUrqjDcZ",
      "type": "confirm",
      "availableDelta": 0,
      "reservedDelta": -1,
      "availableAfter": 500,
      "reservedAfter": 0,
      "batchId": "batch-abc",
      "recordId": "batch-abc__r0",
      "amountGhs": null,
      "description": null,
      "createdBy": "apiKey:CTtJ5Xo0LAXZg0SZ7wda",
      "createdAt": "2026-09-26T14:30:00.000Z",
      "reversesTransactionId": null,
      "metadata": null
    }
  ],
  "count": 1,
  "nextCursor": null
}
Transaction types: reserve, confirm, release, purchase,
refund, manual_credit, manual_debit, reversal, adjustment.

See docs/state.md §7 for the delta semantics of each type.

Pagination: pass nextCursor as the before parameter on the next
call. nextCursor is null on the last page.

SMS
POST /v1/sms/send
Send an SMS to one or more recipients.

Required header: Idempotency-Key (8–120 characters, unique per
logical send — see §7).

Request body:

json
{
  "recipients": ["+233531207256", "+233240000010"],
  "message": "Your verification code is 482931.",
  "senderId": "GABS"
}
Field	Type	Required	Notes
recipients	string[]	yes	1–1000 entries. E.164 or local Ghana format.
message	string	yes	1–1000 characters. Billing is per GSM-7/UCS-2 segment (see §8).
senderId	string	yes	1–11 chars. Must be approved for your project.
Response (201 Created) — new batch:

json
{
  "batch": {
    "id": "webhook-test-41a2a86b-b4ce-41d2-b959-1491a265535f",
    "projectId": "e7hADD1MxLpNsUrqjDcZ",
    "apiKeyId": "CTtJ5Xo0LAXZg0SZ7wda",
    "senderId": "GABS",
    "message": "Your verification code is 482931.",
    "status": "completed",
    "totalRecipients": 2,
    "totalUnitsReserved": 2,
    "totalUnitsCharged": 2,
    "totalUnitsReleased": 0,
    "submittedCount": 2,
    "failedCount": 0,
    "unknownCount": 0,
    "deliveredCount": 0,
    "messageEncoding": "GSM-7",
    "messageSegments": 1,
    "idempotencyKey": "webhook-test-41a2a86b-b4ce-41d2-b959-1491a265535f",
    "createdAt": "2026-09-26T14:30:00.000Z",
    "updatedAt": "2026-09-26T14:30:02.000Z",
    "completedAt": "2026-09-26T14:30:02.000Z",
    "projectName": "GABS",
    "projectStatus": "active"
  },
  "records": [
    {
      "id": "webhook-test-41a2a86b-b4ce-41d2-b959-1491a265535f__r0",
      "batchId": "webhook-test-41a2a86b-b4ce-41d2-b959-1491a265535f",
      "projectId": "e7hADD1MxLpNsUrqjDcZ",
      "recipient": "+233531207256",
      "message": "Your verification code is 482931.",
      "senderId": "GABS",
      "unitsPerMessage": 1,
      "status": "submitted",
      "unitsReserved": 1,
      "unitsCharged": 1,
      "unitsReleased": 0,
      "providerMessageId": "01af5de8-0a91-4ecc-b6da-4576e2db9ff7",
      "providerError": null,
      "createdAt": "2026-09-26T14:30:00.000Z",
      "updatedAt": "2026-09-26T14:30:02.000Z"
    }
  ]
}
Response (200 OK) — idempotent replay:

If the same Idempotency-Key is used again, the original batch is returned
unchanged. Status is 200 instead of 201, but the body shape is
identical. No additional units are charged.

Batch statuses:

Status	Meaning
queued	Created, no provider call yet
submitting	Provider call in flight
submitted	Provider accepted the request
partial	Some records resolved, some still unknown
completed	All records resolved (submitted or failed)
failed	Entire batch failed (reservation failed, or provider rejected everything)
Record statuses:

Status	Meaning
queued	Waiting to be submitted
submitting	Provider call in flight for this record
submitted	Provider accepted this recipient. Delivery not yet confirmed.
delivered	Provider confirmed delivery
failed	Send definitively failed (rejected by provider)
unknown	No definitive answer. Units remain reserved until reconciliation.
released	Units returned to wallet (definitive failure)
Note on submitted vs delivered: submitted means the provider
accepted the request. It does not mean the recipient's phone received
it. Delivery confirmation arrives asynchronously via provider webhooks;
the record transitions to delivered when confirmed, or stays submitted
if confirmation never arrives.

Errors:

Code	Meaning
400	Invalid body — check message
401	Invalid API key
402	Insufficient wallet balance
403	Sender ID not approved for your project, or recipient not permitted (publishable keys)
409	Same Idempotency-Key used with a different body
429	Rate limit exceeded (publishable keys)
GET /v1/sms/batches
List recent batches for the project (newest first).

Secret keys only. Publishable keys receive 403.

Query parameters: same as /v1/wallet/transactions (limit, before).

Response (200):

json
{
  "batches": [ /* array of batch objects, same shape as above */ ],
  "count": 12,
  "nextCursor": "2026-09-20T08:15:00.000Z"
}
GET /v1/sms/batches/:batchId
Fetch one batch and all its recipient records.

Both key kinds can call this, but a project can only see its own batches.

Response (200): same shape as the POST /v1/sms/send response.

Errors: 404 if the batch doesn't exist or belongs to a different project.

Sender IDs
GET /v1/sender-ids
List all Sender ID assignments for your project.

Both key kinds can call this.

Response (200):

json
{
  "senderIds": [
    {
      "projectId": "e7hADD1MxLpNsUrqjDcZ",
      "senderId": "GABS",
      "status": "approved",
      "requestedAt": "2026-09-15T10:00:00.000Z",
      "decidedAt": "2026-09-15T14:00:00.000Z",
      "decidedByAdminUid": "MnRlXHCMc0cPUjDMl3qWvvjUHu33",
      "notes": null
    }
  ],
  "count": 1
}
Assignment statuses:

Status	Meaning
pending	Requested, awaiting admin approval
approved	Usable in POST /v1/sms/send
rejected	Request was denied. See notes for reason.
revoked	Previously approved, since withdrawn by admin
To request a new Sender ID: there is no /v1 endpoint for this.
Customers request Sender IDs from the customer platform (Messaging →
Sender IDs), which calls POST /customer/sender-ids; integrators without
a customer login ask the operator. Either way the request lands in the
admin approval queue. See docs/state.md §14 for the /customer/* surface.

Pricing (public)
GET /v1/pricing
Returns the active pricing catalog. No authentication required. Safe
to call from public pages that don't yet have a credential.

Response (200):

json
{
  "services": [
    {
      "service": "sms",
      "currency": "GHS",
      "unitPriceGhs": 0.05,
      "minPurchaseUnits": 500,
      "maxPurchaseUnits": null,
      "active": true,
      "updatedAt": "2026-09-26T14:30:00.000Z",
      "updatedBy": "system",
      "packages": [
        {
          "id": "starter-pkg-id",
          "service": "sms",
          "name": "Starter",
          "units": 500,
          "priceGhs": 20,
          "effectiveRate": 0.04,
          "description": null,
          "active": true,
          "displayOrder": 10,
          "createdAt": "2026-09-23T10:00:00.000Z",
          "updatedAt": "2026-09-23T10:00:00.000Z",
          "createdBy": "MnRl...",
          "updatedBy": "MnRl..."
        }
        /* ... more packages ... */
      ]
    }
  ]
}
Only active services and active packages are returned.

effectiveRate is computed as priceGhs / units — the per-unit cost of
that package.

Health (public)
GET /health
Uptime check. No auth.

Response (200):

json
{
  "ok": true,
  "service": "profjero-sms-api",
  "environment": "production",
  "version": "0.0.1",
  "time": "2026-09-26T14:30:00.000Z"
}
6. Webhooks (internal)
Webhook endpoints accept events from backend providers. They are not
intended for client consumption.

POST /webhooks/arkesel — delivery status events from the SMS provider

POST /webhooks/paystack — payment events from the payment provider

If your application needs to receive delivery or payment events, that
requires a client-facing webhook subscription service which is not yet
built. Contact the operator to discuss options.

7. Idempotency
POST /v1/sms/send requires an Idempotency-Key header. The header is
also supported (and recommended) on any future state-changing endpoints.

Purpose: if your client times out and retries the same logical send,
the retry doesn't create a second batch or spend a second unit.

Rules:

Same key + same body → returns the original response, no side effects

Same key + different body → 409 Conflict

Keys must be 8–120 characters

Keys are per-project; keys used by one project never collide with another's

Recommended key format: {purpose}-{uuid}, e.g.
send-sms-3a7f1c2d-.... Generate a fresh UUID per logical operation.
Reuse the same UUID only when retrying that same operation.

Do not generate a new UUID on every retry — the whole point is to
retry with the same key.

Example in Node.js:

javascript
const idempotencyKey = `send-sms-${crypto.randomUUID()}`;

async function sendWithRetry(recipients, message, senderId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_URL}/v1/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,  // ← same key on retry
        },
        body: JSON.stringify({ recipients, message, senderId }),
      });
      if (res.ok || res.status < 500) return res.json();
    } catch (err) {
      // network issue — retry with the same key
    }
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  throw new Error('Send failed after retries');
}
8. Segment counting
SMS billing is per segment, matching the GSM 03.38 standard.

Encoding	Single segment	Per segment when split
GSM-7	160 characters	153 characters
UCS-2	70 characters	67 characters
GSM-7 covers basic Latin characters plus a set of accented letters and
symbols. Some characters in GSM-7 are "extended" and count as 2 units
each: { } [ ] \ | ^ ~ €.

UCS-2 is required for any message containing a character outside
GSM-7 — including Cyrillic, Arabic, most emoji, and many symbols. When a
message contains even one such character, the entire message is billed
as UCS-2.

Emoji count as 2 UCS-2 units each (they are encoded as surrogate pairs).

Examples:

Message	Length	Encoding	Segments	Units charged
Hello world	11 chars	GSM-7	1	1
250 × A	250 chars	GSM-7	2	2
74 × a + Ж	75 code units	UCS-2	2	2
74 × a + 😀	76 code units	UCS-2	2	2
The same calculation runs on both the server (for billing) and in the
admin dashboard (for live cost preview). The implementation is shared and
lives in packages/shared/src/lib/smsSegments.ts if you need to port it.

Practical guidance: if you're sending to recipients who might receive
emoji or non-Latin text, keep messages under 67 characters to guarantee a
single UCS-2 segment. If you're certain your content is Latin-only, you
have 160 (single segment) or 153 per segment (split).

9. Changelog
Date	Change
2026-10-02	Customers can create/revoke their own secret keys in the customer platform (API & Integrations). /v1 behaviour unchanged.
2026-09-26	Initial public API reference.
2026-09-23	GET /v1/pricing added.
2026-09-21	Delivery webhooks + polling added.
2026-09-19	Segment-aware billing for GSM-7 and UCS-2.
2026-09-17	Publishable keys with rate limits and spend caps.
2026-09-15	Public v1 API released.
Appendix A — Admin API
Every capability in the admin dashboard is available over HTTP under
/admin/*. It is authenticated with a Firebase ID token (not API keys)
and requires the caller to have a role in the admins collection.

The admin API surface is internal — the operator is the only intended
consumer, through the dashboard itself. Endpoints are not documented here.
To see the full route list, read apps/api/src/routers/*.ts.

If you need to script against the admin API (e.g. for automation), open a
conversation with the operator. The routes are all there, but they're
changed more freely than the /v1/* surface, so no stability guarantee is
offered.

Appendix B — Definitions
Term	Meaning
Unit	ProfJero's internal currency. 1 unit = 1 SMS segment (when the SMS service is the target). Multi-service in the future.
Segment	One billable SMS chunk. See §8.
Project	A tenant in ProfJero Connect. Has its own wallet, API keys, Sender IDs, and settings.
Sender ID	The name recipients see on their phone (e.g. "GABS"). Must be approved before use.
Batch	One call to POST /v1/sms/send. Contains one or more records.
Record	One recipient's entry within a batch. Has its own status, unit accounting, and provider reference.
Provider	An upstream service (SMS provider, payment provider). Referenced internally as {service}_gw_{NN}. Never visible in the public API.
Reserved units	Units held for an in-flight send. Returned to available if the send fails, or charged (confirmed) if it succeeds.
Idempotency key	A client-supplied token that makes a request retry-safe. See §7.
text

---

# What's next in the docs

Three more docs are worth writing when you're ready. I'd sequence them like this:

**1. `docs/integration.md` — Getting started guide (next)**
A "read this first" for developers integrating our API. Covers: obtain an API key, choose secret vs publishable, first call, error handling, common recipes (send to one recipient, send to a list, check balance), and pointers to `api.md`. Roughly a fifth the length of `api.md`. This is what you'd hand to a client dev when they ask "how do I use your API?"

**2. `docs/examples/*.md` — Per-stack snippets (after integration.md)**
Copy-paste code for the stacks your clients actually use:
- `examples/vanilla-js.md` — plain browser + publishable key
- `examples/react-firebase.md` — React + Firebase Functions backend relay
- `examples/react-supabase.md` — same, with Supabase Edge Functions
- `examples/node-server.md` — Node/Express backend with secret key

**3. `docs/support.md` — Support guide (last)**
For your own reference and any future team member. Covers: how to handle common customer questions (why is my balance lower than I expected, why didn't my SMS arrive, how do I get a Sender ID), escalation paths, and internal runbook (how to issue refunds, how to debug a stuck batch).

---

# Verify checklist

- [ ] `docs/api.md` created at the repo root with the content above
- [ ] No factual errors (compare against what you know of the API)
- [ ] Cross-reference to `docs/state.md` works (that file exists)
- [ ] Cross-reference to `docs/customer-platform.md` works (you created that in the previous step)

Once that's saved, you have three docs a new chat can read:
1. `state.md` — technical and operational state
2. `customer-platform.md` — product brief for the next milestone
3. `api.md` — the API contract

That's a solid foundation. Ready when you are to decide whether to write `integration.md` next or jump straight into the customer platform milestone with these three in hand.