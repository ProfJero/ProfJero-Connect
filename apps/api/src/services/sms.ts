import { applyLedgerEntries, ensureWallet } from './wallet';
import {
  createBatchWithRecords,
  getBatch,
  listRecordsForBatch,
  listSubmittingBatches,
  updateBatch,
  type BatchItem,
} from '../repositories/sms';
import { getSmsProvider } from '../providers';
import { getProject } from '../repositories/projects';
import { assertSenderIdAllowed } from './senderIds';
import { getSegmentInfo } from '@profjero/shared';
import { DomainError } from '../lib/domainError';
import { firestoreBatchWrite, firestoreGetDoc, runTransaction, type FirestoreWrite } from '../lib/firestore';
import { notifyProject } from './notifications';
import type { SendResult } from '../providers/sms';
import type { Env } from '../types/env';
import type { SmsBatch, SmsBatchStatus, SmsRecord } from '@profjero/shared';

export interface SendSmsArgs {
  projectId: string;
  /** Null when the send was initiated by an admin or the customer app. */
  apiKeyId: string | null;
  senderId: string | null;
  /** The message as written. With `personalized`, a template. */
  message: string;
  recipients: string[];
  /**
   * Per-recipient final text for personalised sends (phone → text). Every
   * recipient must have an entry. Absent → everyone gets `message`.
   */
  personalized?: Map<string, string>;
  idempotencyKey: string;
  /** Formatted actor for the ledger, e.g. "apiKey:abc123" or "admin:uid". */
  actor: string;
  campaignId?: string | null;
}

export interface SendSmsResult {
  batch: SmsBatch;
  records: SmsRecord[];
  replayed: boolean;
}

export interface SendOptions {
  /**
   * Run delivery after the response (Workers `ctx.waitUntil`). Without it,
   * delivery runs inline before returning (cron jobs, scripts).
   */
  background?: (work: Promise<unknown>) => void;
}

/** How long one worker may hold a batch before another may resume it. */
const LEASE_MS = 90_000;
/** Recipients per provider call + settlement commit (≤ 500 writes). */
const CHUNK = 200;
/** Stop starting new chunks after this long; the resume job continues. */
const TIME_BUDGET_MS = 20_000;

/**
 * Send an SMS batch. Two phases:
 *
 *  1. Now (fast, a handful of database round-trips whatever the size):
 *     idempotency check, project + Sender ID checks, create the batch and
 *     its records in bulk, and reserve every unit in one transaction that
 *     also moves the batch to "submitting". The caller can respond here.
 *
 *  2. Delivery (in the background when `background` is given): records go
 *     to the provider in chunks; each chunk's outcomes — records, confirm
 *     and release ledger entries, wallet — commit in ONE transaction. If the
 *     worker dies, `resumeStalledBatches` (every minute) picks the batch up:
 *     unsent records are sent, records that were mid-flight become
 *     "unknown" (units stay held for reconciliation — never sent twice).
 */
