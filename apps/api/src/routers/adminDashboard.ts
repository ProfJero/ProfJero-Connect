import { Hono } from 'hono';
import { DashboardResponseSchema } from '@profjero/shared';
import {
  firestoreListDocs,
  firestoreQuery,
} from '../lib/firestore';
import { listProjects } from '../repositories/projects';
import { listAllWallets } from '../repositories/wallets';
import type { AuthVariables, Env } from '../types/env';

export const adminDashboardRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

const DAYS_WINDOW = 7;
const TOP_PROJECTS_LIMIT = 5;
const RECENT_BATCHES_LIMIT = 5;
const RECENT_TXNS_LIMIT = 5;

/** YYYY-MM-DD from an ISO timestamp, in UTC. */
function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Single-call aggregate for the Dashboard page.
 *
 * Current implementation fetches batches up to a cap and reduces in the
 * Worker. Fine for thousands of batches. When that cap becomes the
 * bottleneck, replace the fetch-and-reduce with either (a) rollup counter
 * documents maintained on write, or (b) Firestore's aggregation queries.
 * Either is a swap-in; the response shape stays the same.
 */
adminDashboardRouter.get('/', async (c) => {
  const [projects, wallets, batchDocs, txnDocs] = await Promise.all([
    listProjects(c.env, {}),
    listAllWallets(c.env),
    firestoreListDocs(c.env, 'smsBatches', { pageSize: 1000 }),
    firestoreQuery(c.env, 'walletTransactions', [], {
      orderBy: { field: 'createdAt', direction: 'DESCENDING' },
      limit: RECENT_TXNS_LIMIT * 4, // fetch a few extra to filter by project later
    }),
  ]);

  // ---- Project counts ----
  const active = projects.filter((p) => p.status === 'active').length;
  const suspended = projects.filter((p) => p.status === 'suspended').length;
  const archived = projects.filter((p) => p.status === 'archived').length;

  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  // ---- Wallet totals ----
  const fundedWallets = wallets.filter((w) => w.availableUnits > 0).length;
  let totalAvailableUnits = 0;
  let totalReservedUnits = 0;
  for (const w of wallets) {
    totalAvailableUnits += w.availableUnits;
    totalReservedUnits += w.reservedUnits;
  }

  // ---- SMS totals + daily + top projects (single pass) ----
  const daily = new Map<
    string,
    { batches: number; submitted: number; failed: number; charged: number }
  >();
  const perProject = new Map<
    string,
    { submitted: number; failed: number; charged: number }
  >();

  let totalRecipients = 0;
  let totalSubmitted = 0;
  let totalFailed = 0;
  let totalUnknown = 0;
  let totalUnitsCharged = 0;
  let totalUnitsReleased = 0;

  for (const doc of batchDocs.docs) {
    const recipients = Number(doc.data.totalRecipients ?? 0);
    const submitted = Number(doc.data.submittedCount ?? 0);
    const failed = Number(doc.data.failedCount ?? 0);
    const unknown = Number(doc.data.unknownCount ?? 0);
    const charged = Number(doc.data.totalUnitsCharged ?? 0);
    const released = Number(doc.data.totalUnitsReleased ?? 0);
    const projectId = String(doc.data.projectId ?? '');
    const createdAt = String(doc.data.createdAt ?? '');

    totalRecipients += recipients;
    totalSubmitted += submitted;
    totalFailed += failed;
    totalUnknown += unknown;
    totalUnitsCharged += charged;
    totalUnitsReleased += released;

    // Daily bucket
    if (createdAt) {
      const key = dateKey(createdAt);
      const bucket = daily.get(key) ?? {
        batches: 0,
        submitted: 0,
        failed: 0,
        charged: 0,
      };
      bucket.batches += 1;
      bucket.submitted += submitted;
      bucket.failed += failed;
      bucket.charged += charged;
      daily.set(key, bucket);
    }

    // Per-project bucket
    if (projectId) {
      const bucket = perProject.get(projectId) ?? {
        submitted: 0,
        failed: 0,
        charged: 0,
      };
      bucket.submitted += submitted;
      bucket.failed += failed;
      bucket.charged += charged;
      perProject.set(projectId, bucket);
    }
  }

  // ---- Build last N days (including empty days) ----
  const now = new Date();
  const dailyPoints: Array<{
    date: string;
    batches: number;
    submitted: number;
    failed: number;
    charged: number;
  }> = [];
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    const key = d.toISOString().slice(0, 10);
    const bucket = daily.get(key);
    dailyPoints.push({
      date: key,
      batches: bucket?.batches ?? 0,
      submitted: bucket?.submitted ?? 0,
      failed: bucket?.failed ?? 0,
      charged: bucket?.charged ?? 0,
    });
  }

  // ---- Top projects by submitted count ----
  const topProjects = [...perProject.entries()]
    .map(([projectId, stats]) => ({
      projectId,
      projectName: projectName.get(projectId) ?? '(unknown project)',
      submitted: stats.submitted,
      failed: stats.failed,
      charged: stats.charged,
    }))
    .sort((a, b) => b.submitted - a.submitted)
    .slice(0, TOP_PROJECTS_LIMIT);

  // ---- Recent batches (already sorted desc by listDocs? No — sort here) ----
  const recentBatches = [...batchDocs.docs]
    .sort((a, b) =>
      String(b.data.createdAt ?? '').localeCompare(
        String(a.data.createdAt ?? ''),
      ),
    )
    .slice(0, RECENT_BATCHES_LIMIT)
    .map((d) => ({
      id: d.id,
      projectName: projectName.get(String(d.data.projectId ?? '')) ?? '(unknown)',
      status: String(d.data.status ?? 'unknown'),
      totalRecipients: Number(d.data.totalRecipients ?? 0),
      submittedCount: Number(d.data.submittedCount ?? 0),
      failedCount: Number(d.data.failedCount ?? 0),
      createdAt: String(d.data.createdAt ?? new Date().toISOString()),
    }));

  // ---- Recent transactions (top N after filtering empties) ----
  const recentTransactions = txnDocs
    .slice(0, RECENT_TXNS_LIMIT)
    .map((d) => ({
      id: d.id,
      projectName: projectName.get(String(d.data.projectId ?? '')) ?? '(unknown)',
      type: String(d.data.type ?? 'unknown'),
      availableDelta: Number(d.data.availableDelta ?? 0),
      availableAfter: Number(d.data.availableAfter ?? 0),
      description: (d.data.description as string | null) ?? null,
      createdAt: String(d.data.createdAt ?? new Date().toISOString()),
    }));

  return c.json(
    DashboardResponseSchema.parse({
      counts: {
        totalProjects: projects.length,
        activeProjects: active,
        suspendedProjects: suspended,
        archivedProjects: archived,
        fundedWallets,
        totalWallets: wallets.length,
      },
      walletTotals: {
        totalAvailableUnits,
        totalReservedUnits,
      },
      smsTotals: {
        totalBatches: batchDocs.docs.length,
        totalRecipients,
        totalSubmitted,
        totalFailed,
        totalUnknown,
        totalUnitsCharged,
        totalUnitsReleased,
      },
      daily: dailyPoints,
      topProjects,
      recentBatches,
      recentTransactions,
    }),
  );
});