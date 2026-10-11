import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  ProviderIdSchema,
  ProviderListResponseSchema,
  ProviderRequestListResponseSchema,
  ProviderResponseSchema,
  UpdateProviderInputSchema,
  SetBundleAvailabilityInputSchema,
  SetBundlePriceInputSchema,
  UpdateBundleInputSchema,
  SetGlobalMarkupInputSchema,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  createProvider,
  getProviderRecord,
  listProviderRecords,
  toPublicProvider,
  updateProvider,
} from '../repositories/providers';
import { listRecentProviderRequests } from '../repositories/providerRequests';
import { fetchBalance } from '../providers/arkeselClient';
import { elitedata, EliteDataError } from '../providers/elitedataClient';
import { syncBundlesFromProvider } from '../services/dataService';
import {
  getBundle,
  listAllBundles,
  setBundleAvailability,
  setBundleSellPrice,
  updateBundleFields,
  deleteBundle,
  applyGlobalMarkup,
} from '../repositories/dataBundles';
import type { AuthVariables, Env } from '../types/env';

export const adminProvidersRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function parseId(raw: string): string {
  const parsed = ProviderIdSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HTTPException(400, { message: `Invalid provider ID.` });
  }
  return parsed.data;
}

/**
 * Wrap provider errors in a 502 so the admin UI can show a consistent
 * "provider unreachable" message. EliteData-specific errors carry the
 * upstream status and message.
 */
function providerErrorResponse(err: unknown): never {
  if (err instanceof EliteDataError) {
    console.error(`[admin/data] EliteData ${err.status}: ${err.providerMessage}`);
    throw new HTTPException(502, {
      message: `EliteData rejected the request: ${err.providerMessage}`,
    });
  }
  console.error('[admin/data] unexpected error:', err);
  throw new HTTPException(500, {
    message: err instanceof Error ? err.message : 'Unexpected error.',
  });
}

// ─────────────────────────────────────────────────────────────────────
// Standard provider routes (admin CRUD + Arkesel balance + request log)
// ─────────────────────────────────────────────────────────────────────

// --- GET /admin/providers ---
adminProvidersRouter.get('/', async (c) => {
  const records = await listProviderRecords(c.env);
  const providers = records.map(toPublicProvider);
  return c.json(
    ProviderListResponseSchema.parse({
      providers,
      count: providers.length,
    }),
  );
});

// --- POST /admin/providers/bootstrap ---
// Idempotent. Creates sms_gw_01 for Arkesel if it doesn't exist. Admin
// then configures costPerUnitGhs via PUT.
adminProvidersRouter.post(
  '/bootstrap',
  requireRole('super_admin'),
  async (c) => {
    const existing = await getProviderRecord(c.env, 'sms_gw_01');
    if (existing) {
      return c.json(
        ProviderResponseSchema.parse({
          provider: toPublicProvider(existing),
        }),
      );
    }
    const admin = c.get('admin');
    const record = await createProvider(
      c.env,
      {
        id: 'sms_gw_01',
        service: 'sms',
        label: 'SMS Gateway 01',
        driver: 'arkesel',
        status: 'active',
      },
      admin.uid,
    );
    return c.json(
      ProviderResponseSchema.parse({ provider: toPublicProvider(record) }),
      201,
    );
  },
);

// ─────────────────────────────────────────────────────────────────────
// Data bundle admin routes (EliteData driver)
//
// These live under /data/* so they don't collide with the wildcard
// /:providerId routes below. Hono matches in registration order, and
// "/data/balance" would otherwise be interpreted as providerId="data"
// with an unmatched sub-path.
// ─────────────────────────────────────────────────────────────────────

// --- GET /admin/providers/data/balance ---
// Fetches the current EliteData wallet balance. Doesn't require a
// providers/data_gw_01 record — the driver talks directly to EliteData.
adminProvidersRouter.get(
  '/data/balance',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    if (!c.env.ELITEDATA_API_KEY) {
      throw new HTTPException(500, {
        message: 'ELITEDATA_API_KEY is not configured.',
      });
    }
    try {
      const balance = await elitedata.getBalance(c.env);
      return c.json({ ok: true, balance });
    } catch (err) {
      providerErrorResponse(err);
    }
  },
);

