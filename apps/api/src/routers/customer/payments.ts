import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CustomerInitiatePaymentRequestSchema,
  type Payment,
} from '@profjero/shared';
import { firestoreQuery } from '../../lib/firestore';
import { scrubProviderNames } from '../../lib/scrub';
import { customerAppBaseUrl } from '../../lib/origins';
import { getPaymentByReference } from '../../repositories/payments';
import { getPricingSettings } from '../../repositories/pricing';
import {
  initiatePayment,
  verifyAndSettlePayment,
} from '../../services/payments';
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

/**
 * Customer-safe payment projection. Drops the gateway name, access code,
 * checkout URL and raw webhook payload; scrubs the failure reason.
 */
function toCustomerPayment(p: Payment) {
  return {
    reference: p.reference,
    packageId: p.packageId,
    units: p.units,
    amountGhs: p.amountPesewas / 100,
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
    paidAt: p.paidAt,
    walletCreditedAt: p.walletCreditedAt,
    failureReason: scrubProviderNames(p.failureReason),
  };
}

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
    const pricing = await getPricingSettings(c.env, 'sms');
    if (!pricing.active || pricing.unitPriceGhs === null || pricing.unitPriceGhs <= 0) {
      throw new HTTPException(400, {
        message: 'Custom amounts are not available right now. Please choose a package.',
      });
    }
    if (pricing.minPurchaseUnits !== null && body.units < pricing.minPurchaseUnits) {
      throw new HTTPException(400, {
        message: `The minimum purchase is ${pricing.minPurchaseUnits.toLocaleString('en-US')} units.`,
      });
    }
    if (pricing.maxPurchaseUnits !== null && body.units > pricing.maxPurchaseUnits) {
      throw new HTTPException(400, {
        message: `The maximum purchase is ${pricing.maxPurchaseUnits.toLocaleString('en-US')} units.`,
      });
    }
    units = body.units;
    amountPesewas = Math.round(body.units * pricing.unitPriceGhs * 100);
    if (amountPesewas < 100) {
      throw new HTTPException(400, { message: 'The minimum payment is GH₵1.00.' });
    }
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
  const docs = await firestoreQuery(c.env, 'payments', [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  const payments = docs
    .map((d) => ({
      reference: d.id,
      packageId: (d.data.packageId as string | null) ?? null,
      units: Number(d.data.units ?? 0),
      amountGhs: Number(d.data.amountPesewas ?? 0) / 100,
      currency: String(d.data.currency ?? 'GHS'),
      status: String(d.data.status) as Payment['status'],
      createdAt: String(d.data.createdAt),
      paidAt: (d.data.paidAt as string | null) ?? null,
      walletCreditedAt: (d.data.walletCreditedAt as string | null) ?? null,
      failureReason: scrubProviderNames(
        (d.data.failureReason as string | null) ?? null,
      ),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const { page, nextCursor } = paginateByCreatedAt(
    payments,
    limit,
    c.req.query('before'),
  );

  // Totals over every successful payment (not just this page) for the
  // Transactions page headline figures.
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const paid = payments.filter((p) => p.status === 'success');
  const summary = {
    totalPaidGhs: paid.reduce((s, p) => s + p.amountGhs, 0),
    totalUnitsPurchased: paid.reduce((s, p) => s + p.units, 0),
    paidThisMonthGhs: paid
      .filter((p) => (p.paidAt ?? p.createdAt) >= monthStart.toISOString())
      .reduce((s, p) => s + p.amountGhs, 0),
    successfulCount: paid.length,
    pendingCount: payments.filter((p) => p.status === 'pending').length,
  };

  return c.json({ payments: page, count: page.length, nextCursor, summary });
});

async function loadOwnPayment(env: Env, projectId: string, reference: string) {
  const payment = await getPaymentByReference(env, reference);
  // 404 for other tenants' references — don't leak existence.
  if (!payment || payment.projectId !== projectId) {
    throw new HTTPException(404, { message: 'Payment not found.' });
  }
  return payment;
}

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
  const payment = await loadOwnPayment(c.env, projectId, c.req.param('reference'));

  if (payment.walletCreditedAt || payment.status !== 'pending') {
    return c.json({ payment: toCustomerPayment(payment), walletCredited: false });
  }

  try {
    const result = await verifyAndSettlePayment(c.env, payment.reference, {
      failOnIncomplete: false,
      abandonAfterMs: 30 * 60 * 1000,
    });
    return c.json({
      payment: toCustomerPayment(result.payment),
      walletCredited: result.walletCredited,
    });
  } catch (err) {
    console.error('[customer payments] verify failed:', err);
    // Gateway unreachable or mismatched — leave it pending; the webhook
    // remains the source of truth.
    const latest = await loadOwnPayment(c.env, projectId, payment.reference);
    return c.json({ payment: toCustomerPayment(latest), walletCredited: false });
  }
});

export { router as customerPaymentsRouter };
