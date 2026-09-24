import {
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
} from '../lib/firestore';
import { listRecordsForBatch, updateBatch, updateRecord } from '../repositories/sms';
import type { Env } from '../types/env';
import type {
  BatchCleanupDetail,
  BatchCleanupResponse,
} from '@profjero/shared';

const BATCHES = 'smsBatches';
const TXNS = 'walletTransactions';
const DEFAULT_OLDER_THAN_MINUTES = 10;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_DETAILS_IN_RESPONSE = 50;

export interface CleanupOptions {
  olderThanMinutes?: number;
  limit?: number;
  dryRun?: boolean;
}

/**
 * Find orphan `queued` batches — created but never reserved — and mark them
 * and their records as failed. No wallet interaction: the safety check is
 * that no `reserve__{batchId}` ledger entry exists. Batches that reserved
 * units but died mid-flight are left alone; they need per-record handling
 * (out of scope here).
 */
export async function cleanupOrphanBatches(
  env: Env,
  options: CleanupOptions = {},
): Promise<BatchCleanupResponse> {
  const olderThanMinutes = Math.max(
    1,
    options.olderThanMinutes ?? DEFAULT_OLDER_THAN_MINUTES,
  );
  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const dryRun = options.dryRun ?? false;
  const cutoffMs = Date.now() - olderThanMinutes * 60 * 1000;

  // Pull queued batches (single-field filter → no composite index needed).
  // Over-fetch so we can filter by age client-side.
  const docs = await firestoreQuery(
    env,
    BATCHES,
    [{ field: 'status', op: 'EQUAL', value: 'queued' }],
    { limit: Math.min(limit * 3, MAX_LIMIT) },
  );

  const scanned = docs.length;
  const details: BatchCleanupDetail[] = [];
  let cleaned = 0;
  let skipped = 0;
  let errors = 0;
  let processed = 0;

  for (const doc of docs) {
    if (processed >= limit) break;

    const batchId = doc.id;
    const projectId = String(doc.data.projectId ?? '');
    const createdAt = String(doc.data.createdAt ?? '');
    const recipients = Number(doc.data.totalRecipients ?? 0);

    if (!createdAt) {
      errors += 1;
      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked: 0,
        ageMinutes: 0,
        outcome: 'error',
        reason: 'Batch is missing createdAt.',
      });
      processed += 1;
      continue;
    }

    const createdAtMs = new Date(createdAt).getTime();
    const ageMs = Date.now() - createdAtMs;
    const ageMinutes = ageMs / 60000;

    if (createdAtMs > cutoffMs) {
      // Too young — probably a real in-flight batch. Leave it.
      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked: 0,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        outcome: 'skipped_too_young',
        reason: `Under ${olderThanMinutes} minutes old.`,
      });
      skipped += 1;
      processed += 1;
      continue;
    }

    // Safety check: if a reserve entry exists, this batch reserved units.
    // Not an orphan. Skip — leave for a future mid-flight cleanup routine.
    const reserveDoc = await firestoreGetDoc(
      env,
      TXNS,
      `reserve__${batchId}`,
    );
    if (reserveDoc) {
      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked: 0,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        outcome: 'skipped_has_reserve',
        reason: 'Reserve ledger entry exists — needs mid-flight cleanup.',
      });
      skipped += 1;
      processed += 1;
      continue;
    }

    // ----- Safe to clean up -----
    if (dryRun) {
      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked: 0,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        outcome: 'cleaned',
        reason: `[dry run] Would mark batch and up to ${recipients} records failed.`,
      });
      cleaned += 1;
      processed += 1;
      continue;
    }

    try {
      const now = new Date().toISOString();

      // Update records: only those still in `queued`. Sequential — fine for
      // typical batch sizes (<= a few hundred). If this ever becomes slow,
      // add a Firestore batch-commit primitive to lib/firestore.ts.
      const records = await listRecordsForBatch(env, batchId);
      let recordsMarked = 0;
      for (const r of records) {
        if (r.status !== 'queued') continue;
        await updateRecord(env, r.id, {
          status: 'failed',
          providerError: `Orphan batch cleaned up after ${olderThanMinutes} minutes`,
        });
        recordsMarked += 1;
      }

      await updateBatch(env, batchId, {
        status: 'failed',
        completedAt: now,
      });

      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        outcome: 'cleaned',
        reason: null,
      });
      cleaned += 1;
    } catch (err) {
      errors += 1;
      details.push({
        batchId,
        projectId,
        recipients,
        recordsMarked: 0,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        outcome: 'error',
        reason: err instanceof Error ? err.message : String(err),
      });
    }

    processed += 1;
  }

  return {
    scanned,
    cleaned,
    skipped,
    errors,
    dryRun,
    olderThanMinutes,
    details: details.slice(0, MAX_DETAILS_IN_RESPONSE),
  };
}