export async function sendSmsBatch(
  env: Env,
  args: SendSmsArgs,
  options: SendOptions = {},
): Promise<SendSmsResult> {
  const batchId = args.idempotencyKey;

  // ---- Idempotency ----
  const existing = await getBatch(env, batchId);
  if (existing) {
    const records = await listRecordsForBatch(env, batchId);
    // api.md §7: same key + different body → 409. Recipients are compared
    // as a set; only when the record count matches (a crashed first attempt
    // may have written fewer).
    const sameRecipients =
      records.length !== existing.totalRecipients ||
      sameSet(records.map((r) => r.recipient), args.recipients);
    if (
      existing.projectId !== args.projectId ||
      existing.message !== args.message ||
      existing.senderId !== args.senderId ||
      !sameRecipients
    ) {
      throw new DomainError('This Idempotency-Key was already used with a different request.', 409);
    }
    return { batch: existing, records, replayed: true };
  }

  // ---- The project must be allowed to send ----
  // Suspending a project in the admin dashboard has to stop sending from
  // every surface (API keys, customer app, admin), not just hide it.
  const project = await getProject(env, args.projectId);
  if (!project) throw new DomainError('Project not found.', 404);
  if (project.status !== 'active') {
    throw new DomainError(`This project is ${project.status}; sending is disabled. Contact support.`, 403);
  }

  // ---- Sender ID authorization (before any units move) ----
  if (!args.senderId) throw new DomainError('A Sender ID is required.', 400);
  try {
    await assertSenderIdAllowed(env, args.projectId, args.senderId);
  } catch (err) {
    throw new DomainError(err instanceof Error ? err.message : 'Sender ID is not allowed.', 400);
  }

  // ---- Per-recipient text and billing ----
  const items: BatchItem[] = args.recipients.map((recipient) => {
    const text = args.personalized ? args.personalized.get(recipient) : args.message;
    if (text === undefined) throw new DomainError(`No personalised message for ${recipient}.`, 400);
    if (!text.trim()) throw new DomainError(`The message for ${recipient} is empty after personalisation.`, 400);
    return { recipient, message: text, unitsPerMessage: getSegmentInfo(text).segmentCount };
  });
  const totalUnits = items.reduce((s, i) => s + i.unitsPerMessage, 0);
  const segmentInfo = getSegmentInfo(args.message);

  // ---- Create batch + records ----
  let created: Awaited<ReturnType<typeof createBatchWithRecords>>;
  try {
    created = await createBatchWithRecords(env, {
      batchId,
      projectId: args.projectId,
      apiKeyId: args.apiKeyId,
      senderId: args.senderId,
      message: args.message,
      messageEncoding: segmentInfo.encoding,
      messageSegments: segmentInfo.segmentCount,
      items,
      idempotencyKey: args.idempotencyKey,
      personalized: !!args.personalized,
      campaignId: args.campaignId ?? null,
    });
  } catch (err) {
    // A concurrent request with the same key created the batch between our
    // check and this create. That request owns the send; this is a replay.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('(409)') || msg.includes('ALREADY_EXISTS')) {
      const winner = await getBatch(env, batchId);
      if (winner) {
        if (winner.projectId !== args.projectId || winner.message !== args.message || winner.senderId !== args.senderId) {
          throw new DomainError('This Idempotency-Key was already used with a different request.', 409);
        }
        return { batch: winner, records: await listRecordsForBatch(env, batchId), replayed: true };
      }
    }
    throw err;
  }

  // ---- Reserve every unit + start delivery, atomically ----
  // Insufficient balance throws and leaves the batch "queued" with nothing
  // reserved (harmless; the orphan cleanup removes it).
  await ensureWallet(env, args.projectId);
  const now = new Date();
  const reserved = await applyLedgerEntries(env, {
    projectId: args.projectId,
    requireAvailableAtLeast: totalUnits,
    entries: [
      {
        txnId: `reserve__${batchId}`,
        type: 'reserve',
        availableDelta: -totalUnits,
        reservedDelta: totalUnits,
        batchId,
        description: `SMS batch ${batchId} — ${items.length} recipient${items.length === 1 ? '' : 's'}`,
        createdBy: args.actor,
      },
    ],
    extraWrites: [
      {
        path: `smsBatches/${batchId}`,
        fields: { status: 'submitting', leaseUntil: new Date(now.getTime() + LEASE_MS).toISOString(), actor: args.actor, updatedAt: now.toISOString() },
        updateFieldPaths: ['status', 'leaseUntil', 'actor', 'updatedAt'],
        precondition: { exists: true },
      },
    ],
  });

  await maybeNotifyLowBalance(env, args.projectId, batchId, {
    wallet: reserved.wallet,
    transaction: reserved.transactions[0],
  });

  const batch: SmsBatch = { ...created.batch, status: 'submitting', updatedAt: now.toISOString() };

  if (options.background) {
    options.background(
      deliverBatch(env, batchId, args.actor).catch((err) =>
        console.error(`[sms] background delivery of ${batchId} stopped; the resume job will continue it:`, err),
      ),
    );
    return { batch, records: created.records, replayed: false };
  }

  await deliverBatch(env, batchId, args.actor);
  return {
    batch: (await getBatch(env, batchId)) ?? batch,
    records: await listRecordsForBatch(env, batchId),
    replayed: false,
  };
}

/**
 * Deliver a "submitting" batch: send unsent records in chunks, settling
 * each chunk atomically, then finalise. Safe to call again for the same
 * batch (resume): it only sends records still "queued".
 */
