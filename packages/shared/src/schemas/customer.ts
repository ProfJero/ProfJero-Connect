import { z } from 'zod';

/**
 * Customer account schema. Source of truth for /customer/* payloads
 * and the customers/{uid} Firestore doc.
 *
 * Mirrors AdminSchema in shape conventions (status: active|suspended,
 * null defaults for optional profile fields).
 */
export const CustomerSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  phone: z.string().nullable(),
  organisationName: z.string().max(120).nullable(),
  organizationId: z.string().nullable(), // reserved for future team support
  projectId: z.string().min(1),
  status: z.enum(['active', 'suspended']),
  emailVerified: z.boolean(),
  termsAcceptedAt: z.union([z.string(), z.date()]).nullable(),
  onboardingCompletedAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type Customer = z.infer<typeof CustomerSchema>;

/**
 * POST /customer/register request body.
 * acceptedTerms MUST be true — the server sets termsAcceptedAt itself
 * (never trust a client-supplied timestamp).
 */
export const RegisterCustomerRequestSchema = z.object({
  displayName: z.string().min(1).max(100),
  organisationName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20).optional(),
  acceptedTerms: z.literal(true),
});

export type RegisterCustomerRequest = z.infer<
  typeof RegisterCustomerRequestSchema
>;

export const RegisterCustomerResponseSchema = z.object({
  customer: CustomerSchema,
  project: z.object({
    id: z.string(),
    name: z.string(),
    origin: z.literal('customer'),
  }),
  wallet: z.object({
    availableUnits: z.number().int().nonnegative(),
    reservedUnits: z.number().int().nonnegative(),
    totalUnits: z.number().int().nonnegative(),
  }),
  starterUnitsGranted: z.number().int().nonnegative(),
  isNew: z.boolean(), // false on idempotent replay
});

export type RegisterCustomerResponse = z.infer<
  typeof RegisterCustomerResponseSchema
>;

/**
 * projects.origin — provenance flag. Existing docs are backfilled to
 * 'admin'; customer signups create 'customer'.
 */
export const ProjectOriginSchema = z.enum(['admin', 'customer']);
export type ProjectOrigin = z.infer<typeof ProjectOriginSchema>;

// ─────────────────────────────────────────────────────────────────────
// CP1 follow-up: /customer/me and /customer/wallet shapes
// ─────────────────────────────────────────────────────────────────────

export const UpdateCustomerProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(1).max(100).optional(),
    organisationName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(7).max(20).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateCustomerProfileRequest = z.infer<
  typeof UpdateCustomerProfileRequestSchema
>;

export const CustomerMeResponseSchema = z.object({
  customer: z.object({
    uid: z.string(),
    email: z.string(),
    displayName: z.string(),
    organisationName: z.string().nullable(),
    projectId: z.string(),
    status: z.enum(['active', 'suspended']),
  }),
  project: z.object({
    id: z.string(),
    name: z.string(),
    origin: z.enum(['admin', 'customer']),
  }),
});

export type CustomerMeResponse = z.infer<typeof CustomerMeResponseSchema>;

export const CustomerWalletResponseSchema = z.object({
  availableUnits: z.number().int().nonnegative(),
  reservedUnits: z.number().int().nonnegative(),
  totalUnits: z.number().int().nonnegative(),
  lowBalanceThreshold: z.number().int().nullable(),
  updatedAt: z.string().nullable(),
});

export type CustomerWalletResponse = z.infer<
  typeof CustomerWalletResponseSchema
>;

export const CustomerTransactionListResponseSchema = z.object({
  transactions: z.array(z.record(z.unknown())),
  count: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
});

export type CustomerTransactionListResponse = z.infer<
  typeof CustomerTransactionListResponseSchema
>;