// --- POST /admin/providers/data/sync ---
// Pulls the current bundle catalog from EliteData and upserts into
// Firestore. Existing bundles keep their admin curation flag. New
// bundles default to hidden.
adminProvidersRouter.post(
  '/data/sync',
  requireRole('super_admin', 'admin'),
  async (c) => {
    if (!c.env.ELITEDATA_API_KEY) {
      throw new HTTPException(500, {
        message: 'ELITEDATA_API_KEY is not configured.',
      });
    }
    try {
      const summary = await syncBundlesFromProvider(c.env);
      return c.json({ ok: true, summary });
    } catch (err) {
      providerErrorResponse(err);
    }
  },
);

// --- GET /admin/providers/data/bundles ---
// Returns the local synced catalog, including admin-only fields
// (providerCostGhs, markupPercent, availableToCustomers, active).
adminProvidersRouter.get(
  '/data/bundles',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const bundles = await listAllBundles(c.env);
    return c.json({ ok: true, bundles, count: bundles.length });
  },
);

// --- PUT /admin/providers/data/bundles/:bundleId/availability ---
// Toggle whether a bundle is shown to customers. Body: { available: boolean }.
adminProvidersRouter.put(
  '/data/bundles/:bundleId/availability',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const bundleId = c.req.param('bundleId');
    const body = await c.req.json().catch(() => null);
    const parsed = SetBundleAvailabilityInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Validation failed — ${parsed.error.issues[0]?.message ?? 'invalid body'}`,
      });
    }
    const existing = await getBundle(c.env, bundleId);
    if (!existing) {
      throw new HTTPException(404, { message: 'Bundle not found.' });
    }
    await setBundleAvailability(c.env, bundleId, parsed.data.available);
    return c.json({ ok: true, bundleId, available: parsed.data.available });
  },
);

// --- PUT /admin/providers/data/bundles/:bundleId/price ---
// Override the auto-computed sell price. Body: { sellPriceGhs: number }.
adminProvidersRouter.put(
  '/data/bundles/:bundleId/price',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const bundleId = c.req.param('bundleId');
    const body = await c.req.json().catch(() => null);
    const parsed = SetBundlePriceInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Validation failed — ${parsed.error.issues[0]?.message ?? 'invalid body'}`,
      });
    }
    const existing = await getBundle(c.env, bundleId);
    if (!existing) {
      throw new HTTPException(404, { message: 'Bundle not found.' });
    }
    await setBundleSellPrice(c.env, bundleId, parsed.data.sellPriceGhs);
    return c.json({
      ok: true,
      bundleId,
      sellPriceGhs: parsed.data.sellPriceGhs,
    });
  },
);

// ─────────────────────────────────────────────────────────────────────
// Wildcard provider routes — MUST come after the /data/* block above
// so that literal paths win over /:providerId.
// ─────────────────────────────────────────────────────────────────────

// --- GET /admin/providers/:providerId ---
adminProvidersRouter.get('/:providerId', async (c) => {
  const id = parseId(c.req.param('providerId'));
  const record = await getProviderRecord(c.env, id);
  if (!record) throw new HTTPException(404, { message: 'Provider not found.' });
  return c.json(
    ProviderResponseSchema.parse({ provider: toPublicProvider(record) }),
  );
});

// --- PUT /admin/providers/:providerId ---
adminProvidersRouter.put(
  '/:providerId',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const id = parseId(c.req.param('providerId'));
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = UpdateProviderInputSchema.safeParse(body);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new HTTPException(400, { message: `Validation failed — ${detail}` });
    }
    const existing = await getProviderRecord(c.env, id);
    if (!existing) throw new HTTPException(404, { message: 'Provider not found.' });

    const admin = c.get('admin');
    const record = await updateProvider(c.env, id, parsed.data, admin.uid);
    return c.json(
      ProviderResponseSchema.parse({ provider: toPublicProvider(record) }),
    );
  },
);