export async function deliverBatch(env: Env, batchId: string, actor: string): Promise<void> {
  const started = Date.now();
  const batch = await getBatch(env, batchId);
  if (!batch || batch.status !== 'submitting') return;

  let records = await listRecordsForBatch(env, batchId);

  // Records a crashed attempt handed to the provider without settling: we
  // can't know whether they went out, so they become "unknown" (units stay
  // reserved; reconciliation / delivery reports decide).
  const inFlight = records.filter((r) => r.status === 'submitting');
  if (inFlight.length > 0) {
    await settleChunk(env, batch, inFlight, new Map(), actor, 'Delivery was interrupted; outcome unknown.');
  }

  const provider = getSmsProvider(env);
  let pending = records.filter((r) => r.status === 'queued');
  let chunkNo = 0;
  while (pending.length > 0) {
    if (Date.now() - started > TIME_BUDGET_MS) return; // resume job continues
    const chunk = pending.slice(0, CHUNK);
    pending = pending.slice(CHUNK);
    chunkNo += 1;

    // Mark in-flight and renew the lease before talking to the provider.
    const now = new Date().toISOString();
    await firestoreBatchWrite(env, [
      ...chunk.map<FirestoreWrite>((r) => ({
        path: `smsRecords/${r.id}`,
        fields: { status: 'submitting', updatedAt: now },
        updateFieldPaths: ['status', 'updatedAt'],
      })),
      {
        path: `smsBatches/${batchId}`,
        fields: { leaseUntil: new Date(Date.now() + LEASE_MS).toISOString(), updatedAt: now },
        updateFieldPaths: ['leaseUntil', 'updatedAt'],
      },
    ]);

    // One provider call per distinct text (personalised chunks have many).
    const outcomes = new Map<string, SendResult>();
    let catastrophic: string | null = null;
    const byText = new Map<string, string[]>();
    for (const r of chunk) byText.set(r.message, [...(byText.get(r.message) ?? []), r.recipient]);
    for (const [text, recipients] of byText) {
      try {
        const res = await provider.send({ recipients, message: text, senderId: batch.senderId });
        for (const o of res.results) outcomes.set(o.recipient, o);
      } catch (err) {
        // We don't know which of these went out: unknown, units held.
        catastrophic = err instanceof Error ? err.message : 'Provider error';
      }
    }
    await settleChunk(env, batch, chunk, outcomes, actor, catastrophic ?? 'No provider response for recipient', chunkNo);
  }

  records = await listRecordsForBatch(env, batchId);
  if (records.some((r) => r.status === 'queued' || r.status === 'submitting')) return;
  await finalizeBatch(env, batch, records);
}

/**
 * Settle one chunk: confirm submitted units, release failed units, leave
 * unknown units reserved — wallet, two ledger entries and every record
 * update in one transaction. Ledger IDs are per (batch, chunk, attempt
 * marker) and created with exists:false, so a retry can't double-apply.
 */
