import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
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

export interface CreateBatchArgs {
  batchId: string;
  projectId: string;
  apiKeyId: string | null;
  senderId: string | null;
  message: string;
  messageEncoding: 'GSM-7' | 'UCS-2';
  messageSegments: number;
  recipients: string[];
  unitsPerMessage: number;
  idempotencyKey: string | null;
}

/**
 * Create the batch document plus one record per recipient, then update the
 * batch counts. Uses deterministic record IDs so retries don't duplicate.
 *
 * Note: does NOT reserve wallet units — that happens in the service, after
 * the docs are in place, inside a single transaction.
 */
export async function createBatchWithRecords(
  env: Env,
  args: CreateBatchArgs,
): Promise<{ batch: SmsBatch; records: SmsRecord[] }> {
  const now = new Date().toISOString();
  const totalUnits = args.recipients.length * args.unitsPerMessage;

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
      totalRecipients: args.recipients.length,
      totalUnitsReserved: totalUnits,
      totalUnitsCharged: 0,
      totalUnitsReleased: 0,
      submittedCount: 0,
      failedCount: 0,
      unknownCount: 0,
      deliveredCount: 0,
      idempotencyKey: args.idempotencyKey,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    },
    { docId: args.batchId },
  );

  const records: SmsRecord[] = [];
  for (let i = 0; i < args.recipients.length; i++) {
    const recordId = `${args.batchId}__r${i}`;
    const doc = await firestoreCreateDoc(
      env,
      RECORDS,
      {
        batchId: args.batchId,
        projectId: args.projectId,
        recipient: args.recipients[i],
        message: args.message,
        senderId: args.senderId,
        unitsPerMessage: args.unitsPerMessage,
        status: 'queued',
        unitsReserved: args.unitsPerMessage,
        unitsCharged: 0,
        unitsReleased: 0,
        providerMessageId: null,
        providerError: null,
        createdAt: now,
        updatedAt: now,
      },
      { docId: recordId },
    );
    records.push(parseRecord(doc.id, doc.data));
  }

  return { batch: parseBatch(batchDoc.id, batchDoc.data), records };
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