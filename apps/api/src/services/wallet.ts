import {
  firestoreCreateDoc,
  firestoreGetDoc,
  runTransaction,
  type FirestoreWrite,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  Wallet,
  WalletTransaction,
  WalletTransactionType,
} from '@profjero/shared';

const WALLETS = 'wallets';
const TXNS = 'walletTransactions';

// ---------- Types ----------

export interface WalletData {
  projectId: string;
  availableUnits: number;
  reservedUnits: number;
  lowBalanceThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplyLedgerParams {
  projectId: string;
  /** Deterministic doc ID for the ledger entry. */
  txnId: string;
  type: WalletTransactionType;
  availableDelta: number;
  reservedDelta: number;
  /** If set, throws unless the wallet has at least this many available units
   *  BEFORE the delta is applied. */
  requireAvailableAtLeast?: number;
  batchId?: string | null;
  recordId?: string | null;
  description?: string | null;
  createdBy: string;
  metadata?: Record<string, unknown> | null;
}

// ---------- Helpers ----------

export function parseWalletData(
  projectId: string,
  data: Record<string, unknown>,
): WalletData {
  const now = new Date().toISOString();
  return {
    projectId,
    availableUnits: Number(data.availableUnits ?? 0),
    reservedUnits: Number(data.reservedUnits ?? 0),
    lowBalanceThreshold:
      data.lowBalanceThreshold === null || data.lowBalanceThreshold === undefined
        ? null
        : Number(data.lowBalanceThreshold),
    createdAt: String(data.createdAt ?? now),
    updatedAt: String(data.updatedAt ?? now),
  };
}

export function toWallet(data: WalletData): Wallet {
  return {
    projectId: data.projectId,
    availableUnits: data.availableUnits,
    reservedUnits: data.reservedUnits,
    lowBalanceThreshold: data.lowBalanceThreshold,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Ensure a wallet exists for this project. Idempotent — safe to call from
 * any code path that touches wallet state.
 */
export async function ensureWallet(env: Env, projectId: string): Promise<WalletData> {
  const existing = await firestoreGetDoc(env, WALLETS, projectId);
  if (existing) return parseWalletData(projectId, existing.data);

  const now = new Date().toISOString();
  const initial = {
    projectId,
    availableUnits: 0,
    reservedUnits: 0,
    lowBalanceThreshold: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await firestoreCreateDoc(env, WALLETS, initial, { docId: projectId });
    return parseWalletData(projectId, initial);
  } catch (err) {
    // Race — another request created it between our read and create.
    const doc = await firestoreGetDoc(env, WALLETS, projectId);
    if (!doc) throw err;
    return parseWalletData(projectId, doc.data);
  }
}

// ---------- Core mutation ----------

async function applyLedgerEntry(
  env: Env,
  params: ApplyLedgerParams,
): Promise<{ wallet: WalletData; transaction: WalletTransaction }> {
  const { wallet, transactions } = await applyLedgerEntries(env, {
    projectId: params.projectId,
    requireAvailableAtLeast: params.requireAvailableAtLeast,
    entries: [params],
  });
  return { wallet, transaction: transactions[0] };
}

export interface LedgerEntryInput {
  txnId: string;
  type: WalletTransactionType;
  availableDelta: number;
  reservedDelta: number;
  batchId?: string | null;
  recordId?: string | null;
  description?: string | null;
  createdBy: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Apply several ledger entries to one wallet — plus any extra document
 * writes — in a single Firestore transaction. Either everything commits or
 * nothing does: the wallet balance, every ledger entry (deterministic IDs,
 * created with exists:false so a replay aborts) and the extra writes (e.g.
 * the SMS records a settlement covers).
 *
 * Used for bulk SMS: one transaction settles a whole chunk of recipients
 * instead of one transaction per recipient.
 */
export async function applyLedgerEntries(
  env: Env,
  params: {
    projectId: string;
    entries: LedgerEntryInput[];
    requireAvailableAtLeast?: number;
    extraWrites?: FirestoreWrite[];
  },
): Promise<{ wallet: WalletData; transactions: WalletTransaction[] }> {
  return runTransaction(env, async (txn) => {
    const walletDoc = await txn.get(WALLETS, params.projectId);
    if (!walletDoc) {
      // The wallet should always exist by the time we get here — either
      // created alongside the project, or via ensureWallet(). If it's
      // missing, that's a data-integrity bug worth surfacing.
      throw new Error(`Wallet not found for project "${params.projectId}"`);
    }

    const wallet = parseWalletData(params.projectId, walletDoc.data);

    if (
      params.requireAvailableAtLeast !== undefined &&
      wallet.availableUnits < params.requireAvailableAtLeast
    ) {
      throw new Error(
        `Insufficient available units: have ${wallet.availableUnits}, need ${params.requireAvailableAtLeast}`,
      );
    }

    const now = new Date().toISOString();
    let available = wallet.availableUnits;
    let reserved = wallet.reservedUnits;
    const transactions: WalletTransaction[] = [];

    for (const e of params.entries) {
      available += e.availableDelta;
      reserved += e.reservedDelta;
      if (available < 0) throw new Error('availableUnits would become negative');
      if (reserved < 0) throw new Error('reservedUnits would become negative');
      const t: WalletTransaction = {
        id: e.txnId,
        projectId: params.projectId,
        type: e.type,
        availableDelta: e.availableDelta,
        reservedDelta: e.reservedDelta,
        availableAfter: available,
        reservedAfter: reserved,
        batchId: e.batchId ?? null,
        recordId: e.recordId ?? null,
        amountGhs: null,
        description: e.description ?? null,
        createdBy: e.createdBy,
        createdAt: now,
        reversesTransactionId: null,
        metadata: e.metadata ?? null,
      };
      transactions.push(t);
      // Ledger entry — immutable, atomic create. If this doc ID already
      // exists, the transaction aborts, which is what idempotency requires.
      txn.write({ path: `${TXNS}/${e.txnId}`, fields: { ...t }, precondition: { exists: false } });
    }

    // Wallet update — partial update with optimistic-concurrency precondition.
    txn.write({
      path: `${WALLETS}/${params.projectId}`,
      fields: { availableUnits: available, reservedUnits: reserved, updatedAt: now },
      updateFieldPaths: ['availableUnits', 'reservedUnits', 'updatedAt'],
      precondition: walletDoc.updateTime ? { updateTime: walletDoc.updateTime } : { exists: true },
    });

    for (const w of params.extraWrites ?? []) txn.write(w);

    return {
      wallet: { ...wallet, availableUnits: available, reservedUnits: reserved, updatedAt: now },
      transactions,
    };
  });
}

// ---------- Public operations ----------

export interface ReserveArgs {
  projectId: string;
  batchId: string;
  units: number;
  description?: string;
  createdBy: string;
}

export async function reserveUnits(env: Env, args: ReserveArgs) {
  await ensureWallet(env, args.projectId);
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `reserve__${args.batchId}`,
    type: 'reserve',
    availableDelta: -args.units,
    reservedDelta: +args.units,
    requireAvailableAtLeast: args.units,
    batchId: args.batchId,
    description: args.description ?? null,
    createdBy: args.createdBy,
  });
}

export interface ConfirmArgs {
  projectId: string;
  batchId: string;
  recordId: string;
  units: number;
  createdBy: string;
}

export async function confirmUnits(env: Env, args: ConfirmArgs) {
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `confirm__${args.batchId}__${args.recordId}`,
    type: 'confirm',
    availableDelta: 0,
    reservedDelta: -args.units,
    batchId: args.batchId,
    recordId: args.recordId,
    createdBy: args.createdBy,
  });
}

