import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CustomerInitiatePaymentRequestSchema,
} from '@profjero/shared';
import { customerAppBaseUrl } from '../../lib/origins';
import { getPaymentByReference } from '../../repositories/payments';
import { initiatePayment } from '../../services/payments';
import { listProjectPayments, loadOwnPayment, priceCustomUnits, refreshPayment, toPublicPayment } from '../../services/topups';
import {
  paginateByCreatedAt,
  parseBody,
  parseLimit,
  requireIdempotencyKey,
  scopedId,
} from './helpers';
import { durableLimit } from '../../lib/rateLimit';
import { getSettings } from '../../services/settings';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const toCustomerPayment = toPublicPayment;

/**
 * POST /customer/payments  (Idempotency-Key required)
 *
 * Starts a checkout for a package, or for a custom unit count billed at
 * the SMS unit price. Returns `checkoutUrl` for the browser to redirect
 * to. The reference is derived from the Idempotency-Key, so a double
 * click or retry returns the same checkout instead of creating a second.
 *
 * The wallet is credited later by the payment webhook (or by
 * POST /customer/payments/:reference/verify on the return page) — never
 * by this call.
 */
router.post('/payments', async (c) => {
  const customer = c.get('customer')!;
  const projectId = c.get('projectId')!;
  const key = requireIdempotencyKey(c);
  const body = await parseBody(c, CustomerInitiatePaymentRequestSchema);

  const { payments: paySettings } = await getSettings(c.env);
  if (!paySettings.customerTopupsEnabled) {
    throw new HTTPException(503, {
      message: paySettings.topupsDisabledMessage ?? 'Top-ups are temporarily unavailable. Please try again later.',
    });
  }
  // Retries of an existing checkout replay (or 409) inside initiatePayment;
  // only new checkouts count toward the limit.
  const reference = await scopedId('pjc_', projectId, key);
  if (!(await getPaymentByReference(c.env, reference))) {
    await durableLimit(c.env, `topup:${projectId}`, 10, 60, 'checkout attempts');
  }

  let units: number | undefined;
  let amountPesewas: number | undefined;

  if (body.units !== undefined) {
    units = body.units;
    amountPesewas = await priceCustomUnits(c.env, body.units);
  }

  const base = customerAppBaseUrl(c.req.header('Origin'), c.env.CUSTOMER_APP_URL);
  const result = await initiatePayment(c.env, {
    projectId,
    customerEmail: customer.email,
    packageId: body.packageId,
    units,
    amountPesewas,
    callbackUrl: base ? `${base}/wallet/add-funds/complete` : undefined,
    createdBy: `customer:${customer.uid}`,
    reference,
    channels: body.method ? [body.method] : undefined,
  });

  return c.json(
    {
      payment: toCustomerPayment(result.payment),
      checkoutUrl: result.authorizationUrl,
    },
    201,
  );
});

/**
 * GET /customer/payments?limit=&before=
 * The caller's payments, newest first.
 */
router.get('/payments', async (c) => {
  const projectId = c.get('projectId')!;
  const limit = parseLimit(c.req.query('limit'));
  const { payments, summary } = await listProjectPayments(c.env, projectId);
  const { page, nextCursor } = paginateByCreatedAt(payments, limit, c.req.query('before'));
  return c.json({ payments: page, count: page.length, nextCursor, summary });
});

/** GET /customer/payments/:reference */
router.get('/payments/:reference', async (c) => {
  const payment = await loadOwnPayment(
    c.env,
    c.get('projectId')!,
    c.req.param('reference'),
  );
  return c.json({ payment: toCustomerPayment(payment) });
});

/**
 * POST /customer/payments/:reference/verify
 *
 * Called by the return page after checkout. Confirms with the gateway and
 * credits the wallet if the webhook hasn't already. Safe to call
 * repeatedly — crediting is idempotent on the reference. A payment the
 * customer hasn't finished yet stays `pending` rather than being marked
 * failed, so an early return doesn't poison a checkout still in progress.
 */
router.post('/payments/:reference/verify', async (c) => {
  const projectId = c.get('projectId')!;
  return c.json(await refreshPayment(c.env, projectId, c.req.param('reference')));
});

export { router as customerPaymentsRouter };
