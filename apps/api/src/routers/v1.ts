import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  SendSmsResponseSchema,
  SmsBatchResponseSchema,
  V1BatchListResponseSchema,
  V1MeResponseSchema,
  V1SenderIdListResponseSchema,
  V1WalletResponseSchema,
  V1WalletTransactionListResponseSchema,
  getSegmentInfo,
} from '@profjero/shared';
import { requireApiKey, type ApiKeyVariables } from '../middleware/apiKeyAuth';
import {
  getBatch,
  listBatchesForProject,
  listRecordsForBatch,
} from '../repositories/sms';
import {
  getWalletForProject,
  listTransactions,
} from '../repositories/wallets';
import { listAssignmentsForProject } from '../repositories/senderIds';
import { getProject } from '../repositories/projects';
import { incrementApiKeySpend } from '../repositories/apiKeys';
import { sendSmsBatch } from '../services/sms';
import { composeSend } from '../services/compose';
import { getSettings } from '../services/settings';
import { cancelCampaign, getOwnCampaign, listCampaigns, saveCampaign } from '../services/campaigns';
import { listProjectPayments, priceCustomUnits, refreshPayment, toPublicPayment } from '../services/topups';
import { initiatePayment } from '../services/payments';
import { getPaymentByReference } from '../repositories/payments';
import { durableLimit } from '../lib/rateLimit';
import { normalizePhone } from '../lib/phone';
import { scopedId } from './customer/helpers';
import { z } from 'zod';
import type { Campaign } from '@profjero/shared';
import {
  assertRecipientsAllowed,
  assertWithinSpendCap,
  enforceRateLimits,
} from '../services/apiKeyEnforcement';
import { DomainError } from '../lib/domainError';
import type { Env } from '../types/env';
import {
  PricingCatalogResponseSchema,
} from '@profjero/shared';
import {
  listAllPricingSettings,
  listPackagesForService,
} from '../repositories/pricing';

/**
 * Routes under `/v1/*` that don't require an API key. The pricing catalog
 * is a public rate card — clients can render it to their end-users before
 * signing up.
 */
export const v1PublicRouter = new Hono<{ Bindings: Env }>();

v1PublicRouter.get('/pricing', async (c) => {
  const settings = await listAllPricingSettings(c.env);
  const services = [];
  for (const s of settings) {
    if (!s.active) continue;
    const packages = await listPackagesForService(c.env, s.service);
    services.push({
      ...s,
      packages: packages.filter((p) => p.active),
    });
  }
  return c.json(PricingCatalogResponseSchema.parse({ services }));
});

/**
 * GET /v1/platform — public, for pre-login pages (signup, login): name,
 * support contact and whether sign-ups are open.
 */
v1PublicRouter.get('/platform', async (c) => {
  const { getSettings } = await import('../services/settings');
  const s = await getSettings(c.env);
  return c.json({
    platformName: s.general.platformName,
    supportEmail: s.general.supportEmail,
    supportPhone: s.general.supportPhone,
    customerSignupsEnabled: s.security.customerSignupsEnabled,
  });
});

export const v1Router = new Hono<{
  Bindings: Env;
  Variables: ApiKeyVariables;
}>();

v1Router.use('*', requireApiKey);

/** /v1/sms/send body: numbers, or { phone, fields } for personalisation. */
const V1SendSmsInputSchema = z.object({
  recipients: z
    .array(
      z.union([
        z.string().min(1).max(30),
        z.object({
          phone: z.string().min(1).max(30),
          fields: z.record(z.string().min(1).max(40), z.string().max(200)).optional(),
        }),
      ]),
    )
    .min(1)
    .max(10000),
  message: z.string().min(1).max(1600),
  senderId: z.string().min(1).max(11),
  /** ISO date-time; when set, the send is scheduled instead of sent now. */
  scheduleAt: z.string().datetime().optional(),
});

// ---------- Helpers ----------

function requireSecretKey(kind: 'secret' | 'publishable'): void {
  if (kind === 'publishable') {
    throw new HTTPException(403, {
      message: 'This endpoint requires a secret API key.',
    });
  }
}

function parseLimit(
  raw: string | undefined,
  fallback: number,
  max: number,
): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

// ---------- Identity ----------

// Registered twice — `/me` is the canonical path, `/whoami` is a
// backward-compatible alias. Both use the same inline body because Hono's
// typed context doesn't play well with a shared handler reference.
v1Router.get('/me', async (c) => {
  const apiKey = c.get('apiKey');
  const project = await getProject(c.env, apiKey.projectId);
  const body = {
    projectId: apiKey.projectId,
    projectName: project?.name ?? '(unknown project)',
    keyId: apiKey.id,
    keyName: apiKey.name,
    keyKind: apiKey.kind,
    time: new Date().toISOString(),
  };
  return c.json(V1MeResponseSchema.parse(body));
});

