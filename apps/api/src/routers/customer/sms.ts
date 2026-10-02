import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CustomerSendSmsRequestSchema,
  type SmsBatch,
  type SmsRecord,
} from '@profjero/shared';
import { normalizePhone, isValidNormalizedPhone } from '../../lib/phone';
import { scrubProviderNames } from '../../lib/scrub';
import { DomainError } from '../../lib/domainError';
import {
  getBatch,
  listBatchesForProject,
  listRecordsForBatch,
} from '../../repositories/sms';
import { sendSmsBatch } from '../../services/sms';
import { resolveContactPhones } from '../../services/contacts';
import {
  paginateByCreatedAt,
  parseBody,
  parseLimit,
  requireIdempotencyKey,
  scopedId,
} from './helpers';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const MAX_RECIPIENTS = 1000;

/**
 * Customer-safe batch projection. `source` tells the dashboard apart from
 * API-key sends without exposing key IDs.
 */
function toCustomerBatch(b: SmsBatch) {
  return {
    id: b.id,
    source: b.apiKeyId ? ('api' as const) : ('dashboard' as const),
    senderId: b.senderId,
    message: b.message,
    messageEncoding: b.messageEncoding,
    messageSegments: b.messageSegments,
    status: b.status,
    totalRecipients: b.totalRecipients,
    totalUnitsReserved: b.totalUnitsReserved,
    totalUnitsCharged: b.totalUnitsCharged,
    totalUnitsReleased: b.totalUnitsReleased,
    submittedCount: b.submittedCount,
    deliveredCount: b.deliveredCount,
    failedCount: b.failedCount,
    unknownCount: b.unknownCount,
    createdAt: b.createdAt,
    completedAt: b.completedAt,
  };
}

function toCustomerRecord(r: SmsRecord) {
  return {
    id: r.id,
    recipient: r.recipient,
    status: r.status,
    unitsCharged: r.unitsCharged,
    unitsReleased: r.unitsReleased,
    error: scrubProviderNames(r.providerError),
    updatedAt: r.updatedAt,
  };
}

/**
 * A batch left in `queued` never reserved units or reached the network —
 * typically a send refused for insufficient balance (services/sms.ts keeps
 * it so a retry with the same key can resume). It isn't a message the
 * customer sent, so history and stats leave it out.
 */
function wasAttempted(b: SmsBatch): boolean {
  return b.status !== 'queued';
}

/**
 * POST /customer/sms/send  (Idempotency-Key required)
 *
 * Same reserve → provider → confirm/release flow as POST /v1/sms/send
 * (services/sms.ts), with recipients merged from typed numbers, contacts
 * and groups. The batch ID is derived from the project + key, so a retry
 * returns the original batch and never charges twice.
 */
router.post('/sms/send', async (c) => {
  const customer = c.get('customer')!;
  const projectId = c.get('projectId')!;
  const key = requireIdempotencyKey(c);
  const body = await parseBody(c, CustomerSendSmsRequestSchema);
  const batchId = await scopedId('cs_', projectId, key);

  // Replay before doing any work — the original request may have expanded
  // groups whose membership has since changed.
  const existing = await getBatch(c.env, batchId);
  if (existing) {
    const records = await listRecordsForBatch(c.env, batchId);
    return c.json(
      { batch: toCustomerBatch(existing), records: records.map(toCustomerRecord) },
      200,
    );
  }

  const invalid: string[] = [];
  const phones: string[] = [];
  for (const raw of body.recipients ?? []) {
    const p = normalizePhone(raw);
    if (isValidNormalizedPhone(p)) phones.push(p);
    else invalid.push(raw);
  }
  if (invalid.length > 0) {
    const sample = invalid.slice(0, 3).map((v) => `"${v}"`).join(', ');
    throw new HTTPException(400, {
      message: `${invalid.length} invalid phone number${invalid.length === 1 ? '' : 's'}: ${sample}${invalid.length > 3 ? '…' : ''}. Use the format +233XXXXXXXXX or 0XXXXXXXXX.`,
    });
  }

  phones.push(
    ...(await resolveContactPhones(
      c.env,
      projectId,
      body.contactIds ?? [],
      body.groupIds ?? [],
    )),
  );
  const recipients = [...new Set(phones)];

  if (recipients.length === 0) {
    throw new HTTPException(400, {
      message: 'No recipients — the selected contacts or groups are empty.',
    });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    throw new HTTPException(400, {
      message: `Too many recipients (${recipients.length.toLocaleString('en-US')}). The maximum per send is ${MAX_RECIPIENTS.toLocaleString('en-US')}.`,
    });
  }

  try {
    const result = await sendSmsBatch(c.env, {
      projectId,
      apiKeyId: null,
      senderId: body.senderId,
      message: body.message,
      recipients,
      idempotencyKey: batchId,
      actor: `customer:${customer.uid}`,
    });
    return c.json(
      {
        batch: toCustomerBatch(result.batch),
        records: result.records.map(toCustomerRecord),
      },
      result.replayed ? 200 : 201,
    );
  } catch (err) {
    if (err instanceof DomainError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Insufficient available units')) {
      throw new HTTPException(402, {
        message: "You don't have enough units for this send. Top up your wallet and try again.",
      });
    }
    throw err;
  }
});

