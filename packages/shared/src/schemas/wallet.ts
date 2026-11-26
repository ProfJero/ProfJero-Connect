import { z } from 'zod';

export const WalletTransactionTypeSchema = z.enum([
  'reserve',
  'confirm',
  'release',
  'purchase',
  'refund',
  'manual_credit',
  'manual_debit',
  'reversal',
  'adjustment',
]);
export type WalletTransactionType = z.infer<typeof WalletTransactionTypeSchema>;

export const WalletSchema = z.object({
  projectId: z.string(),
  availableUnits: z.number().int().nonnegative(),
  reservedUnits: z.number().int().nonnegative(),
  lowBalanceThreshold: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Wallet = z.infer<typeof WalletSchema>;

export const WalletTransactionSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: WalletTransactionTypeSchema,
  availableDelta: z.number().int(),
  reservedDelta: z.number().int(),
  // Denormalized snapshots — cheap to display, easy to audit.
  availableAfter: z.number().int().nonnegative(),
  reservedAfter: z.number().int().nonnegative(),
  // Contextual fields. All optional; nulled out when not applicable.
  batchId: z.string().nullable(),
  recordId: z.string().nullable(),
  amountGhs: z.number().nullable(),
  description: z.string().nullable(),
  createdBy: z.string(), // admin uid, or 'system'
  createdAt: z.string().datetime(),
  reversesTransactionId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

// --- response wrappers ---

export const WalletProjectRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
});

export const WalletListEntrySchema = z.object({
  wallet: WalletSchema,
  project: WalletProjectRefSchema,
});
export type WalletListEntry = z.infer<typeof WalletListEntrySchema>;

export const WalletListResponseSchema = z.object({
  wallets: z.array(WalletListEntrySchema),
  count: z.number().int().nonnegative(),
});
export type WalletListResponse = z.infer<typeof WalletListResponseSchema>;

export const WalletDetailResponseSchema = z.object({
  wallet: WalletSchema,
  project: WalletProjectRefSchema,
  transactions: z.array(WalletTransactionSchema),
});
export type WalletDetailResponse = z.infer<typeof WalletDetailResponseSchema>;

export const WalletMutationResponseSchema = z.object({
  wallet: WalletSchema,
  transaction: WalletTransactionSchema,
});
export type WalletMutationResponse = z.infer<typeof WalletMutationResponseSchema>;

// --- input schemas ---

export const ManualCreditInputSchema = z.object({
  units: z.number().int().positive().max(10_000_000),
  description: z.string().min(1).max(200),
});
export type ManualCreditInput = z.infer<typeof ManualCreditInputSchema>;

export const ManualDebitInputSchema = z.object({
  units: z.number().int().positive().max(10_000_000),
  description: z.string().min(1).max(200),
});
export type ManualDebitInput = z.infer<typeof ManualDebitInputSchema>;

export const ReserveInputSchema = z.object({
  batchId: z.string().min(1).max(100),
  units: z.number().int().positive().max(10_000_000),
  description: z.string().max(200).optional(),
});
export type ReserveInput = z.infer<typeof ReserveInputSchema>;

export const ConfirmInputSchema = z.object({
  batchId: z.string().min(1).max(100),
  recordId: z.string().min(1).max(100),
  units: z.number().int().positive().max(10_000_000),
});
export type ConfirmInput = z.infer<typeof ConfirmInputSchema>;

export const ReleaseInputSchema = z.object({
  batchId: z.string().min(1).max(100),
  recordId: z.string().min(1).max(100),
  units: z.number().int().positive().max(10_000_000),
  reason: z.string().max(200).optional(),
});
export type ReleaseInput = z.infer<typeof ReleaseInputSchema>;

export const WalletTransactionWithProjectSchema = WalletTransactionSchema.extend({
  projectName: z.string(),
});
export type WalletTransactionWithProject = z.infer<
  typeof WalletTransactionWithProjectSchema
>;

export const WalletTransactionListResponseSchema = z.object({
  transactions: z.array(WalletTransactionWithProjectSchema),
  count: z.number().int().nonnegative(),
});
export type WalletTransactionListResponse = z.infer<
  typeof WalletTransactionListResponseSchema
>;

export const SetWalletThresholdInputSchema = z.object({
  /** null clears the threshold. */
  threshold: z.number().int().nonnegative().max(10_000_000).nullable(),
});
export type SetWalletThresholdInput = z.infer<
  typeof SetWalletThresholdInputSchema
>;