import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CustomerCreateApiKeySchema, type ApiKey } from '@profjero/shared';
import {
  createApiKeyCapped,
  getApiKeyById,
  listApiKeysForProject,
  revokeApiKey,
} from '../../repositories/apiKeys';
import { notifyProject } from '../../services/notifications';
import { parseBody } from './helpers';
import { durableLimit } from '../../lib/rateLimit';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** Active keys a customer may hold at once. Revoked keys don't count. */
const MAX_ACTIVE_KEYS = 5;

/** Never return hashes, rate-limit state or publishable-key internals. */
function toCustomerKey(k: ApiKey) {
  return {
    id: k.id,
    name: k.name,
    kind: k.kind,
    /** Display hint, e.g. "pk_live_3f9a…". Not a credential. */
    maskedKey: `${k.kind === 'publishable' ? 'pub_live_' : 'pk_live_'}${k.keyPrefix.slice(0, 6)}…`,
    status: k.status,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    revokedAt: k.revokedAt,
  };
}

/** GET /customer/api-keys */
router.get('/api-keys', async (c) => {
  const keys = await listApiKeysForProject(c.env, c.get('projectId')!);
  return c.json({ apiKeys: keys.map(toCustomerKey), count: keys.length });
});

/**
 * POST /customer/api-keys — create a secret key.
 *
 * The plaintext is in this response only; we store a hash (state.md §7
 * "API keys"). Secret keys are for the customer's server — the UI says so.
 */
router.post('/api-keys', async (c) => {
  const customer = c.get('customer')!;
  const projectId = c.get('projectId')!;
  const { name } = await parseBody(c, CustomerCreateApiKeySchema);
  await durableLimit(c.env, `apikey:${projectId}`, 10, 3600, 'API keys created');

  const key = await createApiKeyCapped(c.env, projectId, name, `customer:${customer.uid}`, MAX_ACTIVE_KEYS);
  if (!key) {
    throw new HTTPException(409, {
      message: `You can have at most ${MAX_ACTIVE_KEYS} active API keys. Revoke one you no longer use first.`,
    });
  }
  await notifyProject(c.env, {
    projectId,
    type: 'api_key',
    severity: 'info',
    title: 'New API key created',
    body: `An API key named "${name}" was created for your account. If this wasn't you, revoke it from API & Integrations and change your password.`,
    link: '/api',
    email: true,
  });

  return c.json({ apiKey: { ...toCustomerKey(key), plaintext: key.plaintext } }, 201);
});

/** POST /customer/api-keys/:id/revoke — immediate; the next request with it fails. */
router.post('/api-keys/:id/revoke', async (c) => {
  const customer = c.get('customer')!;
  const projectId = c.get('projectId')!;
  const key = await getApiKeyById(c.env, c.req.param('id'));
  if (!key || key.projectId !== projectId) {
    throw new HTTPException(404, { message: 'API key not found.' });
  }
  const revoked = await revokeApiKey(c.env, key.id, `customer:${customer.uid}`);
  return c.json({ apiKey: toCustomerKey(revoked ?? key) });
});

export { router as customerApiKeysRouter };
