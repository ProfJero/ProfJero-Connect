import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { GuestDataOrderInputSchema, canonicalNetwork, type DataOrder, type TrackedDataOrder } from '@profjero/shared';
import { customerAppBaseUrl } from '../lib/origins';
import { durableLimit, memoryLimit } from '../lib/rateLimit';
import { isValidNormalizedPhone, normalizePhone } from '../lib/phone';
import { getCustomerCatalog } from '../services/dataService';
import { GUEST_PROJECT_ID, refreshDataOrder, startDataCheckout, toCustomerOrder } from '../services/dataOrders';
import { getOrder, listOrdersForRecipient } from '../repositories/dataOrders';
import { getSettings } from '../services/settings';
import { parseBody, requireIdempotencyKey, scopedId } from './customer/helpers';
import type { AuthVariables, Env } from '../types/env';

/**
 * Data bundles without an account (/public/data/*): browse, buy, follow
 * an order, and track orders by order ID or phone number.
 *
 * Nothing here needs a login, so every route is rate-limited by client IP
 * and nothing returned includes costs, emails, payment or provider details.
 */
const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const ORDER_ID_RE = /^pjd_[a-f0-9]{24}$/;

function clientIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';
}

// Cheap per-isolate cap on every public data call.
router.use('*', async (c, next) => {
  memoryLimit(`pubdata:${clientIp(c)}`, 120, 60);
  await next();
});

/** GET /public/data/bundles — what can be bought right now. */
router.get('/data/bundles', async (c) => {
  const bundles = await getCustomerCatalog(c.env);
  const { payments } = await getSettings(c.env);
  const networks = [...new Set(bundles.map((b) => canonicalNetwork(b.network) ?? b.network))];
  c.header('Cache-Control', 'public, max-age=30');
  return c.json({
    bundles: bundles.map((b) => ({ ...b, networkKey: canonicalNetwork(b.network) ?? b.network })),
    networks,
    checkoutEnabled: payments.customerTopupsEnabled,
    checkoutMessage: payments.customerTopupsEnabled ? null : payments.topupsDisabledMessage,
  });
});

/**
 * POST /public/data/orders  (Idempotency-Key required)
 * Starts a guest checkout; returns the order, `checkoutUrl` and `accessCode`.
 */
router.post('/data/orders', async (c) => {
  const key = requireIdempotencyKey(c);
  const body = await parseBody(c, GuestDataOrderInputSchema);
  const { payments } = await getSettings(c.env);
  if (!payments.customerTopupsEnabled) {
    throw new HTTPException(503, {
      message: payments.topupsDisabledMessage ?? 'Payments are temporarily unavailable. Please try again later.',
    });
  }
  const orderId = await scopedId('pjd_', GUEST_PROJECT_ID, key);
  if (!(await getOrder(c.env, orderId))) {
    const ip = clientIp(c);
    await durableLimit(c.env, `guestorder:${ip}`, 8, 600, 'checkout attempts');
    const recipient = normalizePhone(body.recipientNumber);
    await durableLimit(c.env, `guestorder-to:${recipient}`, 12, 3600, 'checkout attempts for this number');
  }
  const base = customerAppBaseUrl(c.req.header('Origin'), c.env.CUSTOMER_APP_URL);
  const { order, checkoutUrl, accessCode } = await startDataCheckout(c.env, {
    orderId,
    projectId: GUEST_PROJECT_ID,
    customerUid: '',
    customerEmail: body.email ?? null,
    guest: true,
    bundleId: body.bundleId,
    recipientNumber: body.recipientNumber,
    callbackUrl: base ? `${base}/data/complete` : undefined,
    channels: body.method ? [body.method] : undefined,
    serviceChargePercent: payments.serviceChargePercent,
  });
  return c.json({ order: toCustomerOrder(order), checkoutUrl, accessCode }, 201);
});

async function loadById(env: Env, id: string): Promise<DataOrder> {
  if (!ORDER_ID_RE.test(id)) throw new HTTPException(404, { message: 'Order not found. Check the order ID and try again.' });
  const order = await getOrder(env, id);
  if (!order) throw new HTTPException(404, { message: 'Order not found. Check the order ID and try again.' });
  return order;
}

/** GET /public/data/orders/:id — anyone holding the (unguessable) order ID. */
router.get('/data/orders/:id', async (c) => {
  return c.json({ order: toCustomerOrder(await loadById(c.env, c.req.param('id'))) });
});

/** POST /public/data/orders/:id/refresh — confirm payment / check delivery. */
router.post('/data/orders/:id/refresh', async (c) => {
  const order = await loadById(c.env, c.req.param('id'));
  if (order.orderStatus === 'delivered' || order.orderStatus === 'refunded') {
    return c.json({ order: toCustomerOrder(order) });
  }
  await durableLimit(c.env, `dataref:${order.id}`, 20, 60, 'status checks for this order');
  return c.json({ order: toCustomerOrder(await refreshDataOrder(c.env, order.id)) });
});

function toTracked(o: DataOrder): TrackedDataOrder {
  return {
    id: o.id,
    bundleLabel: o.bundleLabel,
    network: o.network,
    size: o.size,
    recipientNumber: o.recipientNumber,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    completedAt: o.completedAt,
  };
}

/**
 * GET /public/data/track?q=<order ID or phone number>
 * An order ID returns that order; a phone number returns the latest paid
 * orders sent to it (unpaid checkouts are left out).
 */
router.get('/data/track', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (!q) throw new HTTPException(400, { message: 'Enter an order ID or a phone number.' });
  await durableLimit(c.env, `track:${clientIp(c)}`, 30, 600, 'tracking lookups');

  if (q.toLowerCase().startsWith('pjd_')) {
    const order = await getOrder(c.env, ORDER_ID_RE.test(q.toLowerCase()) ? q.toLowerCase() : '');
    return c.json({ orders: order ? [toTracked(order)] : [] });
  }
  const phone = normalizePhone(q);
  if (!phone.startsWith('233') || phone.length !== 12 || !isValidNormalizedPhone(phone)) {
    throw new HTTPException(400, { message: 'Enter a valid Ghana number (e.g. 024 123 4567) or an order ID (starts with pjd_).' });
  }
  const orders = (await listOrdersForRecipient(c.env, phone, 20))
    .filter((o) => o.paymentStatus === 'paid')
    .slice(0, 10);
  return c.json({ orders: orders.map(toTracked) });
});

export { router as publicDataRouter };
