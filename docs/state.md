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

**Status:** Frontend screens for v1 are complete (8 admin screens, mocked).
Backend, Firebase, and real integrations are not yet implemented.

---

## 2. Current status (at a glance)

| Area | Status |
|---|---|
| Admin dashboard (frontend, mocked) | ✅ Done, desktop + mobile |
| Responsive shell (mobile drawer) | ✅ Done |
| Send SMS screen | ⏳ Next — HTML provided, to build |
| Project Details screen (standalone page) | ⏳ Pending |
| Backend (`apps/api`, Cloudflare Workers + Hono) | ❌ Not started |
| Firebase Auth + Firestore | ❌ Not started |
| Arkesel integration | ❌ Not started |
| Paystack integration | ❌ Not started |
| Wallet ledger logic | ❌ Not started |

---

## 3. Repository structure