async function settleChunk(
  env: Env,
  batch: SmsBatch,
  chunk: SmsRecord[],
  outcomes: Map<string, SendResult>,
  actor: string,
  missingReason: string,
  chunkNo?: number,
): Promise<void> {
  const now = new Date().toISOString();
  let confirm = 0;
  let release = 0;
  const writes: FirestoreWrite[] = [];
  for (const r of chunk) {
    const o = outcomes.get(r.recipient);
    let fields: Record<string, unknown>;
    if (o?.status === 'submitted') {
      confirm += r.unitsPerMessage;
      fields = { status: 'submitted', unitsCharged: r.unitsPerMessage, providerMessageId: o.providerMessageId, providerError: null };
    } else if (o?.status === 'failed') {
      release += r.unitsPerMessage;
      fields = { status: 'failed', unitsReleased: r.unitsPerMessage, providerError: o.error ?? 'Provider failure' };
    } else {
      fields = { status: 'unknown', providerMessageId: o?.providerMessageId ?? null, providerError: o?.error ?? missingReason };
    }
    fields.updatedAt = now;
    writes.push({
      path: `smsRecords/${r.id}`,
      fields,
      updateFieldPaths: Object.keys(fields),
      precondition: { exists: true },
    });
  }
  // Records already settled by a concurrent attempt must not be settled
  // again: the deterministic ledger IDs (first record id in the chunk)
  // make the second commit abort.
  const tag = chunkNo !== undefined ? `c${chunk[0].id.split('__r').pop()}` : `x${chunk[0].id.split('__r').pop()}`;
  const entries = [];
  if (confirm > 0) {
    entries.push({
      txnId: `confirm__${batch.id}__${tag}`,
      type: 'confirm' as const,
      availableDelta: 0,
      reservedDelta: -confirm,
      batchId: batch.id,
      description: `Sent ${chunk.filter((r) => outcomes.get(r.recipient)?.status === 'submitted').length} message(s)`,
      createdBy: actor,
    });
  }
  if (release > 0) {
    entries.push({
      txnId: `release__${batch.id}__${tag}`,
      type: 'release' as const,
      availableDelta: release,
      reservedDelta: -release,
      batchId: batch.id,
      description: `Returned units for ${chunk.filter((r) => outcomes.get(r.recipient)?.status === 'failed').length} failed message(s)`,
      createdBy: actor,
    });
  }
  if (entries.length === 0) {
    // Nothing moves money (all unknown): just record the outcomes.
    await firestoreBatchWrite(env, writes);
    return;
  }
  try {
    await applyLedgerEntries(env, { projectId: batch.projectId, entries, extraWrites: writes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Already settled by another attempt — fine.
    if (msg.includes('ALREADY_EXISTS') || msg.includes('FAILED_PRECONDITION') || msg.includes('(409)')) return;
    throw err;
  }
}

/** Compute final counters from the records and close the batch. */
async function finalizeBatch(env: Env, batch: SmsBatch, records: SmsRecord[]): Promise<SmsBatch> {
  const count = (s: string) => records.filter((r) => r.status === s).length;
  const submittedCount = records.filter((r) => ['submitted', 'delivered'].includes(r.status)).length;
  const failedCount = count('failed');
  const unknownCount = count('unknown');
  const status: SmsBatchStatus =
    failedCount === 0 && unknownCount === 0
      ? 'completed'
      : submittedCount === 0 && failedCount > 0 && unknownCount === 0
        ? 'failed'
        : 'partial';
  const finalBatch = await updateBatch(env, batch.id, {
    status,
    submittedCount,
    failedCount,
    unknownCount,
    totalUnitsCharged: records.reduce((s, r) => s + r.unitsCharged, 0),
    totalUnitsReleased: records.reduce((s, r) => s + r.unitsReleased, 0),
    leaseUntil: null,
    completedAt: new Date().toISOString(),
  });

  if (failedCount > 0) {
    await notifyProject(env, {
      projectId: batch.projectId,
      id: `sms__${batch.id}`,
      type: 'sms',
      severity: submittedCount === 0 ? 'error' : 'warning',
      title: submittedCount === 0 ? 'SMS could not be sent' : `${failedCount} of ${records.length} messages failed`,
      body: `${failedCount} recipient${failedCount === 1 ? '' : 's'} could not be reached from Sender ID "${batch.senderId}". Units for failed messages have been returned to your wallet.`,
      link: `/messaging/history/${encodeURIComponent(batch.id)}`,
    });
  }
  return finalBatch;
}

/**
 * Every minute: continue batches whose worker stopped (lease expired) —
 * Workers can end background work early, and big batches outlast one
 * request's time budget by design.
 */
export async function resumeStalledBatches(env: Env): Promise<{ resumed: number }> {
  const batches = await listSubmittingBatches(env);
  let resumed = 0;
  for (const b of batches) {
    if (b.leaseUntil && new Date(b.leaseUntil).getTime() > Date.now()) continue;
    // Claim it: only one resumer wins (updateTime precondition).
    const claimed = await runTransaction(env, async (txn) => {
      const doc = await txn.get('smsBatches', b.id);
      if (!doc || doc.data.status !== 'submitting') return false;
      const lease = doc.data.leaseUntil as string | null;
      if (lease && new Date(lease).getTime() > Date.now()) return false;
      txn.write({
        path: `smsBatches/${b.id}`,
        fields: { leaseUntil: new Date(Date.now() + LEASE_MS).toISOString() },
        updateFieldPaths: ['leaseUntil'],
        precondition: { updateTime: doc.updateTime },
      });
      return true;
    });
    if (!claimed) continue;
    const doc = await firestoreGetDoc(env, 'smsBatches', b.id);
    await deliverBatch(env, b.id, String(doc?.data.actor ?? 'system:resume'));
    resumed += 1;
  }
  return { resumed };
}

/**
 * Fire a low-balance alert when this reservation moved the wallet from at
 * or above its threshold to below it. Firing only on the crossing (not on
 * every send while low) keeps the alert meaningful. No threshold set → no
 * alerts.
 */
async function maybeNotifyLowBalance(
  env: Env,
  projectId: string,
  batchId: string,
  reserved: { wallet: { lowBalanceThreshold: number | null }; transaction: { availableAfter: number; availableDelta: number } },
): Promise<void> {
  const threshold = reserved.wallet.lowBalanceThreshold;
  if (threshold === null) return;
  const after = reserved.transaction.availableAfter;
  const before = after - reserved.transaction.availableDelta;
  if (!(before >= threshold && after < threshold)) return;

  await notifyProject(env, {
    projectId,
    id: `low_balance__${batchId}`,
    type: 'low_balance',
    severity: 'warning',
    title: 'Your wallet balance is low',
    body: `You have ${after.toLocaleString('en-US')} units left, below your alert level of ${threshold.toLocaleString('en-US')}. Top up to keep your messages flowing.`,
    link: '/wallet/add-funds',
    email: true,
  });
}

function sameSet(a: string[], b: string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}
