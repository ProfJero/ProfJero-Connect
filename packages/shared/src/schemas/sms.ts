import { z } from 'zod';

export const SmsRecordStatusSchema = z.enum([
  'queued',
  'submitting',
  'submitted',
  'delivered',
  'failed',
  'unknown',
  'released',
]);
export type SmsRecordStatus = z.infer<typeof SmsRecordStatusSchema>;

export const SmsBatchStatusSchema = z.enum([
  'queued',
  'submitting',
  'submitted',
  'partial',
  'completed',
  'failed',
]);
export type SmsBatchStatus = z.infer<typeof SmsBatchStatusSchema>;

export const SmsRecordSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  projectId: z.string(),
  recipient: z.string(),
  message: z.string(),
  senderId: z.string().nullable(),
  unitsPerMessage: z.number().int().positive(),
  status: SmsRecordStatusSchema,
  unitsReserved: z.number().int().nonnegative(),
  unitsCharged: z.number().int().nonnegative(),
  unitsReleased: z.number().int().nonnegative(),
  providerMessageId: z.string().nullable(),
  providerError: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SmsRecord = z.infer<typeof SmsRecordSchema>;

export const SmsBatchSchema = z.object({
  id: z.string(),
  projectId: z.string(),

  messageEncoding: z.enum(['GSM-7', 'UCS-2']).nullable(),
  messageSegments: z.number().int().positive().nullable(),

  apiKeyId: z.string().nullable(),
  senderId: z.string().nullable(),
  message: z.string(),
  status: SmsBatchStatusSchema,
  totalRecipients: z.number().int().nonnegative(),
  totalUnitsReserved: z.number().int().nonnegative(),
  totalUnitsCharged: z.number().int().nonnegative(),
  totalUnitsReleased: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  unknownCount: z.number().int().nonnegative(),
  /** Number of records that have confirmed delivery from the provider.
   *  Subset of submittedCount. Incremented when a record transitions to
   *  `delivered`. Never decremented. */
  deliveredCount: z.number().int().nonnegative(),
  idempotencyKey: z.string().nullable(),
  /** True when `message` is a template rendered per recipient. */
  personalized: z.boolean().optional(),
  /** Set when the batch was sent by a scheduled campaign. */
  campaignId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type SmsBatch = z.infer<typeof SmsBatchSchema>;

export const SendSmsInputSchema = z.object({
  recipients: z
    .array(z.string().min(1).max(30))
    .min(1)
    .max(1000),
  message: z.string().min(1).max(1000),
  senderId: z.string().min(1).max(11),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

export const SendSmsResponseSchema = z.object({
  batch: SmsBatchSchema,
  records: z.array(SmsRecordSchema),
});
export type SendSmsResponse = z.infer<typeof SendSmsResponseSchema>;

export const SmsBatchResponseSchema = SendSmsResponseSchema;
export type SmsBatchResponse = z.infer<typeof SmsBatchResponseSchema>;

export const SmsBatchListItemSchema = SmsBatchSchema.extend({
  projectName: z.string(),
  projectStatus: z.string(),
});
export type SmsBatchListItem = z.infer<typeof SmsBatchListItemSchema>;

export const SmsBatchListResponseSchema = z.object({
  batches: z.array(SmsBatchListItemSchema),
  count: z.number().int().nonnegative(),
});
export type SmsBatchListResponse = z.infer<typeof SmsBatchListResponseSchema>;

export const SmsBatchDetailResponseSchema = z.object({
  batch: SmsBatchSchema,
  projectName: z.string(),
  records: z.array(SmsRecordSchema),
});
export type SmsBatchDetailResponse = z.infer<
  typeof SmsBatchDetailResponseSchema
>;

export const ReconciliationOutcomeSchema = z.enum([
  'confirmed',      // Arkesel says delivered or submitted → we charged the units
  'released',       // Arkesel says failed, or no record, or hard age limit → units returned
  'kept_unknown',   // Couldn't reach Arkesel; retry next sweep
  'error',
]);
export type ReconciliationOutcome = z.infer<typeof ReconciliationOutcomeSchema>;

export const ReconciliationDetailSchema = z.object({
  recordId: z.string(),
  batchId: z.string(),
  projectId: z.string(),
  recipient: z.string(),
  ageMinutes: z.number().nonnegative(),
  /** Whether this record had a provider message ID we could poll. */
  hadProviderId: z.boolean(),
  /** Raw Arkesel status string, if we got a response. */
  arkeselStatus: z.string().nullable(),
  outcome: ReconciliationOutcomeSchema,
  reason: z.string().nullable(),
});
export type ReconciliationDetail = z.infer<typeof ReconciliationDetailSchema>;

export const ReconciliationResponseSchema = z.object({
  scanned: z.number().int().nonnegative(),
  confirmed: z.number().int().nonnegative(),
  released: z.number().int().nonnegative(),
  keptUnknown: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  dryRun: z.boolean(),
  olderThanMinutes: z.number().int().nonnegative(),
  details: z.array(ReconciliationDetailSchema),
});
export type ReconciliationResponse = z.infer<typeof ReconciliationResponseSchema>;

export const BatchCleanupOutcomeSchema = z.enum([
  'cleaned',
  'skipped_has_reserve',
  'skipped_too_young',
  'error',
]);
export type BatchCleanupOutcome = z.infer<typeof BatchCleanupOutcomeSchema>;

export const BatchCleanupDetailSchema = z.object({
  batchId: z.string(),
  projectId: z.string(),
  recipients: z.number().int().nonnegative(),
  recordsMarked: z.number().int().nonnegative(),
  ageMinutes: z.number().nonnegative(),
  outcome: BatchCleanupOutcomeSchema,
  reason: z.string().nullable(),
});
export type BatchCleanupDetail = z.infer<typeof BatchCleanupDetailSchema>;

export const BatchCleanupResponseSchema = z.object({
  scanned: z.number().int().nonnegative(),
  cleaned: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  dryRun: z.boolean(),
  olderThanMinutes: z.number().int().nonnegative(),
  details: z.array(BatchCleanupDetailSchema),
});
export type BatchCleanupResponse = z.infer<typeof BatchCleanupResponseSchema>;

// ---------- Poll / webhook results ----------

export const DeliveryTransitionSchema = z.object({
  recordId: z.string(),
  batchId: z.string(),
  providerMessageId: z.string(),
  previousStatus: SmsRecordStatusSchema,
  newStatus: SmsRecordStatusSchema,
  changed: z.boolean(),
});
export type DeliveryTransition = z.infer<typeof DeliveryTransitionSchema>;

export const PollStatusResponseSchema = z.object({
  polled: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  notFound: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  details: z.array(DeliveryTransitionSchema),
});
export type PollStatusResponse = z.infer<typeof PollStatusResponseSchema>;

export const PollStatusInputSchema = z.object({
  /** Explicit list of record IDs to poll. If omitted, the endpoint picks
   *  recent submitted records automatically. */
  recordIds: z.array(z.string()).max(500).optional(),
  /** Only pick records that haven't been updated in this many minutes.
   *  Ignored when recordIds is provided. Default: 2. */
  olderThanMinutes: z.number().int().min(1).max(1440).optional(),
  /** Max number of records to process. Ignored when recordIds is provided. */
  limit: z.number().int().min(1).max(500).optional(),
});
export type PollStatusInput = z.infer<typeof PollStatusInputSchema>;