v1Router.get('/whoami', async (c) => {
  const apiKey = c.get('apiKey');
  const project = await getProject(c.env, apiKey.projectId);
  const body = {
    projectId: apiKey.projectId,
    projectName: project?.name ?? '(unknown project)',
    keyId: apiKey.id,
    keyName: apiKey.name,
    keyKind: apiKey.kind,
    time: new Date().toISOString(),
  };
  return c.json(V1MeResponseSchema.parse(body));
});

// ---------- Wallet ----------

v1Router.get('/wallet', async (c) => {
  const apiKey = c.get('apiKey');
  const wallet = await getWalletForProject(c.env, apiKey.projectId);
  if (!wallet) {
    throw new HTTPException(404, { message: 'Wallet not found.' });
  }

  const isPublishable = apiKey.kind === 'publishable';
  const body = {
    availableUnits: wallet.availableUnits,
    reservedUnits: isPublishable ? null : wallet.reservedUnits,
    totalUnits: wallet.availableUnits + wallet.reservedUnits,
    lowBalanceThreshold: isPublishable ? null : wallet.lowBalanceThreshold,
    updatedAt: wallet.updatedAt,
  };

  return c.json(V1WalletResponseSchema.parse(body));
});

v1Router.get('/wallet/transactions', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);

  const limit = parseLimit(c.req.query('limit'), 20, 100);
  const before = c.req.query('before');

  let transactions = await listTransactions(c.env, apiKey.projectId, 500);
  // listTransactions returns newest-first already. Apply cursor.
  if (before) {
    transactions = transactions.filter((t) => t.createdAt < before);
  }
  const sliced = transactions.slice(0, limit);
  const nextCursor =
    sliced.length === limit && transactions.length > limit
      ? sliced[sliced.length - 1].createdAt
      : null;

  return c.json(
    V1WalletTransactionListResponseSchema.parse({
      transactions: sliced,
      count: sliced.length,
      nextCursor,
    }),
  );
});

// ---------- SMS batches ----------

v1Router.get('/sms/batches', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);

  const limit = parseLimit(c.req.query('limit'), 20, 100);
  const before = c.req.query('before');

  let batches = await listBatchesForProject(c.env, apiKey.projectId);
  batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (before) {
    batches = batches.filter((b) => b.createdAt < before);
  }

  const sliced = batches.slice(0, limit);
  const nextCursor =
    sliced.length === limit && batches.length > limit
      ? sliced[sliced.length - 1].createdAt
      : null;

  return c.json(
    V1BatchListResponseSchema.parse({
      batches: sliced,
      count: sliced.length,
      nextCursor,
    }),
  );
});

v1Router.get('/sms/batches/:batchId', async (c) => {
  const apiKey = c.get('apiKey');
  const batchId = c.req.param('batchId');

  const batch = await getBatch(c.env, batchId);
  if (!batch) {
    throw new HTTPException(404, { message: 'Batch not found.' });
  }
  if (batch.projectId !== apiKey.projectId) {
    // Don't leak existence of other projects' batches.
    throw new HTTPException(404, { message: 'Batch not found.' });
  }

  const records = await listRecordsForBatch(c.env, batchId);
  return c.json(SmsBatchResponseSchema.parse({ batch, records }));
});

// ---------- SMS send ----------

