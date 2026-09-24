import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  SendSmsInputSchema,
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

export const v1Router = new Hono<{
  Bindings: Env;
  Variables: ApiKeyVariables;
}>();

v1Router.use('*', requireApiKey);

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

  const parsed = SendSmsInputSchema.safeParse(body);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new HTTPException(400, { message: `Validation failed — ${detail}` });
  }

  const apiKey = c.get('apiKey');

  // ---- Publishable-key enforcement ----
  assertRecipientsAllowed(apiKey, parsed.data.recipients);

  const seg = getSegmentInfo(parsed.data.message);
  const requestedUnits = parsed.data.recipients.length * seg.segmentCount;
  assertWithinSpendCap(apiKey, requestedUnits);

  await enforceRateLimits(c.env, apiKey, parsed.data.recipients.length);

  try {
    const result = await sendSmsBatch(c.env, {
      projectId: apiKey.projectId,
      apiKeyId: apiKey.id,
      senderId: parsed.data.senderId ?? null,
      message: parsed.data.message,
      recipients: parsed.data.recipients,
      idempotencyKey,
      actor: `apiKey:${apiKey.id}`,
    });

    if (!result.replayed && apiKey.kind === 'publishable') {
      await incrementApiKeySpend(
        c.env,
        apiKey.id,
        result.batch.totalUnitsCharged,
      );
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
      throw new HTTPException(402, { message: msg });
    }
    if (msg.includes('already exists')) {
      const existing = await getBatch(c.env, idempotencyKey);
      if (existing) {
        const records = await listRecordsForBatch(c.env, idempotencyKey);
        return c.json(
          SendSmsResponseSchema.parse({ batch: existing, records }),
          200,
        );
      }
    }
    throw err;
  }
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