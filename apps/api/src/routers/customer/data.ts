import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CreateDataOrderInputSchema, canonicalNetwork } from '@profjero/shared';
import { customerAppBaseUrl } from '../../lib/origins';
import { durableLimit } from '../../lib/rateLimit';
import { getCustomerCatalog } from '../../services/dataService';
import { refreshDataOrder, startDataCheckout, toCustomerOrder } from '../../services/dataOrders';
import { getOrder, listOrdersForProject } from '../../repositories/dataOrders';
import { getSettings } from '../../services/settings';
import { parseBody, parseLimit, requireIdempotencyKey, scopedId } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

/**
 * Data bundles for customers: catalogue, checkout and order tracking.
 * Payment is taken per order at checkout (not from the SMS wallet).
 */
const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** GET /customer/data/bundles — what can be bought right now. */
router.get('/data/bundles', async (c) => {
  const bundles = await getCustomerCatalog(c.env);
  const { payments } = await getSettings(c.env);
  const networks = [...new Set(bundles.map((b) => canonicalNetwork(b.network) ?? b.network))];
  return c.json({
    bundles: bundles.map((b) => ({ ...b, networkKey: canonicalNetwork(b.network) ?? b.network })),
    networks,
    checkoutEnabled: payments.customerTopupsEnabled,
    checkoutMessage: payments.customerTopupsEnabled ? null : payments.topupsDisabledMessage,
  });
});

/**
 * POST /customer/data/orders  (Idempotency-Key required)
 * Starts checkout for one bundle to one number; returns `checkoutUrl`.
 */
router.post('/data/orders', async (c) => {
  const customer = c.get('customer')!;
  const projectId = c.get('projectId')!;
  const key = requireIdempotencyKey(c);
  const body = await parseBody(c, CreateDataOrderInputSchema);

  const { payments } = await getSettings(c.env);
  if (!payments.customerTopupsEnabled) {
    throw new HTTPException(503, {
      message: payments.topupsDisabledMessage ?? 'Payments are temporarily unavailable. Please try again later.',
    });
  }
  const orderId = await scopedId('pjd_', projectId, key);
  if (!(await getOrder(c.env, orderId))) {
    await durableLimit(c.env, `dataorder:${projectId}`, 10, 60, 'checkout attempts');
  }
  const base = customerAppBaseUrl(c.req.header('Origin'), c.env.CUSTOMER_APP_URL);
  const { order, checkoutUrl } = await startDataCheckout(c.env, {
    orderId,
    projectId,
    customerUid: customer.uid,
    customerEmail: customer.email,
    bundleId: body.bundleId,
    recipientNumber: body.recipientNumber,
    callbackUrl: base ? `${base}/services/data/complete` : undefined,
    channels: body.method ? [body.method] : undefined,
  });
  return c.json({ order: toCustomerOrder(order), checkoutUrl }, 201);
});

/** GET /customer/data/orders?limit=&before= — newest first. */
router.get('/data/orders', async (c) => {
  const { orders, nextCursor } = await listOrdersForProject(c.env, c.get('projectId')!, {
    limit: parseLimit(c.req.query('limit')),
    before: c.req.query('before') || undefined,
  });
  return c.json({ orders: orders.map(toCustomerOrder), nextCursor });
});

async function loadOwn(c: { env: Env; get: (k: 'projectId') => string | undefined }, id: string) {
  if (!/^pjd_[a-f0-9]{24}$/.test(id)) throw new HTTPException(404, { message: 'Order not found.' });
  const order = await getOrder(c.env, id);
  if (!order || order.projectId !== c.get('projectId')) throw new HTTPException(404, { message: 'Order not found.' });
  return order;
}

router.get('/data/orders/:id', async (c) => {
  return c.json({ order: toCustomerOrder(await loadOwn(c, c.req.param('id'))) });
});

/**
 * POST /customer/data/orders/:id/refresh — the return page and the order
 * page call this to confirm payment / check delivery. Rate-limited per order.
 */
router.post('/data/orders/:id/refresh', async (c) => {
  const order = await loadOwn(c, c.req.param('id'));
  if (order.orderStatus === 'delivered' || order.orderStatus === 'refunded') {
    return c.json({ order: toCustomerOrder(order) });
  }
  await durableLimit(c.env, `dataref:${order.id}`, 20, 60, 'status checks for this order');
  return c.json({ order: toCustomerOrder(await refreshDataOrder(c.env, order.id)) });
});

export { router as customerDataRouter };
