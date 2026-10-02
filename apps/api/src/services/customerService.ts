import { firestoreGetDoc, runTransaction } from '../lib/firestore';
import type { Env } from '../types/env';
import type { Customer } from '@profjero/shared';

const STARTER_UNITS = 3;

export type CreateCustomerResult = {
  customer: Customer;
  projectId: string;
  projectName: string;
  wallet: {
    availableUnits: number;
    reservedUnits: number;
    totalUnits: number;
  };
  starterUnitsGranted: number;
  isNew: boolean;
};

/**
 * Short, opaque project ID. Firestore doc IDs allow up to 1500 bytes and
 * most URL-safe characters; a 20-char hex string is short enough to be
 * readable in logs and long enough to be collision-free for our scale.
 */
function newProjectId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

/**
 * Create a customer account: project + wallet + ledger + customer doc,
 * atomically.
 *
 * Idempotent:
 *   - Fast-path: check customers/{uid} before opening a transaction.
 *   - In-transaction: re-check under the transaction's read lock so a
 *     concurrent register can't double-create. If found, no writes are
 *     queued and the transaction commits empty — caller then loads the
 *     existing result.
 *
 * The caller is responsible for:
 *   - verifying the ID token first
 *   - calling setCustomerClaim AFTER this succeeds (doc-first ordering —
 *     see register.ts for the rationale)
 *
 * Ordering note: the customer doc is written in the same transaction as
 * the project, wallet, and ledger, so a partial failure is impossible.
 * That's a strict improvement over the sequential approach from the
 * earlier draft.
 */
export async function createCustomerAndProject(
  env: Env,
  args: {
    uid: string;
    email: string;
    displayName: string;
    organisationName: string;
    phone?: string;
  },
): Promise<CreateCustomerResult> {
  const { uid, email, displayName, organisationName, phone } = args;

  // Fast path — avoid opening a transaction for the common replay case.
  const existing = await firestoreGetDoc(env, 'customers', uid);
  if (existing) return loadExistingResult(env, existing.data, uid);

  const now = new Date().toISOString();
  const projectId = newProjectId();
  const ledgerId = `manual_credit__signup__${uid}`;

  const projectDoc = {
    name: organisationName,
    origin: 'customer',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const walletDoc = {
    projectId,
    availableUnits: STARTER_UNITS,
    reservedUnits: 0,
    lowBalanceThreshold: null,
    updatedAt: now,
  };

  const ledgerDoc = {
    id: ledgerId,
    projectId,
    type: 'manual_credit',
    availableDelta: STARTER_UNITS,
    reservedDelta: 0,
    availableAfter: STARTER_UNITS,
    reservedAfter: 0,
    batchId: null,
    recordId: null,
    amountGhs: null,
    description: 'Welcome credit',
    createdBy: 'system:signup_grant',
    createdAt: now,
    reversesTransactionId: null,
    metadata: { reason: 'signup_grant', uid },
  };

  const customerDoc = {
    uid,
    email,
    displayName,
    phone: phone ?? null,
    organisationName,
    organizationId: null,
    projectId,
    status: 'active',
    emailVerified: false,
    termsAcceptedAt: now,
    onboardingCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const outcome = await runTransaction(env, async (txn) => {
    // Re-check under the transaction lock. If another register won the
    // race between our fast-path check and now, bail out with no writes.
    const inTxn = await txn.get('customers', uid);
    if (inTxn) return { isNew: false as const };

    txn.write({
      path: `projects/${projectId}`,
      fields: projectDoc,
      precondition: { exists: false },
    });
    txn.write({
      path: `wallets/${projectId}`,
      fields: walletDoc,
      precondition: { exists: false },
    });
    txn.write({
      path: `walletTransactions/${ledgerId}`,
      fields: ledgerDoc,
      precondition: { exists: false },
    });
    txn.write({
      path: `customers/${uid}`,
      fields: customerDoc,
      precondition: { exists: false },
    });

    return { isNew: true as const };
  });

  if (!outcome.isNew) {
    const raceWinner = await firestoreGetDoc(env, 'customers', uid);
    if (!raceWinner) {
      // Extremely unlikely — the transaction said the doc exists but
      // the follow-up read didn't see it. Fail loudly rather than
      // returning a half-built response.
      throw new Error(
        `customerService race: txn reported existing customer ${uid} but read returned null`,
      );
    }
    return loadExistingResult(env, raceWinner.data, uid);
  }

  const customer: Customer = {
    uid,
    email,
    displayName,
    phone: phone ?? null,
    organisationName,
    organizationId: null,
    projectId,
    status: 'active',
    emailVerified: false,
    termsAcceptedAt: now,
    onboardingCompletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  return {
    customer,
    projectId,
    projectName: organisationName,
    wallet: {
      availableUnits: STARTER_UNITS,
      reservedUnits: 0,
      totalUnits: STARTER_UNITS,
    },
    starterUnitsGranted: STARTER_UNITS,
    isNew: true,
  };
}

async function loadExistingResult(
  env: Env,
  data: Record<string, unknown>,
  uid: string,
): Promise<CreateCustomerResult> {
  const projectId = data.projectId as string;
  const [walletDoc, projectDoc] = await Promise.all([
    firestoreGetDoc(env, 'wallets', projectId),
    firestoreGetDoc(env, 'projects', projectId),
  ]);

  const availableUnits = (walletDoc?.data.availableUnits as number) ?? 0;
  const reservedUnits = (walletDoc?.data.reservedUnits as number) ?? 0;

  return {
    customer: {
      uid,
      email: (data.email as string) ?? '',
      displayName: (data.displayName as string) ?? '',
      phone: (data.phone as string | null) ?? null,
      organisationName: (data.organisationName as string | null) ?? null,
      organizationId: (data.organizationId as string | null) ?? null,
      projectId,
      status: (data.status as Customer['status']) ?? 'active',
      emailVerified: (data.emailVerified as boolean) ?? false,
      termsAcceptedAt: (data.termsAcceptedAt as string | null) ?? null,
      onboardingCompletedAt:
        (data.onboardingCompletedAt as string | null) ?? null,
      createdAt: (data.createdAt as string) ?? '',
      updatedAt: (data.updatedAt as string) ?? '',
    },
    projectId,
    projectName: (projectDoc?.data.name as string) ?? '',
    wallet: {
      availableUnits,
      reservedUnits,
      totalUnits: availableUnits + reservedUnits,
    },
    starterUnitsGranted: STARTER_UNITS,
    isNew: false,
  };
}