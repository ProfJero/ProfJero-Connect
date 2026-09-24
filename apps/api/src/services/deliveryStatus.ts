import { updateBatch, updateRecord } from '../repositories/sms';
import type { Env } from '../types/env';
import type { SmsRecord, SmsRecordStatus } from '@profjero/shared';

/**
 * Map Arkesel's status strings to our record statuses.
 *   DELIVERED       → delivered
 *   SUBMITTED       → submitted (no change)
 *   QUEUED          → submitted (still in flight)
 *   PROHIBITED      → failed
 *   NOT_DELIVERED   → failed
 *   EXPIRED         → failed
 * Anything unrecognised is treated as `submitted` — the conservative choice,
 * because we don't want to release units on an unknown string.
 */
export function mapArkeselStatus(arkeselStatus: string): SmsRecordStatus {
  const s = arkeselStatus.trim().toUpperCase();
  switch (s) {
    case 'DELIVERED':
      return 'delivered';
    case 'SUBMITTED':
    case 'QUEUED':
      return 'submitted';
    case 'PROHIBITED':
    case 'NOT_DELIVERED':
    case 'EXPIRED':
      return 'failed';
    default:
      return 'submitted';
  }
}

/**
 * Statuses that should never be overwritten by a later delivery update.
 * `delivered` and `failed` are terminal for delivery purposes; `released`
 * means the units were returned and there's nothing more to say.
 */
const TERMINAL: SmsRecordStatus[] = ['delivered', 'failed', 'released'];

export interface ApplyResult {
  changed: boolean;
  previousStatus: SmsRecordStatus;
  newStatus: SmsRecordStatus;
}

/**
 * Apply a new delivery status to a record. Updates the record doc, and
 * increments the batch's deliveredCount when the record becomes delivered
 * for the first time.
 *
 * Deliberately does NOT touch wallet units:
 *   - Units were already confirmed at send time (when provider said "submitted").
 *   - Delivery failures do not refund units. That's the industry standard,
 *     and matches §7's model: we charge for the send, not the receipt.
 */
export async function applyDeliveryStatus(
  env: Env,
  record: SmsRecord,
  newStatus: SmsRecordStatus,
): Promise<ApplyResult> {
  const previousStatus = record.status;

  if (TERMINAL.includes(previousStatus)) {
    return { changed: false, previousStatus, newStatus: previousStatus };
  }

  if (previousStatus === newStatus) {
    return { changed: false, previousStatus, newStatus };
  }

  await updateRecord(env, record.id, { status: newStatus });

  if (newStatus === 'delivered') {
    // Bump deliveredCount on the parent batch. Read-modify-write is fine
    // here — if two webhooks race, the worst case is under-counting by 1
    // until the next poll cycle. Not worth a transaction.
    const { firestoreGetDoc, firestoreUpdateDoc } = await import(
      '../lib/firestore'
    );
    const batchDoc = await firestoreGetDoc(env, 'smsBatches', record.batchId);
    if (batchDoc) {
      const prev = Number(batchDoc.data.deliveredCount ?? 0);
      await firestoreUpdateDoc(env, 'smsBatches', record.batchId, {
        deliveredCount: prev + 1,
      });
    }
  }

  return { changed: true, previousStatus, newStatus };
}

/**
 * Update a record by its provider message ID. Used by the webhook handler
 * when Arkesel pushes a delivery status.
 */
export async function applyDeliveryStatusByProviderId(
  env: Env,
  providerMessageId: string,
  newStatus: SmsRecordStatus,
): Promise<{ applied: number; transitions: ApplyResult[] }> {
  const { findRecordsByProviderId } = await import('../repositories/sms');
  const records = await findRecordsByProviderId(env, providerMessageId);

  const transitions: ApplyResult[] = [];
  for (const record of records) {
    transitions.push(await applyDeliveryStatus(env, record, newStatus));
  }

  return { applied: records.length, transitions };
}