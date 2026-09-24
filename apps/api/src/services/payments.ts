import {
  createPayment,
  getPaymentByReference,
  updatePayment,
} from '../repositories/payments';
import { getPackageById } from '../repositories/pricing';
import { getProject } from '../repositories/projects';
import { creditFromPayment } from './wallet';
import {
  initializeTransaction,
  verifyTransaction,
} from '../providers/paystackClient';
import { DomainError } from '../lib/domainError';
import type { Env } from '../types/env';
import type { Payment } from '@profjero/shared';

function newReference(): string {
  return `pj_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export interface InitiateArgs {
  projectId: string;
  customerEmail: string;
  packageId?: string;
  units?: number;
  amountPesewas?: number;
  callbackUrl?: string;
  createdBy: string;
}

export interface InitiateResult {
  payment: Payment;
  authorizationUrl: string;
}

export async function initiatePayment(
  env: Env,
  args: InitiateArgs,
): Promise<InitiateResult> {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new DomainError('Payments are not configured.', 500);
  }

  const project = await getProject(env, args.projectId);
  if (!project) throw new DomainError('Project not found.', 404);
  if (project.status === 'archived') {
    throw new DomainError('Cannot create payments for archived projects.', 409);
  }

  // Resolve units + amount.
  let units: number;
  let amountPesewas: number;
  let packageId: string | null = null;

  if (args.packageId) {
    const pkg = await getPackageById(env, args.packageId);
    if (!pkg) throw new DomainError('Package not found.', 404);
    if (!pkg.active) throw new DomainError('Package is not active.', 409);
    if (pkg.service !== 'sms') {
      throw new DomainError(
        'Only SMS packages are supported for now.',
        400,
      );
    }
    units = pkg.units;
    amountPesewas = Math.round(pkg.priceGhs * 100);
    packageId = pkg.id;
  } else if (args.units !== undefined && args.amountPesewas !== undefined) {
    if (args.units <= 0 || args.amountPesewas <= 0) {
      throw new DomainError('Units and amount must be positive.', 400);
    }
    units = args.units;
    amountPesewas = args.amountPesewas;
  } else {
    throw new DomainError(
      'Provide a packageId, or both units and amountPesewas.',
      400,
    );
  }

  const reference = newReference();

  const init = await initializeTransaction(env, {
    email: args.customerEmail,
    amountPesewas,
    reference,
    currency: 'GHS',
    callbackUrl: args.callbackUrl,
    metadata: {
      projectId: args.projectId,
      packageId,
      units,
    },
  });

  const payment = await createPayment(env, {
    reference,
    projectId: args.projectId,
    packageId,
    units,
    amountPesewas,
    currency: 'GHS',
    customerEmail: args.customerEmail,
    authorizationUrl: init.authorizationUrl,
    accessCode: init.accessCode,
    createdBy: args.createdBy,
  });

  return { payment, authorizationUrl: init.authorizationUrl };
}

/**
 * Mark a payment successful and credit the wallet. Idempotent — a second
 * call with the same reference returns without double-crediting. The
 * deterministic ledger entry ID (`purchase__{reference}`) is the
 * ultimate guard.
 */
export async function markPaymentSuccessful(
  env: Env,
  reference: string,
  webhookData?: Record<string, unknown> | null,
): Promise<{ payment: Payment; walletCredited: boolean }> {
  const payment = await getPaymentByReference(env, reference);
  if (!payment) throw new DomainError('Payment not found.', 404);

  // Already processed — no-op.
  if (payment.walletCreditedAt) {
    return { payment, walletCredited: false };
  }

  if (payment.status === 'refunded') {
    throw new DomainError('Payment is already refunded.', 409);
  }

  const now = new Date().toISOString();

  // Credit the wallet first. If this throws, we haven't moved status yet —
  // the webhook will be retried by Paystack and we'll try again.
  let txnId: string | null = null;
  try {
    const result = await creditFromPayment(env, {
      projectId: payment.projectId,
      reference: payment.reference,
      units: payment.units,
      amountPesewas: payment.amountPesewas,
      currency: payment.currency,
      description: `Paystack payment ${payment.reference}`,
    });
    txnId = result.transaction.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // The one benign case: the ledger entry already exists (previous
    // webhook got through but we crashed before updating the payment doc).
    // In that case, just mark the payment successful.
    const isAlreadyCredited =
      msg.includes('FAILED_PRECONDITION') ||
      msg.includes('already exists') ||
      msg.includes('document already exists');

    if (!isAlreadyCredited) throw err;
  }

  const updated = await updatePayment(env, reference, {
    status: 'success',
    paidAt: now,
    walletCreditedAt: now,
    walletTransactionId: txnId ?? `purchase__${payment.reference}`,
    failureReason: null,
    ...(webhookData !== undefined ? { webhookData } : {}),
  });

  return { payment: updated, walletCredited: true };
}

export async function markPaymentFailed(
  env: Env,
  reference: string,
  reason: string,
  webhookData?: Record<string, unknown> | null,
): Promise<Payment> {
  const payment = await getPaymentByReference(env, reference);
  if (!payment) throw new DomainError('Payment not found.', 404);
  if (payment.walletCreditedAt) return payment; // don't downgrade a success

  return updatePayment(env, reference, {
    status: 'failed',
    failureReason: reason,
    ...(webhookData !== undefined ? { webhookData } : {}),
  });
}

/**
 * Confirm the payment against Paystack's API and credit the wallet if
 * successful. Used by the manual verify endpoint (when a webhook was
 * missed) and by the webhook handler as a second confirmation step.
 */
export async function verifyAndSettlePayment(
  env: Env,
  reference: string,
): Promise<{ payment: Payment; walletCredited: boolean }> {
  const payment = await getPaymentByReference(env, reference);
  if (!payment) throw new DomainError('Payment not found.', 404);

  if (payment.walletCreditedAt) {
    return { payment, walletCredited: false };
  }

  const result = await verifyTransaction(env, reference);
  if (!result) {
    throw new DomainError('Paystack verification failed.', 502);
  }

  if (!result.success) {
    const failed = await markPaymentFailed(
      env,
      reference,
      `Paystack reports status: ${result.status}`,
    );
    return { payment: failed, walletCredited: false };
  }

  // Guard against a mismatched amount (shouldn't happen, but cheap to check).
  if (result.amountPesewas !== payment.amountPesewas) {
    throw new DomainError(
      `Paystack amount mismatch: expected ${payment.amountPesewas}, got ${result.amountPesewas}.`,
      502,
    );
  }

  return markPaymentSuccessful(env, reference);
}