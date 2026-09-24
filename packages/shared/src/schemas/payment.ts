import { z } from 'zod';

export const PaymentStatusSchema = z.enum([
  'pending',
  'success',
  'failed',
  'abandoned',
  'refunded',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentProviderSchema = z.enum(['paystack', 'manual']);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const PaymentSchema = z.object({
  reference: z.string(),
  provider: PaymentProviderSchema,
  projectId: z.string(),
  /** Populated when the payment was created from a package. */
  packageId: z.string().nullable(),
  /** Units to credit on success. */
  units: z.number().int().positive(),
  /** Amount in smallest currency unit (pesewas for GHS). */
  amountPesewas: z.number().int().positive(),
  currency: z.string(),
  status: PaymentStatusSchema,
  customerEmail: z.string().nullable(),
  authorizationUrl: z.string().nullable(),
  accessCode: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  paidAt: z.string().datetime().nullable(),
  /** Set once we credit the wallet. Guards idempotency. */
  walletCreditedAt: z.string().datetime().nullable(),
  /** Ledger entry ID, for cross-reference. */
  walletTransactionId: z.string().nullable(),
  failureReason: z.string().nullable(),
  /** Raw Paystack webhook payload, stored for debugging. */
  webhookData: z.record(z.string(), z.unknown()).nullable(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const PaymentListResponseSchema = z.object({
  payments: z.array(PaymentSchema),
  count: z.number().int().nonnegative(),
});
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;

export const PaymentResponseSchema = z.object({
  payment: PaymentSchema,
});
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

// ---------- Inputs ----------

export const InitiatePaymentInputSchema = z
  .object({
    projectId: z.string().min(1),
    customerEmail: z.string().email(),
    /** Either choose a package OR supply a raw amount + units. */
    packageId: z.string().min(1).optional(),
    units: z.number().int().positive().max(10_000_000).optional(),
    amountPesewas: z.number().int().positive().max(100_000_000).optional(),
    /** Where Paystack redirects after payment. */
    callbackUrl: z.string().url().optional(),
  })
  .refine(
    (d) =>
      d.packageId !== undefined ||
      (d.units !== undefined && d.amountPesewas !== undefined),
    {
      message: 'Provide packageId, or both units and amountPesewas.',
      path: ['packageId'],
    },
  );
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentInputSchema>;

export const InitiatePaymentResponseSchema = z.object({
  payment: PaymentSchema,
  authorizationUrl: z.string().url(),
});
export type InitiatePaymentResponse = z.infer<
  typeof InitiatePaymentResponseSchema
>;

export const VerifyPaymentResponseSchema = z.object({
  payment: PaymentSchema,
  /** True when this call actually credited the wallet (vs. was already credited). */
  walletCredited: z.boolean(),
});
export type VerifyPaymentResponse = z.infer<
  typeof VerifyPaymentResponseSchema
>;