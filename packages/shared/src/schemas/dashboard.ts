import { z } from 'zod';

export const DashboardCountsSchema = z.object({
  totalProjects: z.number().int().nonnegative(),
  activeProjects: z.number().int().nonnegative(),
  suspendedProjects: z.number().int().nonnegative(),
  archivedProjects: z.number().int().nonnegative(),
  fundedWallets: z.number().int().nonnegative(),
  totalWallets: z.number().int().nonnegative(),
});

export const DashboardWalletTotalsSchema = z.object({
  totalAvailableUnits: z.number().int().nonnegative(),
  totalReservedUnits: z.number().int().nonnegative(),
});

export const DashboardSmsTotalsSchema = z.object({
  totalBatches: z.number().int().nonnegative(),
  totalRecipients: z.number().int().nonnegative(),
  totalSubmitted: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
  totalUnknown: z.number().int().nonnegative(),
  totalUnitsCharged: z.number().int().nonnegative(),
  totalUnitsReleased: z.number().int().nonnegative(),
});

export const DashboardDailyPointSchema = z.object({
  /** YYYY-MM-DD in UTC. */
  date: z.string(),
  batches: z.number().int().nonnegative(),
  submitted: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  charged: z.number().int().nonnegative(),
});
export type DashboardDailyPoint = z.infer<typeof DashboardDailyPointSchema>;

export const DashboardTopProjectSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  submitted: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  charged: z.number().int().nonnegative(),
});

export const DashboardRecentBatchSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  status: z.string(),
  totalRecipients: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const DashboardRecentTransactionSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  type: z.string(),
  availableDelta: z.number().int(),
  availableAfter: z.number().int(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const DashboardResponseSchema = z.object({
  counts: DashboardCountsSchema,
  walletTotals: DashboardWalletTotalsSchema,
  smsTotals: DashboardSmsTotalsSchema,
  daily: z.array(DashboardDailyPointSchema),
  topProjects: z.array(DashboardTopProjectSchema),
  recentBatches: z.array(DashboardRecentBatchSchema),
  recentTransactions: z.array(DashboardRecentTransactionSchema),
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;