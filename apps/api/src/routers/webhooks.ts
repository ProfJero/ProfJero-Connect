import { Hono } from 'hono';
import {
  applyDeliveryStatusByProviderId,
  mapArkeselStatus,
} from '../services/deliveryStatus';
import {
  markPaymentFailed,
  markPaymentSuccessful,
} from '../services/payments';
import { verifyPaystackSignature } from '../providers/paystackClient';
import { getPaymentByReference } from '../repositories/payments';
import { notifyProject } from '../services/notifications';
import { timingSafeEqual } from '../services/apiKeys';
import { EliteDataWebhookSchema } from '@profjero/shared';
import { confirmDataPayment, handleProviderWebhook, isDataOrderReference, markDataPaymentUnsuccessful } from '../services/dataOrders';
import type { Env } from '../types/env';

export const webhooksRouter = new Hono<{ Bindings: Env }>();

// =================================================================
// Arkesel — delivery status
// =================================================================

webhooksRouter.post('/arkesel', async (c) => {
  // The provider doesn't sign callbacks; a shared token in the callback
  // URL stops anyone else from marking messages delivered/failed (which
  // would charge or refund units).
  const secret = c.env.ARKESEL_WEBHOOK_SECRET;
  if (secret && !timingSafeEqual(c.req.query('token') ?? '', secret)) {
    console.warn('[arkesel webhook] rejected: bad or missing token');
    return c.json({ ok: false, reason: 'unauthorized' }, 401);
  }

  const smsId = c.req.query('sms_id');
  const rawStatus = c.req.query('status');

  let body: Record<string, unknown> | null = null;
  if (!smsId || !rawStatus) {
    body = await c.req.json().catch(() => null);
  }

  const messageId = smsId ?? (body?.sms_id as string | undefined) ?? null;
  const statusStr =
    rawStatus ?? (body?.status as string | undefined) ?? null;

  if (!messageId || !statusStr) {
    console.warn('[arkesel webhook] missing sms_id or status');
    return c.json({ ok: false, reason: 'missing_fields' }, 400);
  }

  const recordStatus = mapArkeselStatus(statusStr);

  try {
    const result = await applyDeliveryStatusByProviderId(
      c.env,
      messageId,
      recordStatus,
    );

    if (result.applied === 0) {
      console.warn(
        `[arkesel webhook] no record for providerMessageId=${messageId} status=${statusStr}`,
      );
      return c.json({ ok: true, applied: 0 });
    }

    console.log(
      `[arkesel webhook] providerMessageId=${messageId} raw=${statusStr} → ${recordStatus}, ${result.transitions.filter((t) => t.changed).length} record(s) updated`,
    );

    return c.json({
      ok: true,
      applied: result.applied,
      transitions: result.transitions.map((t) => ({
        previous: t.previousStatus,
        next: t.newStatus,
        changed: t.changed,
      })),
    });
  } catch (err) {
    console.error('[arkesel webhook] handler error:', err);
    return c.json({ ok: false, reason: 'internal_error' }, 200);
  }
});

// =================================================================
// Data provider — order status changes
// =================================================================

/**
 * The data provider POSTs here when an order's status changes. It doesn't
 * sign requests, so (1) a shared token in the URL must match
 * ELITEDATA_WEBHOOK_SECRET, and (2) the body is only a hint: the order is
 * re-checked against the provider's API before anything is refunded.
 * Always answers 200 once authenticated so the provider doesn't retry
 * forever over an order we don't know.
 */
webhooksRouter.post('/elitedata', async (c) => {
  const secret = c.env.ELITEDATA_WEBHOOK_SECRET;
  if (!secret) return c.json({ ok: false, reason: 'not_configured' }, 503);
  if (!timingSafeEqual(c.req.query('token') ?? '', secret)) {
    console.warn('[elitedata webhook] rejected: bad or missing token');
    return c.json({ ok: false, reason: 'unauthorized' }, 401);
  }
  const raw = await c.req.text();
  if (raw.length > 20_000) return c.json({ ok: false, reason: 'too_large' }, 413);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return c.json({ ok: false, reason: 'invalid_json' }, 400);
  }
  const parsed = EliteDataWebhookSchema.safeParse(json);
  if (!parsed.success) return c.json({ ok: false, reason: 'invalid_body' }, 400);
  try {
    const result = await handleProviderWebhook(c.env, parsed.data);
    console.log(`[elitedata webhook] order=${parsed.data.orderId ?? '?'} ref=${parsed.data.apiReference ?? '?'} status=${parsed.data.status ?? '?'} → ${result.matched ? result.orderStatus : 'no match'}`);
    return c.json({ ok: true, ...result });
  } catch (err) {
    console.error('[elitedata webhook] handler error:', err);
    return c.json({ ok: false, reason: 'internal_error' }, 200);
  }
});

// =================================================================
// Paystack — payment events
// =================================================================