v1Router.post('/sms/send', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key');
  if (!idempotencyKey) {
    throw new HTTPException(400, {
      message: 'Idempotency-Key header is required.',
    });
  }
  if (idempotencyKey.length < 8 || idempotencyKey.length > 120) {
    throw new HTTPException(400, {
      message: 'Idempotency-Key must be 8-120 characters.',
    });
  }

  const body = await c.req.json().catch(() => null);
  if (body === null) {
    throw new HTTPException(400, { message: 'Body must be valid JSON.' });
  }

  const parsed = V1SendSmsInputSchema.safeParse(body);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new HTTPException(400, { message: `Validation failed — ${detail}` });
  }

  const apiKey = c.get('apiKey');
  const input = parsed.data;
  const phones = input.recipients.map((r) => (typeof r === 'string' ? r : r.phone));
  const fieldsByPhone = new Map<string, Record<string, string>>();
  for (const r of input.recipients) {
    if (typeof r !== 'string' && r.fields) fieldsByPhone.set(normalizePhone(r.phone), r.fields);
  }

  // ---- Publishable-key enforcement ----
  assertRecipientsAllowed(apiKey, phones);
  if (input.scheduleAt) requireSecretKey(apiKey.kind);

  const settings = await getSettings(c.env);
  const composed = await composeSend(c.env, apiKey.projectId, {
    message: input.message,
    recipients: phones,
    fieldsByPhone,
    maxRecipients: Math.max(settings.sms.maxRecipientsPerSend, 1000),
  });
  const requestedUnits = composed.recipients.reduce(
    (sum, r) => sum + getSegmentInfo(composed.personalized?.get(r) ?? input.message).segmentCount,
    0,
  );
  assertWithinSpendCap(apiKey, requestedUnits);
  await enforceRateLimits(c.env, apiKey, composed.recipients.length);

  // ---- Scheduled: becomes a one-time campaign ----
  if (input.scheduleAt) {
    const existing = (await listCampaigns(c.env, apiKey.projectId)).find((x) => x.name === `API ${idempotencyKey}`);
    if (existing) return c.json({ scheduled: true, campaign: toV1Campaign(existing) }, 200);
    const campaign = await saveCampaign(
      c.env,
      apiKey.projectId,
      {
        name: `API ${idempotencyKey}`,
        kind: 'once',
        senderId: input.senderId,
        message: input.message,
        recipients: composed.recipients,
        scheduledAt: input.scheduleAt,
      },
      `apiKey:${apiKey.id}`,
      undefined,
      fieldsByPhone.size ? Object.fromEntries(fieldsByPhone) : undefined,
    );
    return c.json({ scheduled: true, campaign: toV1Campaign(campaign) }, 201);
  }

  try {
    const result = await sendSmsBatch(c.env, {
      projectId: apiKey.projectId,
      apiKeyId: apiKey.id,
      senderId: input.senderId,
      message: input.message,
      recipients: composed.recipients,
      personalized: composed.personalized,
      idempotencyKey,
      actor: `apiKey:${apiKey.id}`,
    }, { background: (work) => c.executionCtx.waitUntil(work) });

    // Spend caps count units reserved at send time (delivery finishes in
    // the background; failed messages are refunded to the wallet).
    if (!result.replayed && apiKey.kind === 'publishable') {
      await incrementApiKeySpend(c.env, apiKey.id, result.batch.totalUnitsReserved);
    }

    return c.json(
      SendSmsResponseSchema.parse({
        batch: result.batch,
        records: result.records,
      }),
      result.replayed ? 200 : 201,
    );
  } catch (err) {
    if (err instanceof DomainError) {
      throw new HTTPException(
        err.status as 400 | 401 | 402 | 403 | 404 | 409 | 429,
        { message: err.message },
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Insufficient available units')) {
      throw new HTTPException(402, { message: 'Insufficient units. Top up your wallet (POST /v1/payments) and retry.' });
    }
    throw err;
  }
});

/**
 * POST /v1/sms/estimate — recipients, units and rendered samples for a
 * send, without sending or reserving anything.
 */
v1Router.post('/sms/estimate', async (c) => {
  const apiKey = c.get('apiKey');
  const body = await c.req.json().catch(() => null);
  const parsed = V1SendSmsInputSchema.omit({ senderId: true, scheduleAt: true }).safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: `Validation failed — ${parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}` });
  }
  const phones = parsed.data.recipients.map((r) => (typeof r === 'string' ? r : r.phone));
  const fieldsByPhone = new Map<string, Record<string, string>>();
  for (const r of parsed.data.recipients) if (typeof r !== 'string' && r.fields) fieldsByPhone.set(normalizePhone(r.phone), r.fields);
  const settings = await getSettings(c.env);
  const composed = await composeSend(c.env, apiKey.projectId, {
    message: parsed.data.message,
    recipients: phones,
    fieldsByPhone,
    maxRecipients: Math.max(settings.sms.maxRecipientsPerSend, 1000),
  });
  const texts = composed.recipients.map((r) => composed.personalized?.get(r) ?? parsed.data.message);
  const wallet = await getWalletForProject(c.env, apiKey.projectId);
  const units = texts.reduce((s, t) => s + getSegmentInfo(t).segmentCount, 0);
  return c.json({
    recipients: composed.recipients.length,
    units,
    availableUnits: wallet?.availableUnits ?? 0,
    sufficient: (wallet?.availableUnits ?? 0) >= units,
    personalized: !!composed.personalized,
    samples: composed.recipients.slice(0, 3).map((phone, i) => ({ phone, message: texts[i], segments: getSegmentInfo(texts[i]).segmentCount })),
  });
});

// ---------- Balance ----------

/** GET /v1/balance — the simplest balance check for integrations. */
v1Router.get('/balance', async (c) => {
  const apiKey = c.get('apiKey');
  const wallet = await getWalletForProject(c.env, apiKey.projectId);
  if (!wallet) throw new HTTPException(404, { message: 'Wallet not found.' });
  return c.json({
    availableUnits: wallet.availableUnits,
    lowBalance: wallet.lowBalanceThreshold !== null && wallet.availableUnits < wallet.lowBalanceThreshold,
    updatedAt: wallet.updatedAt,
  });
});

// ---------- Payments (top up the wallet) ----------