/**
 * GET /customer/sms/batches?limit=&before=&status=&senderId=&source=&q=
 * Send history, newest first.
 */
router.get('/sms/batches', async (c) => {
  const projectId = c.get('projectId')!;
  const limit = parseLimit(c.req.query('limit'));
  const status = c.req.query('status');
  const senderId = c.req.query('senderId');
  const source = c.req.query('source');
  const q = (c.req.query('q') ?? '').trim().toLowerCase();

  const batches = (await listBatchesForProject(c.env, projectId))
    .filter(wasAttempted)
    .map(toCustomerBatch)
    .filter(
      (b) =>
        (!status || b.status === status) &&
        (!senderId || b.senderId === senderId) &&
        (!source || b.source === source) &&
        (!q || b.message.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const { page, nextCursor } = paginateByCreatedAt(batches, limit, c.req.query('before'));
  return c.json({ batches: page, count: page.length, nextCursor });
});

/** GET /customer/sms/batches/:id — batch + per-recipient status. */
router.get('/sms/batches/:id', async (c) => {
  const batch = await getBatch(c.env, c.req.param('id'));
  if (!batch || batch.projectId !== c.get('projectId')) {
    throw new HTTPException(404, { message: 'Message not found.' });
  }
  const records = await listRecordsForBatch(c.env, batch.id);
  records.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  return c.json({
    batch: toCustomerBatch(batch),
    records: records.map(toCustomerRecord),
  });
});

/**
 * GET /customer/sms/stats?days=30
 *
 * Aggregates for the dashboard, messaging overview and API page, computed
 * from the tenant's batches. Includes the preceding period of equal
 * length so the UI can show honest deltas, and a per-day series.
 */
router.get('/sms/stats', async (c) => {
  const projectId = c.get('projectId')!;
  const days = Math.min(Math.max(parseInt(c.req.query('days') ?? '30', 10) || 30, 1), 365);
  const now = Date.now();
  const start = new Date(now - days * 86400_000);
  start.setUTCHours(0, 0, 0, 0);
  const prevStart = new Date(start.getTime() - days * 86400_000);

  const batches = (await listBatchesForProject(c.env, projectId))
    .filter(wasAttempted)
    .map(toCustomerBatch);

  type Totals = {
    batches: number;
    messages: number;
    unitsUsed: number;
    submitted: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  const empty = (): Totals => ({
    batches: 0,
    messages: 0,
    unitsUsed: 0,
    submitted: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
  });
  const add = (t: Totals, b: ReturnType<typeof toCustomerBatch>) => {
    t.batches += 1;
    t.messages += b.totalRecipients;
    t.unitsUsed += b.totalUnitsCharged;
    t.submitted += b.submittedCount;
    t.delivered += b.deliveredCount;
    t.failed += b.failedCount;
    t.pending += b.unknownCount;
  };

  const current = empty();
  const previous = empty();
  const bySource = { api: empty(), dashboard: empty() };
  const bySender = new Map<string, number>();
  const series = new Map<string, { date: string; messages: number; units: number; failed: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86400_000).toISOString().slice(0, 10);
    series.set(d, { date: d, messages: 0, units: 0, failed: 0 });
  }

  for (const b of batches) {
    const t = new Date(b.createdAt).getTime();
    if (t >= start.getTime()) {
      add(current, b);
      add(bySource[b.source], b);
      if (b.senderId) bySender.set(b.senderId, (bySender.get(b.senderId) ?? 0) + b.totalRecipients);
      const day = series.get(b.createdAt.slice(0, 10));
      if (day) {
        day.messages += b.totalRecipients;
        day.units += b.totalUnitsCharged;
        day.failed += b.failedCount;
      }
    } else if (t >= prevStart.getTime()) {
      add(previous, b);
    }
  }

  return c.json({
    days,
    current,
    previous,
    bySource,
    topSenderIds: [...bySender.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([senderId, messages]) => ({ senderId, messages })),
    series: [...series.values()],
    lifetime: { batches: batches.length },
  });
});

export { router as customerSmsRouter };
