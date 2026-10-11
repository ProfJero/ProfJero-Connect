import type { Payment } from '@profjero/shared';
import { firestoreQuery } from '../lib/firestore';
import { scrubProviderNames } from '../lib/scrub';
import { DomainError } from '../lib/domainError';
import { getPaymentByReference } from '../repositories/payments';
import { getPricingSettings } from '../repositories/pricing';
import { verifyAndSettlePayment } from './payments';
import type { Env } from '../types/env';

/**
 * Wallet top-ups shared by the customer app (/customer/payments) and the
 * public API (/v1/payments): server-side pricing, listing and re-checking.
 */

/**
 * Public payment projection. Drops the gateway name, access code, checkout
 * URL and raw webhook payload; scrubs the failure reason.
 */
export function toPublicPayment(p: Payment) {
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
export type PublicPayment = ReturnType<typeof toPublicPayment>;

/** Price a custom number of units at the SMS unit price (pesewas). */
export async function priceCustomUnits(env: Env, units: number): Promise<number> {
  const pricing = await getPricingSettings(env, 'sms');
  if (!pricing.active || pricing.unitPriceGhs === null || pricing.unitPriceGhs <= 0) {
    throw new DomainError('Custom amounts are not available right now. Please choose a package.', 400);
  }
  if (pricing.minPurchaseUnits !== null && units < pricing.minPurchaseUnits) {
    throw new DomainError(`The minimum purchase is ${pricing.minPurchaseUnits.toLocaleString('en-US')} units.`, 400);
  }
  if (pricing.maxPurchaseUnits !== null && units > pricing.maxPurchaseUnits) {
    throw new DomainError(`The maximum purchase is ${pricing.maxPurchaseUnits.toLocaleString('en-US')} units.`, 400);
  }
  const amountPesewas = Math.round(units * pricing.unitPriceGhs * 100);
  if (amountPesewas < 100) throw new DomainError('The minimum payment is GH₵1.00.', 400);
  return amountPesewas;
}

/** A project's payments, newest first, plus headline totals. */
export async function listProjectPayments(env: Env, projectId: string) {
  const docs = await firestoreQuery(env, 'payments', [{ field: 'projectId', op: 'EQUAL', value: projectId }]);
  const payments: PublicPayment[] = docs
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
      failureReason: scrubProviderNames((d.data.failureReason as string | null) ?? null),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
  return { payments, summary };
}

/** 404 for other tenants' references — never leak that they exist. */
export async function loadOwnPayment(env: Env, projectId: string, reference: string): Promise<Payment> {
  const payment = await getPaymentByReference(env, reference);
  if (!payment || payment.projectId !== projectId) throw new DomainError('Payment not found.', 404);
  return payment;
}

/**
 * Re-check a pending payment with the gateway and credit the wallet if it
 * was paid (idempotent on the reference). An unfinished checkout stays
 * pending; one abandoned for 30+ minutes is marked abandoned. Gateway
 * errors leave it pending — the webhook remains the source of truth.
 */
export async function refreshPayment(
  env: Env,
  projectId: string,
  reference: string,
): Promise<{ payment: PublicPayment; walletCredited: boolean }> {
  const payment = await loadOwnPayment(env, projectId, reference);
  if (payment.walletCreditedAt || payment.status !== 'pending') {
    return { payment: toPublicPayment(payment), walletCredited: false };
  }
  try {
    const result = await verifyAndSettlePayment(env, payment.reference, {
      failOnIncomplete: false,
      abandonAfterMs: 30 * 60 * 1000,
    });
    return { payment: toPublicPayment(result.payment), walletCredited: result.walletCredited };
  } catch (err) {
    console.error('[payments] verify failed:', err);
    const latest = await loadOwnPayment(env, projectId, payment.reference);
    return { payment: toPublicPayment(latest), walletCredited: false };
  }
}
