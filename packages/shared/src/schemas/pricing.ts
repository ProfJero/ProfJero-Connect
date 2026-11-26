import { z } from 'zod';

export const ServiceSchema = z.enum(['sms', 'airtime', 'data']);
export type Service = z.infer<typeof ServiceSchema>;

export const CurrencySchema = z.enum(['GHS']);
export type Currency = z.infer<typeof CurrencySchema>;

export const PricingSettingsSchema = z.object({
  service: ServiceSchema,
  currency: CurrencySchema,
  /** Per-unit reference price for arbitrary purchases. null = packages only. */
  unitPriceGhs: z.number().nonnegative().nullable(),
  /** Minimum units per custom purchase. null = no minimum. */
  minPurchaseUnits: z.number().int().nonnegative().nullable(),
  /** Maximum units per custom purchase. null = no maximum. */
  maxPurchaseUnits: z.number().int().nonnegative().nullable(),
  /** When false, the service is hidden from the public pricing endpoint. */
  active: z.boolean(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string(),
});
export type PricingSettings = z.infer<typeof PricingSettingsSchema>;

export const PackageSchema = z.object({
  id: z.string(),
  service: ServiceSchema,
  name: z.string(),
  units: z.number().int().positive(),
  priceGhs: z.number().positive(),
  /** Computed on read: priceGhs / units. GHS per unit. */
  effectiveRate: z.number().nonnegative(),
  description: z.string().nullable(),
  active: z.boolean(),
  displayOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  updatedBy: z.string(),
});
export type Package = z.infer<typeof PackageSchema>;

export const PricingWithPackagesSchema = PricingSettingsSchema.extend({
  packages: z.array(PackageSchema),
});
export type PricingWithPackages = z.infer<typeof PricingWithPackagesSchema>;

export const PricingCatalogResponseSchema = z.object({
  services: z.array(PricingWithPackagesSchema),
});
export type PricingCatalogResponse = z.infer<
  typeof PricingCatalogResponseSchema
>;

// ---------- Inputs ----------

export const UpdatePricingSettingsInputSchema = z.object({
  currency: CurrencySchema.optional(),
  unitPriceGhs: z.number().nonnegative().max(1000).nullable().optional(),
  minPurchaseUnits: z.number().int().nonnegative().nullable().optional(),
  maxPurchaseUnits: z.number().int().nonnegative().nullable().optional(),
  active: z.boolean().optional(),
});
export type UpdatePricingSettingsInput = z.infer<
  typeof UpdatePricingSettingsInputSchema
>;

export const CreatePackageInputSchema = z.object({
  name: z.string().min(1).max(100),
  units: z.number().int().positive().max(10_000_000),
  priceGhs: z.number().positive().max(1_000_000),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});
export type CreatePackageInput = z.infer<typeof CreatePackageInputSchema>;

export const UpdatePackageInputSchema = CreatePackageInputSchema.partial();
export type UpdatePackageInput = z.infer<typeof UpdatePackageInputSchema>;

// ---------- Responses ----------

export const PricingResponseSchema = z.object({
  pricing: PricingWithPackagesSchema,
});
export type PricingResponse = z.infer<typeof PricingResponseSchema>;

export const PackageResponseSchema = z.object({
  package: PackageSchema,
});
export type PackageResponse = z.infer<typeof PackageResponseSchema>;