/**
 * Paystack POSTs here with a JSON body signed by HMAC-SHA512 using the
 * secret key. We MUST read the raw body BEFORE parsing to verify the
 * signature.
 *
 * Events we handle:
 *   charge.success  → credit the wallet
 *   charge.failed   → mark payment failed
 *
 * Any other event returns 200 with an "ignored" reason.
 *
 * Missing Paystack secret key → 503. Paystack will retry, which is
 * fine — this is a misconfiguration the operator needs to fix.
 */
webhooksRouter.post('/paystack', async (c) => {
  if (!c.env.PAYSTACK_SECRET_KEY) {
    console.error('[paystack webhook] PAYSTACK_SECRET_KEY not configured');
    return c.json({ ok: false, reason: 'not_configured' }, 503);
  }

  const signature = c.req.header('x-paystack-signature');
  if (!signature) {
    console.warn('[paystack webhook] missing x-paystack-signature header');
    return c.json({ ok: false, reason: 'missing_signature' }, 401);
  }

  // Read raw body BEFORE any JSON parsing so the HMAC matches.
  const rawBody = await c.req.text();

  const signatureValid = await verifyPaystackSignature(
    rawBody,
    signature,
    c.env.PAYSTACK_SECRET_KEY,
  );
  if (!signatureValid) {
    console.warn('[paystack webhook] invalid signature');
    return c.json({ ok: false, reason: 'invalid_signature' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return c.json({ ok: false, reason: 'invalid_json' }, 400);
  }

  const event = String(payload.event ?? '');
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const reference = data.reference ? String(data.reference) : null;

  if (!reference) {
    console.warn(`[paystack webhook] event=${event} missing reference`);
    return c.json({ ok: false, reason: 'missing_reference' }, 400);
  }

  console.log(`[paystack webhook] event=${event} reference=${reference}`);

  try {
    // Data bundle orders carry their own reference prefix.
    if (isDataOrderReference(reference)) {
      if (event === 'charge.success') {
        const order = await confirmDataPayment(c.env, reference, {
          amountPesewas: Number(data.amount),
          currency: String(data.currency ?? 'GHS'),
        });
        return c.json({ ok: true, reference, orderStatus: order.orderStatus });
      }
      if (event === 'charge.failed') {
        await markDataPaymentUnsuccessful(c.env, reference, 'failed');
        return c.json({ ok: true, reference, status: 'failed' });
      }
      return c.json({ ok: true, reference, ignored: event });
    }

    if (event === 'charge.success') {
      // The signature proves the gateway sent this, but we still check it
      // is the charge we asked for: same amount and currency. A mismatch is
      // never credited — it's held for an operator to look at.
      const payment = await getPaymentByReference(c.env, reference);
      if (payment && !payment.walletCreditedAt) {
        const paidAmount = Number(data.amount);
        const paidCurrency = String(data.currency ?? payment.currency).toUpperCase();
        const expected = payment.chargePesewas ?? payment.amountPesewas;
        if (paidAmount !== expected || paidCurrency !== payment.currency) {
          console.error(
            `[paystack webhook] amount mismatch for ${reference}: expected ${expected} ${payment.currency}, got ${data.amount} ${data.currency}`,
          );
          await markPaymentFailed(
            c.env,
            reference,
            `Amount mismatch: expected ${expected} ${payment.currency}, gateway reported ${data.amount} ${data.currency}. Not credited — needs review.`,
            payload,
          );
          return c.json({ ok: false, reference, reason: 'amount_mismatch' });
        }
      }
      const result = await markPaymentSuccessful(c.env, reference, payload);
      return c.json({
        ok: true,
        reference,
        walletCredited: result.walletCredited,
        status: result.payment.status,
      });
    }

    if (event === 'charge.failed') {
      const reason =
        (data.gateway_response as string | undefined) ??
        (data.status as string | undefined) ??
        'Paystack reported failure';
      const failed = await markPaymentFailed(
        c.env,
        reference,
        reason,
        payload,
      );
      if (failed.status === 'failed') {
        await notifyProject(c.env, {
          projectId: failed.projectId,
          id: `payment_failed__${reference}`,
          type: 'payment',
          severity: 'error',
          title: 'Payment failed',
          body: `Your payment of GH₵${(failed.amountPesewas / 100).toFixed(2)} (reference ${reference}) did not go through. No units were added. You can try again from Add Funds.`,
          link: '/wallet/add-funds',
        });
      }
      return c.json({
        ok: true,
        reference,
        status: failed.status,
      });
    }

    return c.json({ ok: true, reference, ignored: event });
  } catch (err) {
    console.error('[paystack webhook] handler error:', err);
    // Return 200 anyway — Paystack retrying won't fix our internal errors,
    // and we've already logged. Ops can trigger a manual verify.
    return c.json({ ok: false, reason: 'internal_error' }, 200);
  }
});