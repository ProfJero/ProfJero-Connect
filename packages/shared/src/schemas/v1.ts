import { z } from 'zod';
import { SmsBatchSchema } from './sms';
import { SenderIdAssignmentSchema } from './senderId';
import { WalletTransactionSchema } from './wallet';

export const V1MeResponseSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  keyId: z.string(),
  keyName: z.string(),
  keyKind: z.enum(['secret', 'publishable']),
  time: z.string().datetime(),
});
export type V1MeResponse = z.infer<typeof V1MeResponseSchema>;

/**
 * Wallet view for a client. Publishable keys see `availableUnits` and
 * `totalUnits` only; the `reservedUnits` split and the admin-managed
 * threshold are nulled out for them.
 */
export const V1WalletResponseSchema = z.object({
  availableUnits: z.number().int().nonnegative(),
  reservedUnits: z.number().int().nonnegative().nullable(),
  totalUnits: z.number().int().nonnegative(),
  lowBalanceThreshold: z.number().int().nonnegative().nullable(),
  updatedAt: z.string().datetime(),
});
export type V1WalletResponse = z.infer<typeof V1WalletResponseSchema>;

export const V1WalletTransactionListResponseSchema = z.object({
  transactions: z.array(WalletTransactionSchema),
  count: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
});
export type V1WalletTransactionListResponse = z.infer<
  typeof V1WalletTransactionListResponseSchema
>;

export const V1BatchListResponseSchema = z.object({
  batches: z.array(SmsBatchSchema),
  count: z.number().int().nonnegative(),
  /** Pass back as `?before=<nextCursor>` for the next page. Null on last page. */
  nextCursor: z.string().nullable(),
});
export type V1BatchListResponse = z.infer<typeof V1BatchListResponseSchema>;

export const V1SenderIdListResponseSchema = z.object({
  senderIds: z.array(SenderIdAssignmentSchema),
  count: z.number().int().nonnegative(),
});
export type V1SenderIdListResponse = z.infer<
  typeof V1SenderIdListResponseSchema
>;