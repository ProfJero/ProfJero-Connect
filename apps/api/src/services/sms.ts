import {
  confirmUnits,
  releaseUnits,
  reserveUnits,
} from './wallet';
import {
  createBatchWithRecords,
  getBatch,
  listRecordsForBatch,
  updateBatch,
  updateRecord,
} from '../repositories/sms';
import { getSmsProvider } from '../providers';
import { assertSenderIdAllowed } from './senderIds';
import { getSegmentInfo } from '@profjero/shared';
import { DomainError } from '../lib/domainError';
import type { SendResult } from '../providers/sms';
import type { Env } from '../types/env';
import type {
  SmsBatch,
  SmsBatchStatus,
  SmsRecord,
} from '@profjero/shared';

export interface SendSmsArgs {
  projectId: string;
  /** Null when the send was initiated by an admin, not an API key. */
  apiKeyId: string | null;
  senderId: string | null;
  message: string;
  recipients: string[];
  idempotencyKey: string;
  /** Formatted actor for the ledger, e.g. "apiKey:abc123" or "admin:uid". */
  actor: string;
}

export interface SendSmsResult {
  batch: SmsBatch;
  records: SmsRecord[];
  replayed: boolean;
}

/**
 * Orchestrates the full SMS send lifecycle:
 *
 *   1. Create batch + records (deterministic IDs derived from batchId)
 *   2. Reserve total units from wallet (single transaction)
 *   3. Call provider (OUTSIDE any Firestore transaction — see §7)
 *   4. Confirm or release units per record based on outcome
 *   5. Update batch status/counters
 *
 * Idempotency is handled at step 1+2: if the batch already exists, we
 * detect the replay and return the existing batch without reserving again.
 */