export interface ReleaseArgs {
  projectId: string;
  batchId: string;
  recordId: string;
  units: number;
  reason?: string;
  createdBy: string;
}

export async function releaseUnits(env: Env, args: ReleaseArgs) {
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `release__${args.batchId}__${args.recordId}`,
    type: 'release',
    availableDelta: +args.units,
    reservedDelta: -args.units,
    batchId: args.batchId,
    recordId: args.recordId,
    description: args.reason ?? null,
    createdBy: args.createdBy,
  });
}

export interface ManualCreditArgs {
  projectId: string;
  units: number;
  description: string;
  adminUid: string;
}

export async function manualCredit(env: Env, args: ManualCreditArgs) {
  await ensureWallet(env, args.projectId);
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `manual_credit__${crypto.randomUUID()}`,
    type: 'manual_credit',
    availableDelta: +args.units,
    reservedDelta: 0,
    description: args.description,
    createdBy: args.adminUid,
    metadata: { reason: 'admin_manual_credit' },
  });
}

export interface ManualDebitArgs {
  projectId: string;
  units: number;
  description: string;
  adminUid: string;
}

export async function manualDebit(env: Env, args: ManualDebitArgs) {
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `manual_debit__${crypto.randomUUID()}`,
    type: 'manual_debit',
    availableDelta: -args.units,
    reservedDelta: 0,
    requireAvailableAtLeast: args.units,
    description: args.description,
    createdBy: args.adminUid,
    metadata: { reason: 'admin_manual_debit' },
  });
}

export interface SetThresholdArgs {
  projectId: string;
  threshold: number | null;
  adminUid: string;
}

/**
 * Update the wallet's low-balance threshold. Does not create a ledger entry —
 * the threshold is a configuration change, not a balance movement.
 */
export async function setWalletThreshold(
  env: Env,
  args: SetThresholdArgs,
): Promise<WalletData> {
  await ensureWallet(env, args.projectId);

  return runTransaction(env, async (txn) => {
    const walletDoc = await txn.get(WALLETS, args.projectId);
    if (!walletDoc) {
      throw new Error(`Wallet not found for project "${args.projectId}"`);
    }

    const wallet = parseWalletData(args.projectId, walletDoc.data);
    const now = new Date().toISOString();

    txn.write({
      path: `${WALLETS}/${args.projectId}`,
      fields: {
        lowBalanceThreshold: args.threshold,
        updatedAt: now,
      },
      updateFieldPaths: ['lowBalanceThreshold', 'updatedAt'],
      precondition: walletDoc.updateTime
        ? { updateTime: walletDoc.updateTime }
        : { exists: true },
    });

    return {
      ...wallet,
      lowBalanceThreshold: args.threshold,
      updatedAt: now,
    };
  });
}

export interface PaymentCreditArgs {
  projectId: string;
  /** Unique payment reference. Used as part of the ledger doc ID so a
   *  webhook replay can't double-credit. */
  reference: string;
  units: number;
  amountPesewas: number;
  currency: string;
  description: string;
}

/**
 * Credit a wallet as the result of a successful payment. Uses a
 * deterministic ledger entry ID (`purchase__{reference}`) so a second
 * call with the same reference fails at the Firestore level — that's the
 * idempotency guarantee.
 */
export async function creditFromPayment(
  env: Env,
  args: PaymentCreditArgs,
): Promise<{ wallet: WalletData; transaction: WalletTransaction }> {
  await ensureWallet(env, args.projectId);
  return applyLedgerEntry(env, {
    projectId: args.projectId,
    txnId: `purchase__${args.reference}`,
    type: 'purchase',
    availableDelta: +args.units,
    reservedDelta: 0,
    description: args.description,
    createdBy: 'system:paystack',
    metadata: {
      reference: args.reference,
      amountPesewas: args.amountPesewas,
      currency: args.currency,
    },
  });
}