import type { CustomerDataOrder, DataOrder, DataOrderStatus } from '@profjero/shared';
import { elitedata, EliteDataError } from '../providers/elitedataClient';
import { initializeTransaction, refundTransaction, verifyTransaction } from '../providers/paystackClient';
import { getBundle } from '../repositories/dataBundles';
import { getOrder, listOrdersPendingReconciliation, updateOrder } from '../repositories/dataOrders';
import { firestoreCreateDoc, runTransaction } from '../lib/firestore';
import { DomainError } from '../lib/domainError';
import { isValidNormalizedPhone, normalizePhone } from '../lib/phone';
import { count } from '../lib/monitor';
import { notifyProject } from './notifications';
import type { Env } from '../types/env';

/**
 * Data bundle purchases (DB3): pay → deliver → track → refund.
 *
 *   pending_payment ──paid──▶ payment_confirmed ──submitted──▶ processing ──▶ delivered
 *          │                         │                             │
 *     (abandoned)              rejected by provider           provider failed
 *                                    └────────▶ failed ──refund──▶ refunded
 *
 * The customer pays exactly the bundle price at checkout; nothing comes
 * out of the SMS wallet. Each order ID doubles as the payment reference
 * and as the provider's clientReference, so retries at any step find the
 * same order instead of creating a second one.
 *
 * Money safety:
 * - Only a confirmed payment of the exact amount moves an order forward.
 * - Submission is claimed in a transaction, so the webhook and the return
 *   page racing each other can't buy the bundle twice.
 * - If the provider's answer is lost (timeout, 5xx), we can't know whether
 *   the bundle went out: the order is flagged for review, not refunded.
 * - A definite rejection is refunded in full automatically.
 */

const ORDER_PREFIX = 'pjd_';

export function isDataOrderReference(reference: string): boolean {
  return reference.startsWith(ORDER_PREFIX);
}

/** Customer-safe projection: no costs, provider IDs or provider wording. */
export function toCustomerOrder(o: DataOrder): CustomerDataOrder {
  return {
    id: o.id,
    bundleId: o.bundleId,
    bundleLabel: o.bundleLabel,
    network: o.network,
    size: o.size,
    recipientNumber: o.recipientNumber,
    amountGhs: (o.amountPesewas ?? Math.round(o.sellPriceGhs * 100)) / 100,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    message: customerMessage(o),
    refundedAt: o.refundedAt ?? null,
    paidAt: o.paymentConfirmedAt,
    completedAt: o.completedAt,
    createdAt: o.createdAt,
  };
}