const V1TopupSchema = z
  .object({
    packageId: z.string().min(1).max(100).optional(),
    units: z.number().int().positive().max(10_000_000).optional(),
    /** Receipt email for the payer. Defaults to the project's contact email. */
    email: z.string().email().max(200).optional(),
    /** Where to send the payer after checkout (https only). */
    callbackUrl: z.string().url().max(500).refine((u) => u.startsWith('https://'), 'callbackUrl must use https.').optional(),
    method: z.enum(['mobile_money', 'card']).optional(),
  })
  .refine((d) => (d.packageId ? 1 : 0) + (d.units !== undefined ? 1 : 0) === 1, {
    message: 'Provide either packageId or units (not both).',
  });

/**
 * POST /v1/payments — start a top-up. Returns `checkoutUrl`: send the payer
 * there. Units are added when the payment completes (webhook), never by
 * this call. Idempotency-Key required (a retry returns the same checkout).
 */
v1Router.post('/payments', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  const key = c.req.header('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 120) {
    throw new HTTPException(400, { message: 'Idempotency-Key header is required (8-120 characters).' });
  }
  const parsed = V1TopupSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new HTTPException(400, { message: `Validation failed — ${parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}` });
  }
  const { payments: paySettings } = await getSettings(c.env);
  if (!paySettings.customerTopupsEnabled) {
    throw new HTTPException(503, { message: paySettings.topupsDisabledMessage ?? 'Top-ups are temporarily unavailable. Please try again later.' });
  }
  const project = await getProject(c.env, apiKey.projectId);
  const email = parsed.data.email ?? project?.contactEmail ?? null;
  if (!email) throw new HTTPException(400, { message: 'Provide `email` for the payment receipt.' });

  const reference = await scopedId('pja_', apiKey.projectId, key);
  if (!(await getPaymentByReference(c.env, reference))) {
    await durableLimit(c.env, `topup:${apiKey.projectId}`, 10, 60, 'checkout attempts');
  }
  const amountPesewas = parsed.data.units !== undefined ? await priceCustomUnits(c.env, parsed.data.units) : undefined;
  const base = (c.env.CUSTOMER_APP_URL ?? '').replace(/\/+$/, '');
  const result = await initiatePayment(c.env, {
    projectId: apiKey.projectId,
    customerEmail: email,
    packageId: parsed.data.packageId,
    units: parsed.data.units,
    amountPesewas,
    callbackUrl: parsed.data.callbackUrl ?? (base ? `${base}/wallet/add-funds/complete` : undefined),
    createdBy: `apiKey:${apiKey.id}`,
    reference,
    channels: parsed.data.method ? [parsed.data.method] : undefined,
  });
  return c.json({ payment: toPublicPayment(result.payment), checkoutUrl: result.authorizationUrl }, 201);
});

v1Router.get('/payments', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  const limit = parseLimit(c.req.query('limit'), 20, 100);
  const { payments, summary } = await listProjectPayments(c.env, apiKey.projectId);
  return c.json({ payments: payments.slice(0, limit), summary });
});

/** GET /v1/payments/:reference — status; re-checks pending payments with the gateway. */
v1Router.get('/payments/:reference', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  return c.json(await refreshPayment(c.env, apiKey.projectId, c.req.param('reference')));
});

// ---------- Scheduled sends (campaigns) ----------

function toV1Campaign(x: Campaign) {
  return {
    id: x.id,
    name: x.name,
    status: x.status,
    senderId: x.senderId,
    message: x.message,
    recipients: x.recipients.length,
    scheduledAt: x.scheduledAt,
    nextRunAt: x.nextRunAt,
    lastRunAt: x.lastRunAt,
    lastBatchId: x.lastBatchId,
    lastError: x.lastError,
    estimate: x.estimate,
    createdAt: x.createdAt,
  };
}

v1Router.get('/campaigns', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  return c.json({ campaigns: (await listCampaigns(c.env, apiKey.projectId)).map(toV1Campaign) });
});

v1Router.get('/campaigns/:id', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  return c.json({ campaign: toV1Campaign(await getOwnCampaign(c.env, apiKey.projectId, c.req.param('id'))) });
});

v1Router.post('/campaigns/:id/cancel', async (c) => {
  const apiKey = c.get('apiKey');
  requireSecretKey(apiKey.kind);
  return c.json({ campaign: toV1Campaign(await cancelCampaign(c.env, apiKey.projectId, c.req.param('id'))) });
});

// ---------- Sender IDs ----------

v1Router.get('/sender-ids', async (c) => {
  const apiKey = c.get('apiKey');
  const senderIds = await listAssignmentsForProject(c.env, apiKey.projectId);
  return c.json(
    V1SenderIdListResponseSchema.parse({
      senderIds,
      count: senderIds.length,
    }),
  );
});