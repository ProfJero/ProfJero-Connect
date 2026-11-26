import {
  firestoreGetDoc,
  firestoreListDocs,
  firestoreQuery,
} from '../lib/firestore';
import { ensureWallet, parseWalletData, toWallet } from '../services/wallet';
import type { Env } from '../types/env';
import type { Wallet, WalletTransaction } from '@profjero/shared';

const WALLETS = 'wallets';
const TXNS = 'walletTransactions';
const PROJECTS = 'projects';

export async function getWalletForProject(
  env: Env,
  projectId: string,
): Promise<Wallet | null> {
  const doc = await firestoreGetDoc(env, WALLETS, projectId);
  if (!doc) return null;
  return toWallet(parseWalletData(projectId, doc.data));
}

export async function listAllWallets(env: Env): Promise<Wallet[]> {
  const { docs } = await firestoreListDocs(env, WALLETS, { pageSize: 500 });
  return docs.map((d) => toWallet(parseWalletData(d.id, d.data)));
}

/**
 * Fetch a project's recent wallet transactions, newest first.
 * Uses the projectId field on each ledger entry (no composite index needed).
 */
export async function listTransactions(
  env: Env,
  projectId: string,
  limit = 20,
): Promise<WalletTransaction[]> {
  const docs = await firestoreQuery(
    env,
    TXNS,
    [{ field: 'projectId', op: 'EQUAL', value: projectId }],
    {
      orderBy: { field: 'createdAt', direction: 'DESCENDING' },
      limit,
    },
  );

  return docs.map((d) => ({
    id: String(d.data.id ?? d.id),
    projectId: String(d.data.projectId ?? projectId),
    type: d.data.type as WalletTransaction['type'],
    availableDelta: Number(d.data.availableDelta ?? 0),
    reservedDelta: Number(d.data.reservedDelta ?? 0),
    availableAfter: Number(d.data.availableAfter ?? 0),
    reservedAfter: Number(d.data.reservedAfter ?? 0),
    batchId: (d.data.batchId as string | null) ?? null,
    recordId: (d.data.recordId as string | null) ?? null,
    amountGhs:
      d.data.amountGhs === null || d.data.amountGhs === undefined
        ? null
        : Number(d.data.amountGhs),
    description: (d.data.description as string | null) ?? null,
    createdBy: String(d.data.createdBy ?? 'system'),
    createdAt: String(d.data.createdAt ?? new Date().toISOString()),
    reversesTransactionId:
      (d.data.reversesTransactionId as string | null) ?? null,
    metadata:
      (d.data.metadata as Record<string, unknown> | null) ?? null,
  }));
}

/**
 * Fetch the N most recent wallet transactions across all projects, newest
 * first. Single-field orderBy uses Firestore's automatic index — no
 * composite index needed.
 */
export async function listAllTransactions(
  env: Env,
  limit = 50,
): Promise<WalletTransaction[]> {
  const docs = await firestoreQuery(
    env,
    TXNS,
    [],
    {
      orderBy: { field: 'createdAt', direction: 'DESCENDING' },
      limit,
    },
  );

  return docs.map((d) => ({
    id: String(d.data.id ?? d.id),
    projectId: String(d.data.projectId ?? ''),
    type: d.data.type as WalletTransaction['type'],
    availableDelta: Number(d.data.availableDelta ?? 0),
    reservedDelta: Number(d.data.reservedDelta ?? 0),
    availableAfter: Number(d.data.availableAfter ?? 0),
    reservedAfter: Number(d.data.reservedAfter ?? 0),
    batchId: (d.data.batchId as string | null) ?? null,
    recordId: (d.data.recordId as string | null) ?? null,
    amountGhs:
      d.data.amountGhs === null || d.data.amountGhs === undefined
        ? null
        : Number(d.data.amountGhs),
    description: (d.data.description as string | null) ?? null,
    createdBy: String(d.data.createdBy ?? 'system'),
    createdAt: String(d.data.createdAt ?? new Date().toISOString()),
    reversesTransactionId:
      (d.data.reversesTransactionId as string | null) ?? null,
    metadata: (d.data.metadata as Record<string, unknown> | null) ?? null,
  }));
}

/**
 * Called from createProject — gives every new project a wallet up front so
 * the wallet list endpoint never has to lazily create them.
 */
export async function ensureWalletForProject(
  env: Env,
  projectId: string,
): Promise<void> {
  await ensureWallet(env, projectId);
}

// Re-export for the router — avoids a second import path in the router file.
export { PROJECTS };