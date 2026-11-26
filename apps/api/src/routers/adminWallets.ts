import { listAllTransactions } from '../repositories/wallets';
import { listProjects } from '../repositories/projects';
import { WalletTransactionListResponseSchema } from '@profjero/shared';

import { setWalletThreshold } from '../services/wallet';
import { SetWalletThresholdInputSchema } from '@profjero/shared';

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  ConfirmInputSchema,
  ManualCreditInputSchema,
  ManualDebitInputSchema,
  ReleaseInputSchema,
  ReserveInputSchema,
  WalletDetailResponseSchema,
  WalletListResponseSchema,
  WalletMutationResponseSchema,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  getWalletForProject,
  listAllWallets,
  listTransactions,
} from '../repositories/wallets';
import {
  confirmUnits,
  ensureWallet,
  manualCredit,
  manualDebit,
  releaseUnits,
  reserveUnits,
  toWallet,
} from '../services/wallet';
import { firestoreGetDoc } from '../lib/firestore';
import type { AuthVariables, Env } from '../types/env';

export const adminWalletsRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function validationError(
  issues: { path: PropertyKey[]; message: string }[],
): never {
  const detail = issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  throw new HTTPException(400, { message: `Validation failed — ${detail}` });
}

async function projectRef(env: Env, projectId: string) {
  const doc = await firestoreGetDoc(env, 'projects', projectId);
  if (!doc) throw new HTTPException(404, { message: 'Project not found.' });
  return {
    id: projectId,
    name: String(doc.data.name ?? projectId),
    status: String(doc.data.status ?? 'unknown'),
  };
}

// --- List all wallets (joined with project refs) ---
adminWalletsRouter.get('/', async (c) => {
  const [wallets, projectList] = await Promise.all([
    listAllWallets(c.env),
    (await import('../repositories/projects')).listProjects(c.env, {}),
  ]);

  const byProject = new Map(wallets.map((w) => [w.projectId, w]));

  // Include projects that don't have a wallet doc yet, with a zero-balance
  // placeholder — so the list always reflects every project.
  const entries = projectList.map((p) => ({
    wallet:
      byProject.get(p.id) ?? {
        projectId: p.id,
        availableUnits: 0,
        reservedUnits: 0,
        lowBalanceThreshold: null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    project: { id: p.id, name: p.name, status: p.status },
  }));

  return c.json(
    WalletListResponseSchema.parse({ wallets: entries, count: entries.length }),
  );
});

// --- Cross-project transaction list ---
adminWalletsRouter.get('/transactions', async (c) => {
  const limitParam = c.req.query('limit');
  const limit = limitParam
    ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200)
    : 50;

  const [transactions, projects] = await Promise.all([
    listAllTransactions(c.env, limit),
    listProjects(c.env, {}),
  ]);

  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  const enriched = transactions.map((t) => ({
    ...t,
    projectName: nameById.get(t.projectId) ?? '(unknown project)',
  }));

  return c.json(
    WalletTransactionListResponseSchema.parse({
      transactions: enriched,
      count: enriched.length,
    }),
  );
});

// --- Single wallet with recent transactions ---
adminWalletsRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await projectRef(c.env, projectId);

  // Lazy-init if the wallet has never been touched. Cheap, idempotent.
  const walletData = await ensureWallet(c.env, projectId);
  const transactions = await listTransactions(c.env, projectId, 20);

  return c.json(
    WalletDetailResponseSchema.parse({
      wallet: toWallet(walletData),
      project,
      transactions,
    }),
  );
});

// --- Manual credit ---
adminWalletsRouter.post(
  '/:projectId/credit',
  requireRole('super_admin', 'finance'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = ManualCreditInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const { wallet, transaction } = await manualCredit(c.env, {
      projectId,
      units: parsed.data.units,
      description: parsed.data.description,
      adminUid: admin.uid,
    });

    return c.json(
      WalletMutationResponseSchema.parse({
        wallet: toWallet(wallet),
        transaction,
      }),
      201,
    );
  },
);