// --- POST /admin/providers/:providerId/refresh-balance ---
adminProvidersRouter.post(
  '/:providerId/refresh-balance',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const id = parseId(c.req.param('providerId'));
    const record = await getProviderRecord(c.env, id);
    if (!record) throw new HTTPException(404, { message: 'Provider not found.' });

    // Only the Arkesel driver is wired through this endpoint today.
    // EliteData has its own /data/balance route above because its balance
    // shape (wallet GHS) doesn't map to the smsCredits field on the
    // provider record.
    if (record.driver !== 'arkesel') {
      throw new HTTPException(400, {
        message: 'Use /admin/providers/data/balance for data providers.',
      });
    }
    if (!c.env.ARKESEL_API_KEY) {
      throw new HTTPException(500, {
        message: 'ARKESEL_API_KEY is not configured.',
      });
    }

    const balance = await fetchBalance(c.env, id);
    if (!balance) {
      throw new HTTPException(502, {
        message: 'Could not fetch balance from the provider.',
      });
    }

    const admin = c.get('admin');
    const updated = await updateProvider(
      c.env,
      id,
      {
        credits: balance.smsCredits,
        mainBalanceGhs: balance.mainBalanceGhs,
        balanceCheckedAt: new Date().toISOString(),
      },
      admin.uid,
    );

    return c.json(
      ProviderResponseSchema.parse({ provider: toPublicProvider(updated) }),
    );
  },
);

// --- GET /admin/providers/:providerId/requests ---
adminProvidersRouter.get('/:providerId/requests', async (c) => {
  const id = parseId(c.req.param('providerId'));
  const record = await getProviderRecord(c.env, id);
  if (!record) throw new HTTPException(404, { message: 'Provider not found.' });

  const limitRaw = c.req.query('limit');
  const limit = limitRaw
    ? Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200)
    : 50;

  const requests = await listRecentProviderRequests(c.env, id, limit);
  return c.json(
    ProviderRequestListResponseSchema.parse({
      requests,
      count: requests.length,
    }),
  );
});

// --- PATCH /admin/providers/data/bundles/:bundleId ---
// Full partial update: any of label, sellPriceGhs, displayOrder,
// availableToCustomers, active.
adminProvidersRouter.patch(
  '/data/bundles/:bundleId',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const bundleId = c.req.param('bundleId');
    const body = await c.req.json().catch(() => null);
    const parsed = UpdateBundleInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Validation failed — ${parsed.error.issues[0]?.message ?? 'invalid body'}`,
      });
    }
    const existing = await getBundle(c.env, bundleId);
    if (!existing) throw new HTTPException(404, { message: 'Bundle not found.' });
    await updateBundleFields(c.env, bundleId, parsed.data);
    return c.json({ ok: true, bundleId });
  },
);

// --- DELETE /admin/providers/data/bundles/:bundleId ---
// Removes the bundle from our local catalog. If EliteData still offers it,
// the next sync re-adds it (as hidden, since new bundles default to hidden).
adminProvidersRouter.delete(
  '/data/bundles/:bundleId',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const bundleId = c.req.param('bundleId');
    const existing = await getBundle(c.env, bundleId);
    if (!existing) throw new HTTPException(404, { message: 'Bundle not found.' });
    await deleteBundle(c.env, bundleId);
    return c.json({ ok: true, bundleId });
  },
);

// --- PUT /admin/providers/data/markup ---
// Set a global markup percent and recompute every active bundle's sell
// price from providerCostGhs. Manually-overridden prices are overwritten
// — this is the "reset to standard pricing" action.
adminProvidersRouter.put(
  '/data/markup',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = SetGlobalMarkupInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Validation failed — ${parsed.error.issues[0]?.message ?? 'invalid body'}`,
      });
    }
    const result = await applyGlobalMarkup(c.env, parsed.data.markupPercent);
    return c.json({
      ok: true,
      markupPercent: parsed.data.markupPercent,
      updated: result.updated,
    });
  },
);