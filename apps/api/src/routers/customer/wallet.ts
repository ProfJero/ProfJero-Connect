import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { customerAuth } from '../../middleware/customerAuth';
import {
  firestoreGetDoc,
  firestoreQuery,
  type QueryFilter,
} from '../../lib/firestore';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Every route in this file requires a verified customer.
router.use('*', customerAuth);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimit(raw: string | undefined): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

/**
 * GET /customer/wallet
 *
 * Returns the caller's wallet balance. Same shape the admin dashboard
 * and the /v1/wallet endpoint use, so the frontend Wallet page can be
 * wired without adaptation.
 */
router.get('/wallet', async (c) => {
  const projectId = c.get('projectId')!;
  const wallet = await firestoreGetDoc(c.env, 'wallets', projectId);

  if (!wallet) {
    // Should never happen for a real customer — register creates both.
    throw new HTTPException(404, { message: 'Wallet not found.' });
  }

  const availableUnits = (wallet.data.availableUnits as number) ?? 0;
  const reservedUnits = (wallet.data.reservedUnits as number) ?? 0;

  return c.json({
    availableUnits,
    reservedUnits,
    totalUnits: availableUnits + reservedUnits,
    lowBalanceThreshold:
      (wallet.data.lowBalanceThreshold as number | null) ?? null,
    updatedAt: (wallet.data.updatedAt as string | null) ?? null,
  });
});

/**
 * GET /customer/wallet/transactions
 *
 * Ledger history, newest first. Same pagination contract as
 * /v1/wallet/transactions: pass nextCursor as ?before= on the next call.
 *
 * NOTE: This query filters on projectId + orders by createdAt. Firestore
 * requires a composite index for that combination. If this is the first
 * call that uses it, Firestore will return a 500 with a link in the error
 * body to create the index — one click, then it works. The index almost
 * certainly already exists because /v1/wallet/transactions uses the same
 * shape, but if not, watch for it on first run.
 */
router.get('/wallet/transactions', async (c) => {
  const projectId = c.get('projectId')!;
  const limit = parseLimit(c.req.query('limit'));
  const before = c.req.query('before');

  const filters: QueryFilter[] = [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ];
  if (before) {
    filters.push({ field: 'createdAt', op: 'LESS_THAN', value: before });
  }

  // Fetch limit + 1 to detect whether there's a next page.
  const docs = await firestoreQuery(c.env, 'walletTransactions', filters, {
    orderBy: { field: 'createdAt', direction: 'DESCENDING' },
    limit: limit + 1,
  });

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor =
    hasMore && page.length > 0
      ? ((page[page.length - 1].data.createdAt as string) ?? null)
      : null;

  return c.json({
    transactions: page.map((d) => d.data),
    count: page.length,
    nextCursor,
  });
});

export { router as customerWalletRouter };