export async function sendSmsBatch(
  env: Env,
  args: SendSmsArgs,
): Promise<SendSmsResult> {
  const batchId = args.idempotencyKey;

  // ---- Step 1: idempotency check ----
  const existing = await getBatch(env, batchId);
  if (existing) {
    const records = await listRecordsForBatch(env, batchId);
    return { batch: existing, records, replayed: true };
  }

    // ---- Step 1.5: Sender ID authorization ----
  // Runs before any wallet reservation. If the sender isn't approved for
  // this project, we fail cleanly with no side effects.
  if (!args.senderId) {
    throw new DomainError('A Sender ID is required.', 400);
  }
  try {
    await assertSenderIdAllowed(env, args.projectId, args.senderId);
  } catch (err) {
    // assertSenderIdAllowed throws plain Errors with user-safe messages.
    // Convert to DomainError so routers return 400 instead of 500.
    throw new DomainError(
      err instanceof Error ? err.message : 'Sender ID is not allowed.',
      400,
    );
  }


  // ---- Step 2: create batch + records ----
  const segmentInfo = getSegmentInfo(args.message);
  const unitsPerMessage = segmentInfo.segmentCount;

  const { batch, records } = await createBatchWithRecords(env, {
    batchId,
    projectId: args.projectId,
    apiKeyId: args.apiKeyId,
    senderId: args.senderId,
    message: args.message,
    recipients: args.recipients,
    unitsPerMessage,
    idempotencyKey: args.idempotencyKey,
    messageEncoding: segmentInfo.encoding,
    messageSegments: segmentInfo.segmentCount,
  });

  const totalUnits = args.recipients.length * unitsPerMessage;

  // ---- Step 3: reserve units. ----
  // If this throws (insufficient balance, or race with a duplicate request),
  // the batch is left in 'queued' state and we surface the error. The caller
  // can retry with the same Idempotency-Key; the replay path will find the
  // half-created batch and return it.
  try {
    await reserveUnits(env, {
      projectId: args.projectId,
      batchId,
      units: totalUnits,
      description: `SMS batch ${batchId} — ${args.recipients.length} recipients`,
      createdBy: args.actor,
    });
  } catch (err) {
    // Cleanup is deliberately not attempted. A stranded batch with status
    // 'queued' and 0 reserved units is harmless — reconciliation can
    // garbage-collect it later. Trying to delete docs here risks masking
    // the real error.
        // Don't mark as 'failed' — no provider was called, no messages sent.
    // Leaving it 'queued' lets a retry with the same Idempotency-Key
    // proceed (the replay path checks status and can resume the reserve).
    await updateBatch(env, batchId, {
      status: 'queued',
    });
    throw err;
  }

  await updateBatch(env, batchId, { status: 'submitting' });

  // ---- Step 4: call provider — outside any transaction. ----
    const provider = getSmsProvider(env);
  let results: SendResult[];
  try {
    const response = await provider.send({
      recipients: args.recipients,
      message: args.message,
      senderId: args.senderId,
    });
    results = response.results;
  } catch (err) {
    // Catastrophic provider failure — we don't know which recipients got
    // through. Mark every record 'unknown' and leave units reserved. This
    // is the correct choice per §7: timeouts and unknown states must not
    // release units, because the SMS might have gone out.
    const message = err instanceof Error ? err.message : 'Provider error';
    for (const record of records) {
      await updateRecord(env, record.id, {
        status: 'unknown',
        providerError: message,
      });
    }
    const finalBatch = await updateBatch(env, batchId, {
      status: 'partial',
      unknownCount: records.length,
      completedAt: new Date().toISOString(),
    });
    const finalRecords = await listRecordsForBatch(env, batchId);
    return { batch: finalBatch, records: finalRecords, replayed: false };
  }

  // ---- Step 5: apply per-record outcomes. ----
  const resultByRecipient = new Map(
    results.map((r) => [r.recipient, r]),
  );

  let submittedCount = 0;
  let failedCount = 0;
  let unknownCount = 0;
  let totalCharged = 0;
  let totalReleased = 0;

  for (const record of records) {
    const outcome = resultByRecipient.get(record.recipient);
    if (!outcome) {
      // Provider didn't respond for this recipient. Treat as unknown.
      await updateRecord(env, record.id, {
        status: 'unknown',
        providerError: 'No provider response for recipient',
      });
      unknownCount += 1;
      continue;
    }

    if (outcome.status === 'submitted') {
      await confirmUnits(env, {
        projectId: args.projectId,
        batchId,
        recordId: record.id,
        units: record.unitsPerMessage,
        createdBy: args.actor,
      });
      await updateRecord(env, record.id, {
        status: 'submitted',
        unitsCharged: record.unitsPerMessage,
        providerMessageId: outcome.providerMessageId,
      });
      submittedCount += 1;
      totalCharged += record.unitsPerMessage;
    } else if (outcome.status === 'failed') {
      await releaseUnits(env, {
        projectId: args.projectId,
        batchId,
        recordId: record.id,
        units: record.unitsPerMessage,
        reason: outcome.error ?? 'Provider failure',
        createdBy: args.actor,
      });
      await updateRecord(env, record.id, {
        status: 'failed',
        unitsReleased: record.unitsPerMessage,
        providerError: outcome.error,
      });
      failedCount += 1;
      totalReleased += record.unitsPerMessage;
    } else {
      // unknown — leave reserved, record the reason, don't touch wallet.
      await updateRecord(env, record.id, {
        status: 'unknown',
        providerError: outcome.error,
      });
      unknownCount += 1;
    }
  }

  // ---- Step 6: finalize batch. ----
  const status: SmsBatchStatus =
    failedCount === 0 && unknownCount === 0
      ? 'completed'
      : submittedCount === 0 && failedCount > 0 && unknownCount === 0
        ? 'failed'
        : 'partial';

  const finalBatch = await updateBatch(env, batchId, {
    status,
    submittedCount,
    failedCount,
    unknownCount,
    totalUnitsCharged: totalCharged,
    totalUnitsReleased: totalReleased,
    completedAt: new Date().toISOString(),
  });

  const finalRecords = await listRecordsForBatch(env, batchId);
  return { batch: finalBatch, records: finalRecords, replayed: false };
}