function customerMessage(o: DataOrder): string | null {
  switch (o.orderStatus) {
    case 'pending_payment':
      return o.paymentStatus === 'abandoned' || o.paymentStatus === 'failed'
        ? 'Payment was not completed. Nothing was charged for this order.'
        : null;
    case 'payment_confirmed':
    case 'processing':
      return o.needsReview
        ? 'Payment received. We are confirming delivery with the network — this can take a little longer than usual.'
        : null;
    case 'failed':
      return o.refundError
        ? 'The bundle could not be delivered. Your refund is being processed by our team.'
        : 'The bundle could not be delivered. A full refund is on its way.';
    case 'refunded':
      return 'The bundle could not be delivered, so your payment was refunded in full. Mobile money refunds can take 1–3 working days.';
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────────────

export async function startDataCheckout(
  env: Env,
  args: {
    orderId: string;
    projectId: string;
    customerUid: string;
    customerEmail: string;
    bundleId: string;
    recipientNumber: string;
    callbackUrl?: string;
    channels?: string[];
  },
): Promise<{ order: DataOrder; checkoutUrl: string }> {
  if (!env.PAYSTACK_SECRET_KEY) throw new DomainError('Payments are not configured.', 500);
  const recipient = normalizePhone(args.recipientNumber);
  if (!recipient.startsWith('233') || recipient.length !== 12 || !isValidNormalizedPhone(recipient)) {
    throw new DomainError('Enter a valid Ghana mobile number, e.g. 024 123 4567.', 400);
  }

  const existing = await getOrder(env, args.orderId);
  if (existing) {
    if (existing.projectId !== args.projectId || existing.bundleId !== args.bundleId || existing.recipientNumber !== recipient) {
      throw new DomainError('This Idempotency-Key was already used for a different purchase.', 409);
    }
    if (!existing.checkoutUrl) throw new DomainError('This checkout could not be started. Please try again.', 409);
    return { order: existing, checkoutUrl: existing.checkoutUrl };
  }

  const bundle = await getBundle(env, args.bundleId);
  if (!bundle) throw new DomainError('That bundle no longer exists. Please pick another.', 404);
  if (!bundle.active || !bundle.availableToCustomers) {
    throw new DomainError('That bundle is not available right now. Please pick another.', 409);
  }
  const amountPesewas = Math.round(bundle.sellPriceGhs * 100);
  if (amountPesewas < 100) throw new DomainError('This bundle cannot be bought online right now.', 409);

  const init = await initializeTransaction(env, {
    email: args.customerEmail,
    amountPesewas,
    reference: args.orderId,
    currency: 'GHS',
    callbackUrl: args.callbackUrl,
    channels: args.channels,
    metadata: { kind: 'data_order', orderId: args.orderId, projectId: args.projectId, bundle: bundle.label, recipient },
  });

  const now = new Date().toISOString();
  const order: Omit<DataOrder, 'id'> = {
    projectId: args.projectId,
    customerUid: args.customerUid,
    bundleId: bundle.id,
    bundleLabel: bundle.label,
    network: bundle.network,
    size: bundle.size,
    recipientNumber: recipient,
    providerCostGhs: bundle.providerCostGhs,
    sellPriceGhs: bundle.sellPriceGhs,
    amountPesewas,
    paymentReference: args.orderId,
    paymentStatus: 'pending',
    orderStatus: 'pending_payment',
    providerOrderId: null,
    providerReference: args.orderId,
    providerStatus: null,
    providerError: null,
    idempotencyKey: args.orderId,
    paymentConfirmedAt: null,
    providerSubmittedAt: null,
    completedAt: null,
    checkoutUrl: init.authorizationUrl,
    customerEmail: args.customerEmail,
    needsReview: false,
    refundedAt: null,
    refundError: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await firestoreCreateDoc(env, 'dataOrders', { ...order }, { docId: args.orderId });
  } catch (err) {
    // A concurrent identical request created it first: return that one.
    const again = await getOrder(env, args.orderId);
    if (again?.checkoutUrl) return { order: again, checkoutUrl: again.checkoutUrl };
    throw err;
  }
  count({ data_checkouts: 1 });
  return { order: { id: args.orderId, ...order }, checkoutUrl: init.authorizationUrl };
}

// ─────────────────────────────────────────────────────────────────────
// Payment confirmation → delivery
// ─────────────────────────────────────────────────────────────────────

/**
 * The gateway says the order was paid (webhook, or a verify call). Checks
 * the amount, records the payment and submits the bundle. Idempotent.
 */
export async function confirmDataPayment(
  env: Env,
  orderId: string,
  paid: { amountPesewas: number; currency: string },
): Promise<DataOrder> {
  const order = await getOrder(env, orderId);
  if (!order) throw new DomainError('Order not found.', 404);
  const expected = order.amountPesewas ?? Math.round(order.sellPriceGhs * 100);

  if (order.orderStatus === 'pending_payment') {
    if (paid.amountPesewas !== expected || paid.currency.toUpperCase() !== 'GHS') {
      await updateOrder(env, orderId, {
        paymentStatus: 'paid',
        needsReview: true,
        providerError: `Amount mismatch: expected ${expected} GHS pesewas, gateway reported ${paid.amountPesewas} ${paid.currency}. Not delivered — needs review.`,
      });
      return (await getOrder(env, orderId))!;
    }
    await runTransaction(env, async (txn) => {
      const doc = await txn.get('dataOrders', orderId);
      if (!doc || doc.data.orderStatus !== 'pending_payment') return;
      const now = new Date().toISOString();
      txn.write({
        path: `dataOrders/${orderId}`,
        fields: { paymentStatus: 'paid', orderStatus: 'payment_confirmed', paymentConfirmedAt: now, updatedAt: now },
        updateFieldPaths: ['paymentStatus', 'orderStatus', 'paymentConfirmedAt', 'updatedAt'],
        precondition: doc.updateTime ? { updateTime: doc.updateTime } : { exists: true },
      });
    });
  }
  return submitToProvider(env, orderId);
}

/** Checkout failed or was abandoned at the gateway. */
export async function markDataPaymentUnsuccessful(env: Env, orderId: string, status: 'failed' | 'abandoned'): Promise<void> {
  const order = await getOrder(env, orderId);
  if (!order || order.orderStatus !== 'pending_payment' || order.paymentStatus === 'paid') return;
  await updateOrder(env, orderId, { paymentStatus: status });
}

/**
 * Hand a paid order to the provider. Claimed in a transaction (sets
 * providerSubmittedAt) so it is submitted at most once, whoever calls.
 */
async function submitToProvider(env: Env, orderId: string, opts: { force?: boolean } = {}): Promise<DataOrder> {
  const claimed = await runTransaction(env, async (txn) => {
    const doc = await txn.get('dataOrders', orderId);
    if (!doc) return false;
    const ready = doc.data.orderStatus === 'payment_confirmed' && !doc.data.providerSubmittedAt;
    if (!ready && !opts.force) return false;
    const now = new Date().toISOString();
    txn.write({
      path: `dataOrders/${orderId}`,
      fields: { orderStatus: 'processing', providerSubmittedAt: now, needsReview: false, updatedAt: now },
      updateFieldPaths: ['orderStatus', 'providerSubmittedAt', 'needsReview', 'updatedAt'],
      precondition: doc.updateTime ? { updateTime: doc.updateTime } : { exists: true },
    });
    return true;
  });
  const order = (await getOrder(env, orderId))!;
  if (!claimed) return order;

  const t0 = Date.now();
  try {
    const res = await elitedata.purchaseBundle(env, {
      bundleId: order.bundleId,
      recipientNumber: localNumber(order.recipientNumber),
      clientReference: order.providerReference,
    });
    count({ data_prov_calls: 1, data_prov_ms: Date.now() - t0 });
    const status = mapProviderStatus(res.status);
    await updateOrder(env, orderId, {
      providerOrderId: res.id,
      providerStatus: res.status,
      providerError: null,
    });
    if (status === 'delivered') return finishDelivered(env, orderId);
    if (status === 'failed') return failAndRefund(env, orderId, `Provider reported "${res.status}" on submission.`);
    return (await getOrder(env, orderId))!;
  } catch (err) {
    count({ data_prov_calls: 1, data_prov_ms: Date.now() - t0, data_prov_err: 1 });
    const message = err instanceof Error ? err.message : String(err);
    // A 4xx means the provider refused the request: nothing was bought.
    if (err instanceof EliteDataError && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429) {
      return failAndRefund(env, orderId, message);
    }
    // Lost answer: it may have gone through. Hold for an operator.
    await updateOrder(env, orderId, { needsReview: true, providerError: `Outcome unknown: ${message}` });
    return (await getOrder(env, orderId))!;
  }
}

/** EliteData expects the local 0XXXXXXXXX format. */
function localNumber(normalized: string): string {
  return normalized.startsWith('233') ? `0${normalized.slice(3)}` : normalized;
}

export function mapProviderStatus(raw: string | null | undefined): 'delivered' | 'failed' | 'processing' {
  const s = (raw ?? '').toLowerCase();
  if (/(deliver|success|complete|fulfil|sent)/.test(s)) return 'delivered';
  if (/(fail|reject|cancel|revers|refund|invalid|error)/.test(s)) return 'failed';
  return 'processing';
}

async function finishDelivered(env: Env, orderId: string): Promise<DataOrder> {
  const order = (await getOrder(env, orderId))!;
  if (order.orderStatus === 'delivered') return order;
  const now = new Date().toISOString();
  await updateOrder(env, orderId, { orderStatus: 'delivered', completedAt: now, needsReview: false });
  count({ data_delivered: 1 });
  await notifyProject(env, {
    projectId: order.projectId,
    id: `data_delivered__${orderId}`,
    type: 'payment',
    severity: 'success',
    title: 'Data bundle delivered',
    body: `${order.bundleLabel} was delivered to ${displayNumber(order.recipientNumber)}.`,
    link: `/services/data/orders/${orderId}`,
  });
  return (await getOrder(env, orderId))!;
}

/** Mark failed and refund the payment in full (best effort; flagged if the refund fails). */
async function failAndRefund(env: Env, orderId: string, reason: string): Promise<DataOrder> {
  await updateOrder(env, orderId, { orderStatus: 'failed', providerError: reason.slice(0, 500), completedAt: new Date().toISOString() });
  count({ data_failed: 1 });
  return refundOrder(env, orderId);
}

export async function refundOrder(env: Env, orderId: string): Promise<DataOrder> {
  const order = (await getOrder(env, orderId))!;
  if (order.orderStatus === 'refunded') return order;
  if (order.paymentStatus !== 'paid' || !order.paymentReference) {
    throw new DomainError('Only paid orders can be refunded.', 409);
  }
  const res = await refundTransaction(env, order.paymentReference);
  if (!res.ok) {
    await updateOrder(env, orderId, { orderStatus: 'failed', needsReview: true, refundError: res.status.slice(0, 300) });
    await notifyProject(env, {
      projectId: order.projectId,
      id: `data_failed__${orderId}`,
      type: 'payment',
      severity: 'error',
      title: 'Data bundle not delivered',
      body: `${order.bundleLabel} to ${displayNumber(order.recipientNumber)} could not be delivered. Our team is processing your refund of GH₵${((order.amountPesewas ?? 0) / 100).toFixed(2)}.`,
      link: `/services/data/orders/${orderId}`,
    });
    return (await getOrder(env, orderId))!;
  }
  const now = new Date().toISOString();
  await updateOrder(env, orderId, { orderStatus: 'refunded', refundedAt: now, refundError: null, needsReview: false });
  count({ data_refunded: 1 });
  await notifyProject(env, {
    projectId: order.projectId,
    id: `data_refunded__${orderId}`,
    type: 'payment',
    severity: 'warning',
    title: 'Data bundle refunded',
    body: `${order.bundleLabel} to ${displayNumber(order.recipientNumber)} could not be delivered, so GH₵${((order.amountPesewas ?? 0) / 100).toFixed(2)} was refunded in full.`,
    link: `/services/data/orders/${orderId}`,
    email: true,
  });
  return (await getOrder(env, orderId))!;
}

function displayNumber(normalized: string): string {
  const local = localNumber(normalized);
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : local;
}

// ─────────────────────────────────────────────────────────────────────
// Status checks
// ─────────────────────────────────────────────────────────────────────

/**
 * Bring one order up to date: confirm an unpaid checkout with the gateway,
 * or ask the provider about a submitted one. Safe to call repeatedly.
 */
export async function refreshDataOrder(env: Env, orderId: string): Promise<DataOrder> {
  const order = await getOrder(env, orderId);
  if (!order) throw new DomainError('Order not found.', 404);

  if (order.orderStatus === 'pending_payment' && order.paymentReference && !order.needsReview) {
    const v = await verifyTransaction(env, order.paymentReference).catch(() => null);
    if (v?.success) return confirmDataPayment(env, orderId, { amountPesewas: v.amountPesewas, currency: v.currency });
    if (v && (v.status === 'failed' || v.status === 'reversed')) await markDataPaymentUnsuccessful(env, orderId, 'failed');
    else if (v?.status === 'abandoned' && Date.now() - new Date(order.createdAt).getTime() > 60 * 60_000) {
      await markDataPaymentUnsuccessful(env, orderId, 'abandoned');
    }
    return (await getOrder(env, orderId))!;
  }

  if (order.orderStatus === 'payment_confirmed' && !order.providerSubmittedAt) {
    return submitToProvider(env, orderId);
  }

  if (order.orderStatus === 'processing' && order.providerOrderId) {
    try {
      const p = await elitedata.getOrder(env, order.providerOrderId);
      const status = mapProviderStatus(p.status);
      if (p.status !== order.providerStatus) await updateOrder(env, orderId, { providerStatus: p.status });
      else await updateOrder(env, orderId, {});
      if (status === 'delivered') return finishDelivered(env, orderId);
      if (status === 'failed') return failAndRefund(env, orderId, `Provider reported "${p.status}".`);
    } catch (err) {
      console.error(`[data] status check for ${orderId} failed:`, err);
    }
  }
  return (await getOrder(env, orderId))!;
}

/** Cron: poll the provider for orders still processing (oldest first). */
export async function reconcileDataOrders(env: Env, limit = 25): Promise<{ checked: number; delivered: number; failed: number }> {
  const pending = await listOrdersPendingReconciliation(env, 2, limit);
  let delivered = 0;
  let failed = 0;
  for (const o of pending) {
    if (!o.providerOrderId || o.needsReview) continue;
    const after = await refreshDataOrder(env, o.id);
    if (after.orderStatus === 'delivered') delivered++;
    if (after.orderStatus === 'failed' || after.orderStatus === 'refunded') failed++;
  }
  return { checked: pending.length, delivered, failed };
}

// ─────────────────────────────────────────────────────────────────────
// Operator actions
// ─────────────────────────────────────────────────────────────────────

/** Re-submit an order whose first submission outcome was unknown (operator checked it wasn't delivered). */
export async function retryDataOrder(env: Env, orderId: string): Promise<DataOrder> {
  const order = await getOrder(env, orderId);
  if (!order) throw new DomainError('Order not found.', 404);
  if (order.paymentStatus !== 'paid') throw new DomainError('This order has not been paid.', 409);
  if (order.orderStatus === 'delivered' || order.orderStatus === 'refunded') {
    throw new DomainError(`This order is already ${order.orderStatus}.`, 409);
  }
  if (order.providerOrderId && order.orderStatus === 'processing') {
    throw new DomainError('The provider already accepted this order. Refresh its status instead.', 409);
  }
  return submitToProvider(env, orderId, { force: true });
}

export async function markDataOrderDelivered(env: Env, orderId: string): Promise<DataOrder> {
  const order = await getOrder(env, orderId);
  if (!order) throw new DomainError('Order not found.', 404);
  if (order.paymentStatus !== 'paid') throw new DomainError('This order has not been paid.', 409);
  if (order.orderStatus === 'refunded') throw new DomainError('This order was refunded.', 409);
  return finishDelivered(env, orderId);
}

export async function refundDataOrderByAdmin(env: Env, orderId: string): Promise<DataOrder> {
  const order = await getOrder(env, orderId);
  if (!order) throw new DomainError('Order not found.', 404);
  if (order.orderStatus === 'delivered') throw new DomainError('This order was delivered; refund it from the payment gateway dashboard if you must.', 409);
  if (order.orderStatus !== 'failed') await updateOrder(env, orderId, { orderStatus: 'failed', completedAt: new Date().toISOString() });
  return refundOrder(env, orderId);
}

export const DATA_ORDER_STATUSES: DataOrderStatus[] = ['pending_payment', 'payment_confirmed', 'processing', 'delivered', 'failed', 'refunded'];
