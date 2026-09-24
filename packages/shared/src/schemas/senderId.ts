import { z } from 'zod';

// ----- Validation -----

/**
 * Sender ID values follow Arkesel's rule: 1-11 characters, spaces count.
 * Allowed: letters, digits, underscore, hyphen, space. Leading/trailing
 * whitespace is trimmed before validation.
 */
export const SenderIdValueSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length >= 1 && v.length <= 11, {
    message: 'Sender ID must be 1-11 characters (spaces count).',
  })
  .refine((v) => /^[A-Za-z0-9_\- ]+$/.test(v), {
    message:
      'Sender ID may only contain letters, numbers, spaces, hyphens, and underscores.',
  });

export const SenderIdValueStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
]);
export type SenderIdValueStatus = z.infer<typeof SenderIdValueStatusSchema>;

export const SenderIdAssignmentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'revoked',
]);
export type SenderIdAssignmentStatus = z.infer<
  typeof SenderIdAssignmentStatusSchema
>;

// ----- Entities -----

export const SenderIdSchema = z.object({
  value: z.string(),
  status: SenderIdValueStatusSchema,
  requestedByProjectId: z.string().nullable(),
  requestedAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullable(),
  approvedByAdminUid: z.string().nullable(),
  rejectedAt: z.string().datetime().nullable(),
  rejectedByAdminUid: z.string().nullable(),
  rejectionReason: z.string().nullable(),
});
export type SenderId = z.infer<typeof SenderIdSchema>;

export const SenderIdAssignmentSchema = z.object({
  projectId: z.string(),
  senderId: z.string(),
  status: SenderIdAssignmentStatusSchema,
  requestedAt: z.string().datetime(),
  decidedAt: z.string().datetime().nullable(),
  decidedByAdminUid: z.string().nullable(),
  notes: z.string().nullable(),
});
export type SenderIdAssignment = z.infer<typeof SenderIdAssignmentSchema>;

// ----- Combined views -----

export const SenderIdWithAssignmentsSchema = SenderIdSchema.extend({
  assignments: z.array(
    SenderIdAssignmentSchema.extend({
      projectName: z.string(),
    }),
  ),
});
export type SenderIdWithAssignments = z.infer<
  typeof SenderIdWithAssignmentsSchema
>;

export const SenderIdListResponseSchema = z.object({
  senderIds: z.array(SenderIdWithAssignmentsSchema),
  count: z.number().int().nonnegative(),
});
export type SenderIdListResponse = z.infer<typeof SenderIdListResponseSchema>;

export const PendingQueueSchema = z.object({
  pendingValues: z.array(
    SenderIdSchema.extend({
      requestedByProjectName: z.string(),
    }),
  ),
  pendingAssignments: z.array(
    SenderIdAssignmentSchema.extend({
      projectName: z.string(),
    }),
  ),
  total: z.number().int().nonnegative(),
});
export type PendingQueue = z.infer<typeof PendingQueueSchema>;

// ----- Inputs -----

export const RequestSenderIdInputSchema = z.object({
  value: SenderIdValueSchema,
});
export type RequestSenderIdInput = z.infer<typeof RequestSenderIdInputSchema>;

export const AdminCreateSenderIdInputSchema = z.object({
  value: SenderIdValueSchema,
  /**
   * When true, value AND assignment are created already-approved.
   * For admin fast-path after manual Arkesel registration.
   */
  autoApprove: z.boolean().optional(),
  notes: z.string().max(300).nullable().optional(),
});
export type AdminCreateSenderIdInput = z.infer<
  typeof AdminCreateSenderIdInputSchema
>;

export const RejectSenderIdInputSchema = z.object({
  reason: z.string().min(1).max(300),
});
export type RejectSenderIdInput = z.infer<typeof RejectSenderIdInputSchema>;

// ----- Responses -----

export const SenderIdResponseSchema = z.object({
  senderId: SenderIdSchema,
});
export type SenderIdResponse = z.infer<typeof SenderIdResponseSchema>;

export const SenderIdWithAssignmentsResponseSchema = z.object({
  senderId: SenderIdWithAssignmentsSchema,
});
export type SenderIdWithAssignmentsResponse = z.infer<
  typeof SenderIdWithAssignmentsResponseSchema
>;

export const ProjectSenderIdListResponseSchema = z.object({
  senderIds: z.array(SenderIdAssignmentSchema),
  count: z.number().int().nonnegative(),
});
export type ProjectSenderIdListResponse = z.infer<
  typeof ProjectSenderIdListResponseSchema
>;