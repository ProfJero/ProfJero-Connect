import {
  firestoreBatchWrite,
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  type BatchWrite,
  type FirestoreDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  SmsBatch,
  SmsRecord,
  SmsBatchStatus,
  SmsRecordStatus,
} from '@profjero/shared';

const BATCHES = 'smsBatches';
const RECORDS = 'smsRecords';

function parseBatch(id: string, d: Record<string, unknown>): SmsBatch {
  return {
    id,
    projectId: String(d.projectId),
    apiKeyId:
      d.apiKeyId === null || d.apiKeyId === undefined
        ? null
        : String(d.apiKeyId),
    senderId: (d.senderId as string | null) ?? null,
    message: String(d.message),
    messageEncoding: (d.messageEncoding as 'GSM-7' | 'UCS-2' | null) ?? null,
    messageSegments: d.messageSegments ? Number(d.messageSegments) : null,
    status: d.status as SmsBatchStatus,
    totalRecipients: Number(d.totalRecipients ?? 0),
    totalUnitsReserved: Number(d.totalUnitsReserved ?? 0),
    totalUnitsCharged: Number(d.totalUnitsCharged ?? 0),
    totalUnitsReleased: Number(d.totalUnitsReleased ?? 0),
    submittedCount: Number(d.submittedCount ?? 0),
    failedCount: Number(d.failedCount ?? 0),
    unknownCount: Number(d.unknownCount ?? 0),
    deliveredCount: Number(d.deliveredCount ?? 0),
    idempotencyKey: (d.idempotencyKey as string | null) ?? null,
    personalized: d.personalized === true,
    campaignId: (d.campaignId as string | null) ?? null,
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
    completedAt: (d.completedAt as string | null) ?? null,
  };
}

function parseRecord(id: string, d: Record<string, unknown>): SmsRecord {
  return {
    id,
    batchId: String(d.batchId),
    projectId: String(d.projectId),
    recipient: String(d.recipient),
    message: String(d.message),
    senderId: (d.senderId as string | null) ?? null,
    unitsPerMessage: Number(d.unitsPerMessage ?? 1),
    status: d.status as SmsRecordStatus,
    unitsReserved: Number(d.unitsReserved ?? 0),
    unitsCharged: Number(d.unitsCharged ?? 0),
    unitsReleased: Number(d.unitsReleased ?? 0),
    providerMessageId: (d.providerMessageId as string | null) ?? null,
    providerError: (d.providerError as string | null) ?? null,
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
  };
}

export async function getBatch(
  env: Env,
  batchId: string,
): Promise<SmsBatch | null> {
  const doc = await firestoreGetDoc(env, BATCHES, batchId);
  return doc ? parseBatch(doc.id, doc.data) : null;
}

export async function listRecordsForBatch(
  env: Env,
  batchId: string,
): Promise<SmsRecord[]> {
  const docs = await firestoreQuery(env, RECORDS, [
    { field: 'batchId', op: 'EQUAL', value: batchId },
  ]);
  return docs.map((d) => parseRecord(d.id, d.data));
}

export interface BatchItem {
  recipient: string;
  /** This recipient's final text (personalised or the shared message). */
  message: string;
  unitsPerMessage: number;
}

export interface CreateBatchArgs {
  batchId: string;
  projectId: string;
  apiKeyId: string | null;
  senderId: string | null;
  /** The message as written (a template when personalised). */
  message: string;
  messageEncoding: 'GSM-7' | 'UCS-2';
  messageSegments: number;
  items: BatchItem[];
  idempotencyKey: string | null;
  personalized: boolean;
  campaignId: string | null;
}

export const recordIdFor = (batchId: string, index: number) => `${batchId}__r${index}`;

/**
 * Create the batch document (status "queued"), then all its records in
 * bulk commits of up to 500 writes. Creating the batch first makes it the
 * idempotency gate: a concurrent duplicate fails with ALREADY_EXISTS before
 * writing any records. Record IDs are deterministic, so a retry rewrites
 * the same documents rather than duplicating them.
 *
 * Does NOT reserve wallet units — the service does that next, in one
 * transaction that also moves the batch to "submitting".
 */
