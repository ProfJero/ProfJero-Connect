import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireRole } from '../middleware/roles';
import {
  SmsBatchDetailResponseSchema,
  SmsBatchListResponseSchema,
  SmsBatchStatusSchema,
  ReconciliationResponseSchema,
} from '@profjero/shared';
import {
  firestoreGetDoc,
  firestoreQuery,
  type QueryFilter,
} from '../lib/firestore';
import { cleanupOrphanBatches } from '../services/batchCleanup';
import { BatchCleanupResponseSchema } from '@profjero/shared';
import {
  DeliveryTransitionSchema,
  PollStatusInputSchema,
  PollStatusResponseSchema,
} from '@profjero/shared';
import { fetchBatchReports } from '../providers/arkeselClient';
import { applyDeliveryStatus, mapArkeselStatus } from '../services/deliveryStatus';
import {
  findSubmittedRecordsToPoll,
  getBatch,
  listRecordsForBatch,
} from '../repositories/sms';
import { listProjects } from '../repositories/projects';
import { reconcileUnknownRecords } from '../services/reconciliation';
import type { AuthVariables, Env } from '../types/env';

export const adminSmsLogsRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

// --- GET /admin/sms/batches ---
adminSmsLogsRouter.get('/batches', async (c) => {
  const limitParam = c.req.query('limit');
  const limit = Math.min(
    Math.max(parseInt(limitParam ?? '50', 10) || 50, 1),
    200,
  );

  const projectId = c.req.query('projectId');
  const statusParam = c.req.query('status');

  const filters: QueryFilter[] = [];
  if (projectId) {
    filters.push({ field: 'projectId', op: 'EQUAL', value: projectId });
  }
  if (statusParam) {
    const parsed = SmsBatchStatusSchema.safeParse(statusParam);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Invalid status: "${statusParam}"`,
      });
    }
    filters.push({ field: 'status', op: 'EQUAL', value: parsed.data });
  }

  const [docs, projects] = await Promise.all([
    firestoreQuery(c.env, 'smsBatches', filters, {
      orderBy: { field: 'createdAt', direction: 'DESCENDING' },
      limit,
    }),
    listProjects(c.env, {}),
  ]);

  const projectInfo = new Map(
    projects.map((p) => [p.id, { name: p.name, status: p.status }]),
  );

    const batches = docs.map((d) => {
    const pInfo = projectInfo.get(String(d.data.projectId));
    return {
      id: d.id,
      projectId: String(d.data.projectId),
      apiKeyId:
        d.data.apiKeyId === null || d.data.apiKeyId === undefined
          ? null
          : String(d.data.apiKeyId),
      senderId: (d.data.senderId as string | null) ?? null,
      message: String(d.data.message),
      status: d.data.status as
        | 'queued'
        | 'submitting'
        | 'submitted'
        | 'partial'
        | 'completed'
        | 'failed',
      totalRecipients: Number(d.data.totalRecipients ?? 0),
      totalUnitsReserved: Number(d.data.totalUnitsReserved ?? 0),
      totalUnitsCharged: Number(d.data.totalUnitsCharged ?? 0),
      totalUnitsReleased: Number(d.data.totalUnitsReleased ?? 0),
      submittedCount: Number(d.data.submittedCount ?? 0),
      failedCount: Number(d.data.failedCount ?? 0),
      unknownCount: Number(d.data.unknownCount ?? 0),
      deliveredCount: Number(d.data.deliveredCount ?? 0),
      messageEncoding:
        d.data.messageEncoding === null || d.data.messageEncoding === undefined
          ? null
          : (d.data.messageEncoding as 'GSM-7' | 'UCS-2'),
      messageSegments:
        d.data.messageSegments === null || d.data.messageSegments === undefined
          ? null
          : Number(d.data.messageSegments),
      idempotencyKey: (d.data.idempotencyKey as string | null) ?? null,
      createdAt: String(d.data.createdAt),
      updatedAt: String(d.data.updatedAt),
      completedAt: (d.data.completedAt as string | null) ?? null,
      projectName: pInfo?.name ?? '(unknown project)',
      projectStatus: pInfo?.status ?? 'unknown',
    };
  });

  return c.json(
    SmsBatchListResponseSchema.parse({ batches, count: batches.length }),
  );
});

// --- GET /admin/sms/batches/:batchId ---
adminSmsLogsRouter.get('/batches/:batchId', async (c) => {
  const batchId = c.req.param('batchId');

  const batch = await getBatch(c.env, batchId);
  if (!batch) {
    throw new HTTPException(404, { message: 'Batch not found.' });
  }

  const [projectDoc, records] = await Promise.all([
    firestoreGetDoc(c.env, 'projects', batch.projectId),
    listRecordsForBatch(c.env, batchId),
  ]);

  return c.json(
    SmsBatchDetailResponseSchema.parse({
      batch,
      projectName: projectDoc
        ? String(projectDoc.data.name)
        : '(unknown project)',
      records,
    }),
  );
});

// --- POST /admin/sms/reconcile ---
// Manual trigger for the reconciliation sweep. In production this also
// runs via a scheduled Worker; the endpoint remains for ops to force a
// run after an incident. Requires super_admin — it moves real units.
adminSmsLogsRouter.post(
  '/reconcile',
  requireRole('super_admin'),
  async (c) => {
    const body = await c.req.json().catch(() => ({}));

    const olderThanMinutes =
      typeof body?.olderThanMinutes === 'number'
        ? Math.max(1, Math.floor(body.olderThanMinutes))
        : 30;
    const limit =
      typeof body?.limit === 'number'
        ? Math.min(Math.max(Math.floor(body.limit), 1), 500)
        : 100;
    const dryRun = body?.dryRun === true;

    const result = await reconcileUnknownRecords(c.env, {
      olderThanMinutes,
      limit,
      dryRun,
    });

    return c.json(ReconciliationResponseSchema.parse(result));
  },
);

// --- POST /admin/sms/cleanup-orphans ---
// Manual trigger for orphan queued batches. Requires super_admin: it marks
// data failed, though it never touches wallets (nothing was reserved).
adminSmsLogsRouter.post(
  '/cleanup-orphans',
  requireRole('super_admin'),
  async (c) => {
    const body = await c.req.json().catch(() => ({}));

    const olderThanMinutes =
      typeof body?.olderThanMinutes === 'number'
        ? Math.max(1, Math.floor(body.olderThanMinutes))
        : 10;
    const limit =
      typeof body?.limit === 'number'
        ? Math.min(Math.max(Math.floor(body.limit), 1), 200)
        : 50;
    const dryRun = body?.dryRun === true;

    const result = await cleanupOrphanBatches(c.env, {
      olderThanMinutes,
      limit,
      dryRun,
    });

    return c.json(BatchCleanupResponseSchema.parse(result));
  },
);

// --- POST /admin/sms/poll-status ---
// Manually poll Arkesel for delivery status on submitted records.
adminSmsLogsRouter.post(
  '/poll-status',
  requireRole('super_admin', 'admin'),
  async (c) => {
    if (!c.env.ARKESEL_API_KEY) {
      throw new HTTPException(500, {
        message: 'ARKESEL_API_KEY is not configured.',
      });
    }

    const body = await c.req.json().catch(() => ({}));
    const parsed = PollStatusInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message:
          parsed.error.issues[0]?.message ?? 'Invalid poll request body.',
      });
    }

    // Gather target records.
    let records: Awaited<ReturnType<typeof findSubmittedRecordsToPoll>> = [];
    if (parsed.data.recordIds && parsed.data.recordIds.length > 0) {
      const { firestoreGetDoc } = await import('../lib/firestore');
      for (const id of parsed.data.recordIds) {
        const doc = await firestoreGetDoc(c.env, 'smsRecords', id);
        if (!doc) continue;
        const r = {
          id: doc.id,
          batchId: String(doc.data.batchId),
          projectId: String(doc.data.projectId),
          recipient: String(doc.data.recipient),
          message: String(doc.data.message),
          senderId: (doc.data.senderId as string | null) ?? null,
          unitsPerMessage: Number(doc.data.unitsPerMessage ?? 1),
          status: doc.data.status as
            | 'queued'
            | 'submitting'
            | 'submitted'
            | 'delivered'
            | 'failed'
            | 'unknown'
            | 'released',
          unitsReserved: Number(doc.data.unitsReserved ?? 0),
          unitsCharged: Number(doc.data.unitsCharged ?? 0),
          unitsReleased: Number(doc.data.unitsReleased ?? 0),
          providerMessageId:
            (doc.data.providerMessageId as string | null) ?? null,
          providerError: (doc.data.providerError as string | null) ?? null,
          createdAt: String(doc.data.createdAt),
          updatedAt: String(doc.data.updatedAt),
        };
        records.push(r);
      }
    } else {
      const olderThanMinutes = parsed.data.olderThanMinutes ?? 2;
      const limit = parsed.data.limit ?? 100;
      records = await findSubmittedRecordsToPoll(
        c.env,
        olderThanMinutes,
        limit,
      );
    }

    if (records.length === 0) {
      return c.json(
        PollStatusResponseSchema.parse({
          polled: 0,
          updated: 0,
          unchanged: 0,
          notFound: 0,
          errors: 0,
          details: [],
        }),
      );
    }

    // Collect message IDs (skip nulls; those records can't be polled).
    const messageIds = records
      .map((r) => r.providerMessageId)
      .filter((id): id is string => id !== null);

    const reports = await fetchBatchReports(c.env, messageIds);

    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let errors = 0;
    const details: Array<{
      recordId: string;
      batchId: string;
      providerMessageId: string;
      previousStatus:
        | 'queued'
        | 'submitting'
        | 'submitted'
        | 'delivered'
        | 'failed'
        | 'unknown'
        | 'released';
      newStatus:
        | 'queued'
        | 'submitting'
        | 'submitted'
        | 'delivered'
        | 'failed'
        | 'unknown'
        | 'released';
      changed: boolean;
    }> = [];

    for (const record of records) {
      if (!record.providerMessageId) {
        notFound += 1;
        continue;
      }
      const report = reports.get(record.providerMessageId);
      if (!report) {
        notFound += 1;
        continue;
      }
      try {
        const newStatus = mapArkeselStatus(report.status);
        const result = await applyDeliveryStatus(c.env, record, newStatus);
        if (result.changed) updated += 1;
        else unchanged += 1;
        details.push(
          DeliveryTransitionSchema.parse({
            recordId: record.id,
            batchId: record.batchId,
            providerMessageId: record.providerMessageId,
            previousStatus: result.previousStatus,
            newStatus: result.newStatus,
            changed: result.changed,
          }),
        );
      } catch (err) {
        errors += 1;
        console.error('[poll-status] record update failed:', err);
      }
    }

    return c.json(
      PollStatusResponseSchema.parse({
        polled: records.length,
        updated,
        unchanged,
        notFound,
        errors,
        details: details.slice(0, 50),
      }),
    );
  },
);