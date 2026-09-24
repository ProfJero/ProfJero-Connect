import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  ProviderIdSchema,
  ProviderListResponseSchema,
  ProviderRequestListResponseSchema,
  ProviderResponseSchema,
  UpdateProviderInputSchema,
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

    // Only Arkesel driver is implemented today.
    if (record.driver !== 'arkesel') {
      throw new HTTPException(400, {
        message: 'Balance refresh is not supported for this provider yet.',
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