export async function createBatchWithRecords(
  env: Env,
  args: CreateBatchArgs,
): Promise<{ batch: SmsBatch; records: SmsRecord[] }> {
  const now = new Date().toISOString();
  const totalUnits = args.items.reduce((s, i) => s + i.unitsPerMessage, 0);

  const batchDoc = await firestoreCreateDoc(
    env,
    BATCHES,
    {
      projectId: args.projectId,
      apiKeyId: args.apiKeyId,
      senderId: args.senderId,
      message: args.message,
      messageEncoding: args.messageEncoding,
      messageSegments: args.messageSegments,
      status: 'queued',
      totalRecipients: args.items.length,
      totalUnitsReserved: totalUnits,
      totalUnitsCharged: 0,
      totalUnitsReleased: 0,
      submittedCount: 0,
      failedCount: 0,
      unknownCount: 0,
      deliveredCount: 0,
      idempotencyKey: args.idempotencyKey,
      personalized: args.personalized,
      campaignId: args.campaignId,
      leaseUntil: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    { docId: args.batchId },
  );

  const records: SmsRecord[] = [];
  const writes: BatchWrite[] = args.items.map((item, i) => {
    const fields = {
      batchId: args.batchId,
      projectId: args.projectId,
      recipient: item.recipient,
      message: item.message,
      senderId: args.senderId,
      unitsPerMessage: item.unitsPerMessage,
      status: 'queued',
      unitsReserved: item.unitsPerMessage,
      unitsCharged: 0,
      unitsReleased: 0,
      providerMessageId: null,
      providerError: null,
      createdAt: now,
      updatedAt: now,
    };
    records.push(parseRecord(recordIdFor(args.batchId, i), fields));
    return { path: `${RECORDS}/${recordIdFor(args.batchId, i)}`, fields };
  });
  await firestoreBatchWrite(env, writes);

  return { batch: parseBatch(batchDoc.id, batchDoc.data), records };
}

/** Batches still being delivered (for the background resume job). */
export async function listSubmittingBatches(env: Env): Promise<Array<SmsBatch & { leaseUntil: string | null }>> {
  const docs = await firestoreQuery(env, BATCHES, [{ field: 'status', op: 'EQUAL', value: 'submitting' }]);
  return docs.map((d) => ({ ...parseBatch(d.id, d.data), leaseUntil: (d.data.leaseUntil as string | null) ?? null }));
}

export async function updateBatch(
  env: Env,
  batchId: string,
  fields: Partial<Record<string, unknown>>,
): Promise<SmsBatch> {
  const doc = await firestoreUpdateDoc(env, BATCHES, batchId, {
    ...fields,
    updatedAt: new Date().toISOString(),
  });
  return parseBatch(doc.id, doc.data);
}

export async function updateRecord(
  env: Env,
  recordId: string,
  fields: Partial<Record<string, unknown>>,
): Promise<SmsRecord> {
  const doc = await firestoreUpdateDoc(env, RECORDS, recordId, {
    ...fields,
    updatedAt: new Date().toISOString(),
  });
  return parseRecord(doc.id, doc.data);
}

/**
 * Find records by providerMessageId. Single-field equality query — no
 * composite index needed. Returns all matches in case the same UUID was
 * somehow stored on multiple records.
 */
export async function findRecordsByProviderId(
  env: Env,
  providerMessageId: string,
): Promise<SmsRecord[]> {
  const docs = await firestoreQuery(env, RECORDS, [
    { field: 'providerMessageId', op: 'EQUAL', value: providerMessageId },
  ]);
  return docs.map((d) => parseRecord(d.id, d.data));
}

/**
 * Find submitted records that have a providerMessageId and haven't been
 * updated in `olderThanMinutes`. Used by the polling endpoint.
 */
export async function findSubmittedRecordsToPoll(
  env: Env,
  olderThanMinutes: number,
  limit: number,
): Promise<SmsRecord[]> {
  const docs = await firestoreQuery(env, RECORDS, [
    { field: 'status', op: 'EQUAL', value: 'submitted' },
  ]);
  const cutoff = Date.now() - olderThanMinutes * 60 * 1000;
  return docs
    .map((d) => parseRecord(d.id, d.data))
    .filter(
      (r) =>
        r.providerMessageId !== null &&
        new Date(r.updatedAt).getTime() < cutoff,
    )
    .slice(0, limit);
}

/**
 * List all batches for a project. Single-field filter on projectId — no
 * composite index needed. Sorting and pagination happen in the caller.
 */
export async function listBatchesForProject(
  env: Env,
  projectId: string,
): Promise<SmsBatch[]> {
  const docs = await firestoreQuery(env, BATCHES, [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  return docs.map((d) => parseBatch(d.id, d.data));
}