import { firestoreQuery, firestoreGetDoc } from '../lib/firestore';
import { confirmUnits, releaseUnits } from './wallet';
import { updateBatch, updateRecord } from '../repositories/sms';
import { fetchBatchReports } from '../providers/arkeselClient';
import { mapArkeselStatus } from './deliveryStatus';
import type { Env } from '../types/env';
import type {
  ReconciliationDetail,
  ReconciliationResponse,
  SmsRecord,
} from '@profjero/shared';

const RECORDS_COLLECTION = 'smsRecords';
const DEFAULT_OLDER_THAN_MINUTES = 30;
const HARD_RELEASE_AGE_MINUTES = 7 * 24 * 60; // 7 days
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const MAX_DETAILS_IN_RESPONSE = 50;

export interface ReconcileOptions {
  olderThanMinutes?: number;
  limit?: number;
  dryRun?: boolean;
}

/**
 * Walk `unknown` SMS records and try to resolve their true outcome.
 *
 * Resolution order (per record):
 *   1. Has a provider message ID → batch-poll Arkesel for its status.
 *      - DELIVERED / SUBMITTED → confirm units, mark record.
 *      - PROHIBITED / NOT_DELIVERED / EXPIRED → release units, mark failed.
 *      - Arkesel doesn't know the ID → release units (assume it never landed).
 *   2. No provider message ID:
 *      - Under HARD_RELEASE_AGE_MINUTES → keep unknown, retry next sweep.
 *      - Over HARD_RELEASE_AGE_MINUTES → release units (can't resolve).
 *   3. Arkesel unreachable → keep unknown, retry next sweep.
 */
