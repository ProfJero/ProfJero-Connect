import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  firestoreGetDoc,
  firestoreQuery,
  type QueryFilter,
} from '../../lib/firestore';
import { scrubProviderNames } from '../../lib/scrub';
import { setWalletThreshold } from '../../services/wallet';
import { CustomerSetThresholdSchema } from '@profjero/shared';
import { parseBody } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// customerAuth is applied once for the whole surface in ./index.ts.

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
  let before = c.req.query('before');
  // view=summary drops per-recipient `confirm` entries. A send's wallet
  // impact is already fully described by its `reserve` (units leave the
  // available balance) and any `release` (units come back), so the
  // customer sees one row per send instead of one per recipient.
  const summary = c.req.query('view') === 'summary';
  // Optional comma-separated type filter, e.g. types=purchase,manual_credit
  const typesParam = c.req.query('types');
  const types = typesParam ? new Set(typesParam.split(',').filter(Boolean)) : null;
  const keep = (type: unknown) =>
    !(summary && type === 'confirm') && (!types || types.has(String(type)));

  const collected: Array<Record<string, unknown>> = [];
  let exhausted = false;
  // Bounded loop: a big send can produce hundreds of confirm entries in a
  // row, so keep paging (same index, same query) until the page is full.
  for (let i = 0; i < 10 && collected.length <= limit; i++) {
    const filters: QueryFilter[] = [
      { field: 'projectId', op: 'EQUAL', value: projectId },
    ];
    if (before) {
      filters.push({ field: 'createdAt', op: 'LESS_THAN', value: before });
    }
    const batchSize = summary || types ? Math.max(limit * 4, 100) : limit + 1;
    const docs = await firestoreQuery(c.env, 'walletTransactions', filters, {
      orderBy: { field: 'createdAt', direction: 'DESCENDING' },
      limit: batchSize,
    });
    for (const d of docs) {
      if (!keep(d.data.type)) continue;
      collected.push(d.data);
    }
    if (docs.length < batchSize) {
      exhausted = true;
      break;
    }
    before = docs[docs.length - 1].data.createdAt as string;
  }

  const hasMore = collected.length > limit || !exhausted;
  const page = collected.slice(0, limit);
  const nextCursor =
    hasMore && page.length > 0
      ? ((page[page.length - 1].createdAt as string) ?? null)
      : null;

  return c.json({
    transactions: page.map((d) => ({
      ...d,
      // Ledger text is written for operators and may name a provider.
      description: scrubProviderNames((d.description as string | null) ?? null),
      createdBy: scrubProviderNames(String(d.createdBy ?? '')),
      metadata: null,
    })),
    count: page.length,
    nextCursor,
  });
});

/**
 * PUT /customer/wallet/threshold — { threshold: number | null }.
 * A low-balance alert fires when a send takes the balance below this.
 */
router.put('/wallet/threshold', async (c) => {
  const customer = c.get('customer')!;
  const { threshold } = await parseBody(c, CustomerSetThresholdSchema);
  const wallet = await setWalletThreshold(c.env, {
    projectId: c.get('projectId')!,
    threshold,
    adminUid: `customer:${customer.uid}`,
  });
  return c.json({ lowBalanceThreshold: wallet.lowBalanceThreshold });
});

export { router as customerWalletRouter };