// --- Manual debit ---
adminWalletsRouter.post(
  '/:projectId/debit',
  requireRole('super_admin', 'finance'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = ManualDebitInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    try {
      const { wallet, transaction } = await manualDebit(c.env, {
        projectId,
        units: parsed.data.units,
        description: parsed.data.description,
        adminUid: admin.uid,
      });
      return c.json(
        WalletMutationResponseSchema.parse({
          wallet: toWallet(wallet),
          transaction,
        }),
        201,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Insufficient available units')) {
        throw new HTTPException(409, { message: msg });
      }
      throw err;
    }
  },
);

// --- Reserve (manual — normally invoked by the SMS send flow) ---
adminWalletsRouter.post(
  '/:projectId/reserve',
  requireRole('super_admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = ReserveInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    try {
      const { wallet, transaction } = await reserveUnits(c.env, {
        projectId,
        batchId: parsed.data.batchId,
        units: parsed.data.units,
        description: parsed.data.description,
        createdBy: admin.uid,
      });
      return c.json(
        WalletMutationResponseSchema.parse({
          wallet: toWallet(wallet),
          transaction,
        }),
        201,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Insufficient available units')) {
        throw new HTTPException(409, { message: msg });
      }
      if (msg.includes('409') || msg.includes('FAILED_PRECONDITION')) {
        throw new HTTPException(409, {
          message: `Reserve already exists for batch "${parsed.data.batchId}".`,
        });
      }
      throw err;
    }
  },
);

// --- Confirm (manual — normally invoked by the SMS send flow) ---
adminWalletsRouter.post(
  '/:projectId/confirm',
  requireRole('super_admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = ConfirmInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    try {
      const { wallet, transaction } = await confirmUnits(c.env, {
        projectId,
        batchId: parsed.data.batchId,
        recordId: parsed.data.recordId,
        units: parsed.data.units,
        createdBy: admin.uid,
      });
      return c.json(
        WalletMutationResponseSchema.parse({
          wallet: toWallet(wallet),
          transaction,
        }),
        201,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('409') || msg.includes('FAILED_PRECONDITION')) {
        throw new HTTPException(409, {
          message: `Confirm already exists for ${parsed.data.batchId}/${parsed.data.recordId}.`,
        });
      }
      throw err;
    }
  },
);

// --- Release (manual — normally invoked by the SMS send flow) ---
adminWalletsRouter.post(
  '/:projectId/release',
  requireRole('super_admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = ReleaseInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    try {
      const { wallet, transaction } = await releaseUnits(c.env, {
        projectId,
        batchId: parsed.data.batchId,
        recordId: parsed.data.recordId,
        units: parsed.data.units,
        reason: parsed.data.reason,
        createdBy: admin.uid,
      });
      return c.json(
        WalletMutationResponseSchema.parse({
          wallet: toWallet(wallet),
          transaction,
        }),
        201,
      );
        } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('409') || msg.includes('FAILED_PRECONDITION')) {
        throw new HTTPException(409, {
          message: `Release already exists for ${parsed.data.batchId}/${parsed.data.recordId}.`,
        });
      }
      if (msg.includes('reservedUnits would become negative')) {
        throw new HTTPException(409, {
          message: `Cannot release ${parsed.data.units} units — not enough reserved.`,
        });
      }
      throw err;
    }
  },
);

// --- Set low-balance threshold ---
adminWalletsRouter.post(
  '/:projectId/threshold',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const projectId = c.req.param('projectId');
    await projectRef(c.env, projectId);

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = SetWalletThresholdInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const walletData = await setWalletThreshold(c.env, {
      projectId,
      threshold: parsed.data.threshold,
      adminUid: c.get('admin').uid,
    });

    return c.json({ wallet: toWallet(walletData) }, 200);
  },
);