export async function reconcileUnknownRecords(
  env: Env,
  options: ReconcileOptions = {},
): Promise<ReconciliationResponse> {
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
  const hardReleaseMs = Date.now() - HARD_RELEASE_AGE_MINUTES * 60 * 1000;

  // Fetch candidate unknown records (over-fetch, filter by age in memory).
  const docs = await firestoreQuery(
    env,
    RECORDS_COLLECTION,
    [{ field: 'status', op: 'EQUAL', value: 'unknown' }],
    { limit: Math.min(limit * 3, MAX_LIMIT) },
  );

  const candidates: SmsRecord[] = [];
  for (const d of docs) {
    const createdAt = String(d.data.createdAt ?? '');
    if (!createdAt) continue;
    const t = new Date(createdAt).getTime();
    if (!Number.isFinite(t) || t >= cutoffMs) continue;
    candidates.push({
      id: d.id,
      batchId: String(d.data.batchId ?? ''),
      projectId: String(d.data.projectId ?? ''),
      recipient: String(d.data.recipient ?? ''),
      message: String(d.data.message ?? ''),
      senderId: (d.data.senderId as string | null) ?? null,
      unitsPerMessage: Number(d.data.unitsPerMessage ?? 1),
      status: 'unknown',
      unitsReserved: Number(d.data.unitsReserved ?? 0),
      unitsCharged: Number(d.data.unitsCharged ?? 0),
      unitsReleased: Number(d.data.unitsReleased ?? 0),
      providerMessageId:
        (d.data.providerMessageId as string | null) ?? null,
      providerError: (d.data.providerError as string | null) ?? null,
      createdAt,
      updatedAt: String(d.data.updatedAt ?? createdAt),
    });
  }

  const scanned = candidates.length;
  const slice = candidates.slice(0, limit);

  const details: ReconciliationDetail[] = [];
  let confirmed = 0;
  let released = 0;
  let keptUnknown = 0;
  let errors = 0;

  // Collect provider IDs for a single batched poll.
  const providerIds = slice
    .map((r) => r.providerMessageId)
    .filter((id): id is string => !!id);

  let reports = new Map<string, { status: string }>();
  let arkeselReachable = true;

  if (providerIds.length > 0 && env.ARKESEL_API_KEY) {
    try {
      const providerId = env.DEFAULT_SMS_PROVIDER_ID ?? 'sms_gw_01';
      const results = await fetchBatchReports(env, providerId, providerIds);
      // Normalise to the shape we need.
      reports = new Map(
        [...results.entries()].map(([id, r]) => [id, { status: r.status }]),
      );
    } catch (err) {
      console.warn('[reconcile] Arkesel poll failed:', err);
      arkeselReachable = false;
    }
  } else if (providerIds.length > 0) {
    // No API key configured — can't poll.
    arkeselReachable = false;
  }

  for (const record of slice) {
    const ageMinutes = (Date.now() - new Date(record.createdAt).getTime()) / 60000;
    const hadProviderId = !!record.providerMessageId;
    const isStale = new Date(record.createdAt).getTime() < hardReleaseMs;

    if (!record.batchId || !record.projectId) {
      errors += 1;
      details.push({
        recordId: record.id,
        batchId: record.batchId,
        projectId: record.projectId,
        recipient: record.recipient,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        hadProviderId,
        arkeselStatus: null,
        outcome: 'error',
        reason: 'Record is missing batchId or projectId.',
      });
      continue;
    }

    // ---- Resolve status via Arkesel if possible ----
    let decided: 'confirm' | 'release' | null = null;
    let arkeselStatus: string | null = null;
    let reason: string | null = null;

    if (hadProviderId) {
      const report = reports.get(record.providerMessageId!);
      if (report) {
        arkeselStatus = report.status;
        const mapped = mapArkeselStatus(report.status);
        if (mapped === 'delivered' || mapped === 'submitted') {
          decided = 'confirm';
          reason = `Arkesel reports ${report.status}.`;
        } else if (mapped === 'failed') {
          decided = 'release';
          reason = `Arkesel reports ${report.status}.`;
        }
      } else if (arkeselReachable) {
        // Arkesel answered but has no record for this UUID.
        decided = 'release';
        reason = 'Arkesel has no record for this provider message ID.';
      }
      // If !arkeselReachable, decided stays null → fall through to age check.
    }

    // ---- Fallback: if no decision yet, apply age-based policy ----
    if (decided === null) {
      if (isStale) {
        decided = 'release';
        reason = `No resolution within ${Math.floor(HARD_RELEASE_AGE_MINUTES / 60 / 24)} days.`;
      }
      // else: keep unknown, retry next sweep
    }

    // ---- Dry run preview ----
    if (dryRun) {
      if (decided === 'confirm') {
        confirmed += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'confirmed',
          reason: `[dry run] Would charge ${record.unitsReserved} unit(s). ${reason ?? ''}`.trim(),
        });
      } else if (decided === 'release') {
        released += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'released',
          reason: `[dry run] Would release ${record.unitsReserved} unit(s). ${reason ?? ''}`.trim(),
        });
      } else {
        keptUnknown += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'kept_unknown',
          reason:
            reason ??
            (hadProviderId
              ? 'Arkesel unreachable — will retry next sweep.'
              : 'Under hard-release age; will retry next sweep.'),
        });
      }
      continue;
    }

    // ---- Real execution ----
    try {
      if (decided === 'confirm') {
        if (record.unitsReserved > 0) {
          await confirmUnits(env, {
            projectId: record.projectId,
            batchId: record.batchId,
            recordId: record.id,
            units: record.unitsReserved,
            createdBy: 'system:reconciliation',
          });
        }
        await updateRecord(env, record.id, {
          status: arkeselStatus === 'DELIVERED' ? 'delivered' : 'submitted',
          unitsCharged: record.unitsReserved,
          providerError: null,
        });
        await bumpBatchCounters(env, record.batchId, {
          submittedDelta: 1,
          deliveredDelta: arkeselStatus === 'DELIVERED' ? 1 : 0,
          unknownDelta: -1,
        });
        confirmed += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'confirmed',
          reason,
        });
      } else if (decided === 'release') {
        if (record.unitsReserved > 0) {
          try {
            await releaseUnits(env, {
              projectId: record.projectId,
              batchId: record.batchId,
              recordId: record.id,
              units: record.unitsReserved,
              reason: reason ?? 'Reconciliation release',
              createdBy: 'system:reconciliation',
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // If the release ledger entry already exists, we already
            // released this record — just move on.
            if (
              !msg.includes('FAILED_PRECONDITION') &&
              !msg.includes('reservedUnits would become negative')
            ) {
              throw err;
            }
          }
        }
        await updateRecord(env, record.id, {
          status: 'failed',
          unitsReleased: record.unitsReserved,
          providerError:
            reason ?? 'Reconciled as failed by system policy.',
        });
        await bumpBatchCounters(env, record.batchId, {
          failedDelta: 1,
          releasedDelta: record.unitsReserved,
          unknownDelta: -1,
        });
        released += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'released',
          reason,
        });
      } else {
        keptUnknown += 1;
        details.push({
          recordId: record.id,
          batchId: record.batchId,
          projectId: record.projectId,
          recipient: record.recipient,
          ageMinutes: Number(ageMinutes.toFixed(1)),
          hadProviderId,
          arkeselStatus,
          outcome: 'kept_unknown',
          reason:
            reason ??
            (hadProviderId
              ? 'Arkesel unreachable — will retry next sweep.'
              : 'Under hard-release age; will retry next sweep.'),
        });
      }
    } catch (err) {
      errors += 1;
      details.push({
        recordId: record.id,
        batchId: record.batchId,
        projectId: record.projectId,
        recipient: record.recipient,
        ageMinutes: Number(ageMinutes.toFixed(1)),
        hadProviderId,
        arkeselStatus,
        outcome: 'error',
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    scanned,
    confirmed,
    released,
    keptUnknown,
    errors,
    dryRun,
    olderThanMinutes,
    details: details.slice(0, MAX_DETAILS_IN_RESPONSE),
  };
}

/**
 * Adjust the parent batch's counters for a resolved record. Read-modify-write
 * without a transaction — acceptable for reconciliation, since a small
 * under- or over-count on the batch is not correctness-critical and the
 * record-level data is authoritative.
 */
async function bumpBatchCounters(
  env: Env,
  batchId: string,
  deltas: {
    submittedDelta?: number;
    deliveredDelta?: number;
    failedDelta?: number;
    unknownDelta?: number;
    releasedDelta?: number;
  },
): Promise<void> {
  const doc = await firestoreGetDoc(env, 'smsBatches', batchId);
  if (!doc) return;

  const fields: Record<string, unknown> = {};
  if (deltas.submittedDelta) {
    fields.submittedCount = Math.max(
      0,
      Number(doc.data.submittedCount ?? 0) + deltas.submittedDelta,
    );
  }
  if (deltas.deliveredDelta) {
    fields.deliveredCount = Math.max(
      0,
      Number(doc.data.deliveredCount ?? 0) + deltas.deliveredDelta,
    );
  }
  if (deltas.failedDelta) {
    fields.failedCount = Math.max(
      0,
      Number(doc.data.failedCount ?? 0) + deltas.failedDelta,
    );
  }
  if (deltas.unknownDelta) {
    fields.unknownCount = Math.max(
      0,
      Number(doc.data.unknownCount ?? 0) + deltas.unknownDelta,
    );
  }
  if (deltas.releasedDelta) {
    fields.totalUnitsReleased =
      Number(doc.data.totalUnitsReleased ?? 0) + deltas.releasedDelta;
  }

  if (Object.keys(fields).length === 0) return;
  await updateBatch(env, batchId, fields);
}