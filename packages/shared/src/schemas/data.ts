import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────
// Internal records (Firestore shapes)
// ─────────────────────────────────────────────────────────────────────

export const DataBundleSchema = z.object({
  id: z.string(),                     // EliteData's bundleId
  network: z.string(),                // 'MTN', 'Telecel', etc — string so provider drift doesn't break us
  size: z.string(),                   // '1GB'
  label: z.string(),                  // 'MTN 1GB Data'
  providerCostGhs: z.number().nonnegative(),
  sellPriceGhs: z.number().nonnegative(),
  markupPercent: z.number().nonnegative(),
  availableToCustomers: z.boolean(),  // curated toggle
  active: z.boolean(),                // false when provider stops offering it
  displayOrder: z.number().int(),
  syncedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DataBundle = z.infer<typeof DataBundleSchema>;

export const DataOrderStatusSchema = z.enum([
  'pending_payment',
  'payment_confirmed',
  'processing',
  'delivered',
  'failed',
  'refunded',
]);
export type DataOrderStatus = z.infer<typeof DataOrderStatusSchema>;

export const DataPaymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'abandoned',
]);
export type DataPaymentStatus = z.infer<typeof DataPaymentStatusSchema>;

export const DataOrderSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  customerUid: z.string(),
  bundleId: z.string(),
  bundleLabel: z.string(),
  network: z.string(),
  size: z.string(),
  recipientNumber: z.string(),
  providerCostGhs: z.number().nonnegative(),
  sellPriceGhs: z.number().nonnegative(),
  paymentReference: z.string().nullable(),
  paymentStatus: DataPaymentStatusSchema,
  orderStatus: DataOrderStatusSchema,
  providerOrderId: z.string().nullable(),
  providerReference: z.string(),      // our clientReference sent to EliteData
  providerStatus: z.string().nullable(),  // raw status string from provider
  providerError: z.string().nullable(),
  idempotencyKey: z.string(),
  paymentConfirmedAt: z.string().nullable(),
  providerSubmittedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  /** Amount charged at checkout, in pesewas (sellPriceGhs × 100). */
  amountPesewas: z.number().int().nonnegative().optional(),
  /** Hosted checkout link, kept so a retried request reopens the same checkout. */
  checkoutUrl: z.string().nullable().optional(),
  customerEmail: z.string().nullable().optional(),
  /** Set when the outcome is unclear and an operator has to look. */
  needsReview: z.boolean().optional(),
  refundedAt: z.string().nullable().optional(),
  refundError: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DataOrder = z.infer<typeof DataOrderSchema>;

/** What a customer sees about their order (no costs or provider details). */
export const CustomerDataOrderSchema = z.object({
  id: z.string(),
  bundleId: z.string(),
  bundleLabel: z.string(),
  network: z.string(),
  size: z.string(),
  recipientNumber: z.string(),
  amountGhs: z.number().nonnegative(),
  paymentStatus: DataPaymentStatusSchema,
  orderStatus: DataOrderStatusSchema,
  /** Customer-safe explanation for failed / refunded orders. */
  message: z.string().nullable(),
  refundedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type CustomerDataOrder = z.infer<typeof CustomerDataOrderSchema>;

export const CreateDataOrderInputSchema = z.object({
  bundleId: z.string().min(1).max(100),
  recipientNumber: z.string().min(9).max(20),
  method: z.enum(['mobile_money', 'card']).optional(),
});
export type CreateDataOrderInput = z.infer<typeof CreateDataOrderInputSchema>;

// ─────────────────────────────────────────────────────────────────────
// EliteData API response shapes (what the provider sends back)
// ─────────────────────────────────────────────────────────────────────

export const EliteDataBalanceResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    username: z.string(),
    balance: z.number(),
    currency: z.string(),
    status: z.string(),
  }),
});
export type EliteDataBalanceResponse = z.infer<typeof EliteDataBalanceResponseSchema>;

export const EliteDataBundleSchema = z.object({
  bundleId: z.string(),
  network: z.string(),
  size: z.string(),
  price: z.number(),
  label: z.string(),
});
export type EliteDataBundle = z.infer<typeof EliteDataBundleSchema>;

export const EliteDataBundleListResponseSchema = z.object({
  success: z.literal(true),
  bundles: z.array(EliteDataBundleSchema),
});

export const EliteDataPurchaseResponseSchema = z.object({
  success: z.literal(true),
  order: z.object({
    id: z.string(),
    clientReference: z.string(),
    bundleSize: z.string(),
    pricePaid: z.number(),
    recipientNumber: z.string(),
    status: z.string(),
    createdAt: z.string(),
  }),
});
export type EliteDataPurchaseResponse = z.infer<typeof EliteDataPurchaseResponseSchema>;

export const EliteDataVerifyNumberResponseSchema = z.object({
  success: z.literal(true),
  status: z.string(),
  message: z.string(),
});
export type EliteDataVerifyNumberResponse = z.infer<typeof EliteDataVerifyNumberResponseSchema>;

export const EliteDataOrderStatusResponseSchema = z.object({
  success: z.literal(true),
  order: z.object({
    id: z.string(),
    clientReference: z.string(),
    bundleSize: z.string(),
    pricePaid: z.number(),
    recipientNumber: z.string(),
    status: z.string(),
    createdAt: z.string(),
  }),
});

// ─────────────────────────────────────────────────────────────────────
// Customer-facing shapes (safe projections — no provider cost)
// ─────────────────────────────────────────────────────────────────────

export const CustomerDataBundleSchema = z.object({
  id: z.string(),
  network: z.string(),
  size: z.string(),
  label: z.string(),
  sellPriceGhs: z.number().nonnegative(),
  displayOrder: z.number().int(),
});
export type CustomerDataBundle = z.infer<typeof CustomerDataBundleSchema>;

export const DataNumberVerificationSchema = z.object({
  phone: z.string(),
  status: z.enum(['verified', 'unverified', 'invalid']),
  message: z.string(),
  verifiedAt: z.string(),
  expiresAt: z.string(),
});
export type DataNumberVerification = z.infer<typeof DataNumberVerificationSchema>;

export const DataPricingConfigSchema = z.object({
  markupPercent: z.number().min(0).max(100),
  minPurchaseGhs: z.number().nonnegative().nullable(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});
export type DataPricingConfig = z.infer<typeof DataPricingConfigSchema>;

// ─────────────────────────────────────────────────────────────────────
// Admin inputs
// ─────────────────────────────────────────────────────────────────────

export const SetBundleAvailabilityInputSchema = z.object({
  available: z.boolean(),
});
export type SetBundleAvailabilityInput = z.infer<
  typeof SetBundleAvailabilityInputSchema
>;

export const SetBundlePriceInputSchema = z.object({
  sellPriceGhs: z.number().positive().max(10_000),
});
export type SetBundlePriceInput = z.infer<typeof SetBundlePriceInputSchema>;

export const UpdateBundleInputSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    sellPriceGhs: z.number().positive().max(10_000).optional(),
    displayOrder: z.number().int().min(0).max(99_999).optional(),
    availableToCustomers: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field must be provided.',
  });
export type UpdateBundleInput = z.infer<typeof UpdateBundleInputSchema>;

export const SetGlobalMarkupInputSchema = z.object({
  markupPercent: z.number().min(0).max(200),
});
export type SetGlobalMarkupInput = z.infer<typeof SetGlobalMarkupInputSchema>;