import { z } from 'zod';

export const ProviderServiceSchema = z.enum([
  'sms',
  'data',
  'airtime',
  'payment',
]);
export type ProviderService = z.infer<typeof ProviderServiceSchema>;

/**
 * Opaque provider ID. Admin UI only ever sees these — never the underlying
 * provider name. Pattern: `{service}_gw_{2-digit sequence}`.
 * Examples: sms_gw_01, sms_gw_02, data_gw_01, airtime_gw_01, payment_gw_01.
 */
export const ProviderIdSchema = z
  .string()
  .regex(/^[a-z]+_gw_\d{2}$/, {
    message: 'Provider ID must match e.g. sms_gw_01',
  });
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const ProviderStatusSchema = z.enum(['active', 'inactive', 'error']);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

/**
 * Public shape returned to admin UI. Deliberately omits `driver` — the
 * driver identifies the real underlying provider and stays server-side.
 */
export const ProviderSchema = z.object({
  id: z.string(),
  service: ProviderServiceSchema,
  label: z.string(),
  status: ProviderStatusSchema,
  costPerUnitGhs: z.number().nonnegative().nullable(),
  credits: z.number().int().nullable(),
  mainBalanceGhs: z.number().nonnegative().nullable(),
  balanceCheckedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
});
export type Provider = z.infer<typeof ProviderSchema>;

// ---------- Provider request log ----------

export const ProviderRequestOperationSchema = z.enum([
  'send_sms',
  'batch_reports',
  'message_report',
  'balance_check',
]);
export type ProviderRequestOperation = z.infer<
  typeof ProviderRequestOperationSchema
>;

export const ProviderRequestStatusSchema = z.enum(['success', 'error']);
export type ProviderRequestStatus = z.infer<
  typeof ProviderRequestStatusSchema
>;

export const ProviderRequestSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  operation: ProviderRequestOperationSchema,
  status: ProviderRequestStatusSchema,
  httpStatus: z.number().int().nullable(),
  durationMs: z.number().int().nonnegative(),
  summary: z.string(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type ProviderRequest = z.infer<typeof ProviderRequestSchema>;

// ---------- Inputs ----------

export const UpdateProviderInputSchema = z.object({
  costPerUnitGhs: z.number().nonnegative().max(1000).nullable().optional(),
  label: z.string().min(1).max(60).optional(),
});
export type UpdateProviderInput = z.infer<typeof UpdateProviderInputSchema>;

// ---------- Responses ----------

export const ProviderListResponseSchema = z.object({
  providers: z.array(ProviderSchema),
  count: z.number().int().nonnegative(),
});
export type ProviderListResponse = z.infer<typeof ProviderListResponseSchema>;

export const ProviderResponseSchema = z.object({
  provider: ProviderSchema,
});
export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;

export const ProviderRequestListResponseSchema = z.object({
  requests: z.array(ProviderRequestSchema),
  count: z.number().int().nonnegative(),
});
export type ProviderRequestListResponse = z.infer<
  typeof ProviderRequestListResponseSchema
>;