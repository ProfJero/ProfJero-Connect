import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────
// Internal records (Firestore shapes)
// ─────────────────────────────────────────────────────────────────────

export const DataBundleSchema = z.object({
  id: z.string(),                     // EliteData's bundleId
  network: z.string(),                // 'MTN', 'Telecel', etc — string so provider drift doesn't break us
  size: z.string(),                   // '1GB'
  label: z.string(),                  // 'MTN 1GB Data'
  providerCostGhs: z.number().nonnegative(),     // what we pay (API price)
  sellPriceGhs: z.number().nonnegative(),
  markupPercent: z.number().nonnegative(),
  /** Price the provider's bundle list reported (kept for comparison). */
  providerListedPriceGhs: z.number().nonnegative().nullable().optional(),
  /** Provider's public guest price — our price should stay at or below it. */
  guestPriceGhs: z.number().nonnegative().nullable().optional(),
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
  /** Bundle price the customer saw, in pesewas (sellPriceGhs × 100). */
  amountPesewas: z.number().int().nonnegative().optional(),
  /**
   * What the gateway actually charged: price + service charge. Older
   * orders have none (then it equals amountPesewas).
   */
  chargePesewas: z.number().int().nonnegative().optional(),
  serviceChargePesewas: z.number().int().nonnegative().optional(),
  /** Gateway access code for the in-page payment window. */
  accessCode: z.string().nullable().optional(),
  /** Bought without an account (tracked by order ID or phone number). */
  guest: z.boolean().optional(),
  /** Last time we asked the provider about this order. */
  providerCheckedAt: z.string().nullable().optional(),
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

/** Buying without an account: same as above plus an optional email for receipts. */
export const GuestDataOrderInputSchema = CreateDataOrderInputSchema.extend({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .email('Enter a valid email address, or leave it empty.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type GuestDataOrderInput = z.infer<typeof GuestDataOrderInputSchema>;

/** One line of "track my order" results (no payment or provider details). */
export const TrackedDataOrderSchema = z.object({
  id: z.string(),
  bundleLabel: z.string(),
  network: z.string(),
  size: z.string(),
  recipientNumber: z.string(),
  orderStatus: DataOrderStatusSchema,
  paymentStatus: DataPaymentStatusSchema,
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type TrackedDataOrder = z.infer<typeof TrackedDataOrderSchema>;

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
  bundleId: z.union([z.string(), z.number()]).transform((v) => String(v)),
  network: z.string(),
  size: z.union([z.string(), z.number()]).transform((v) => String(v)),
  price: z.coerce.number(),
  label: z.string().nullish().transform((v) => v ?? ''),
});
export type EliteDataBundle = z.infer<typeof EliteDataBundleSchema>;

export const EliteDataBundleListResponseSchema = z.object({
  success: z.literal(true),
  bundles: z.array(EliteDataBundleSchema),
});

/**
 * The provider's order object. Its documentation and its live API differ
 * (the live API sends a numeric `id` and leaves out bundleSize, pricePaid,
 * recipientNumber and createdAt), so only the fields we act on are read,
 * every one is optional, and ids are accepted as strings or numbers.
 * A reply that can't be read must never be mistaken for a failure.
 */
const idLike = z.union([z.string(), z.number()]).transform((v) => String(v));
const optStr = z.union([z.string(), z.number()]).transform((v) => String(v)).nullish();

export const EliteDataOrderSchema = z
  .object({
    id: idLike.nullish(),
    orderId: idLike.nullish(),
    clientReference: optStr,
    apiReference: optStr,
    reference: optStr,
    status: optStr,
    bundleSize: optStr,
    pricePaid: z.union([z.number(), z.string()]).nullish(),
    recipientNumber: optStr,
    createdAt: optStr,
  })
  .passthrough()
  .transform((o) => ({
    ...o,
    id: o.id ?? o.orderId ?? null,
    clientReference: o.clientReference ?? o.apiReference ?? o.reference ?? null,
    status: o.status ?? null,
  }));
export type EliteDataOrder = z.infer<typeof EliteDataOrderSchema>;

export const EliteDataPurchaseResponseSchema = z
  .object({
    success: z.boolean().optional(),
    order: EliteDataOrderSchema.optional(),
    data: EliteDataOrderSchema.optional(),
  })
  .passthrough();
export type EliteDataPurchaseResponse = z.infer<typeof EliteDataPurchaseResponseSchema>;

export const EliteDataVerifyNumberResponseSchema = z.object({
  success: z.literal(true),
  status: z.string(),
  message: z.string(),
});
export type EliteDataVerifyNumberResponse = z.infer<typeof EliteDataVerifyNumberResponseSchema>;

export const EliteDataOrderStatusResponseSchema = z
  .object({
    success: z.boolean().optional(),
    order: EliteDataOrderSchema.optional(),
    data: z.union([EliteDataOrderSchema, z.array(EliteDataOrderSchema)]).optional(),
    orders: z.array(EliteDataOrderSchema).optional(),
  })
  .passthrough();

/** Webhook body the provider POSTs when an order's status changes. */
export const EliteDataWebhookSchema = z
  .object({
    orderId: idLike.nullish(),
    id: idLike.nullish(),
    apiReference: optStr,
    clientReference: optStr,
    reference: optStr,
    status: optStr,
    phone: optStr,
    network: optStr,
    size: optStr,
  })
  .passthrough();
export type EliteDataWebhook = z.infer<typeof EliteDataWebhookSchema>;

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