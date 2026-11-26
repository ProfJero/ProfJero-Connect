import { z } from 'zod';

export const ApiKeyStatusSchema = z.enum(['active', 'revoked']);
export type ApiKeyStatus = z.infer<typeof ApiKeyStatusSchema>;

export const ApiKeyKindSchema = z.enum(['secret', 'publishable']);
export type ApiKeyKind = z.infer<typeof ApiKeyKindSchema>;

export const RecipientModeSchema = z.enum(['allowlist', 'prefix', 'any']);
export type RecipientMode = z.infer<typeof RecipientModeSchema>;

/**
 * Full key record. Publishable-specific fields are null/0/[] for secret keys
 * so the shape stays uniform and the frontend doesn't need to branch.
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  kind: ApiKeyKindSchema,
  keyPrefix: z.string(),
  status: ApiKeyStatusSchema,
  createdAt: z.string().datetime(),
  createdBy: z.string(),
  revokedAt: z.string().datetime().nullable(),
  revokedBy: z.string().nullable(),
  lastUsedAt: z.string().datetime().nullable(),

  // ---- Publishable-key-only fields ----
  /** null for secret keys */
  recipientMode: RecipientModeSchema.nullable(),
  /** Empty array for secret keys */
  recipientList: z.array(z.string()),
  /** 0 for secret keys */
  rateLimitPerMinute: z.number().int().nonnegative(),
  rateLimitPerHour: z.number().int().nonnegative(),
  rateLimitPerDay: z.number().int().nonnegative(),
   /** 0 for secret keys */
  lifetimeUnitCap: z.number().int().nonnegative(),
  lifetimeUnitsSpent: z.number().int().nonnegative(),
  /** null = no expiry */
  expiresAt: z.string().datetime().nullable(),

  // ---- Rate-limit state (infrastructure, not user-facing) ----
  // Stored on the key doc so updates use the same write primitive that
  // powers lifetime spend — proven reliable. Null bucket = window has reset.
  rateMinuteBucket: z.string().nullable(),
  rateMinuteCount: z.number().int().nonnegative(),
  rateHourBucket: z.string().nullable(),
  rateHourCount: z.number().int().nonnegative(),
  rateDayBucket: z.string().nullable(),
  rateDayCount: z.number().int().nonnegative(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const ApiKeyWithSecretSchema = ApiKeySchema.extend({
  plaintext: z.string(),
});
export type ApiKeyWithSecret = z.infer<typeof ApiKeyWithSecretSchema>;

// ---------- Inputs ----------

export const CreateApiKeyInputSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;

export const CreatePublishableApiKeyInputSchema = z
  .object({
    name: z.string().min(1).max(100),
    recipientMode: RecipientModeSchema,
    recipientList: z.array(z.string().min(4).max(30)).max(500).optional(),
    rateLimitPerMinute: z.number().int().min(1).max(10_000),
    rateLimitPerHour: z.number().int().min(1).max(100_000),
    rateLimitPerDay: z.number().int().min(1).max(1_000_000),
    lifetimeUnitCap: z.number().int().min(1).max(10_000_000),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) =>
      data.recipientMode === 'any' ||
      (data.recipientList && data.recipientList.length > 0),
    {
      message:
        'recipientList is required and must be non-empty unless recipientMode is "any".',
      path: ['recipientList'],
    },
  );
export type CreatePublishableApiKeyInput = z.infer<
  typeof CreatePublishableApiKeyInputSchema
>;

// ---------- Responses ----------

export const ApiKeyListResponseSchema = z.object({
  apiKeys: z.array(ApiKeySchema),
  count: z.number().int().nonnegative(),
});
export type ApiKeyListResponse = z.infer<typeof ApiKeyListResponseSchema>;

export const ApiKeyCreateResponseSchema = z.object({
  apiKey: ApiKeyWithSecretSchema,
  /** Present only when kind is 'publishable' and recipientMode is 'any'.
   *  UI should render this prominently. */
  warning: z.string().nullable(),
});
export type ApiKeyCreateResponse = z.infer<typeof ApiKeyCreateResponseSchema>;

export const ApiKeyResponseSchema = z.object({
  apiKey: ApiKeySchema,
});
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;