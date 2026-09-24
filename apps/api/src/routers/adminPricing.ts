import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CreatePackageInputSchema,
  PackageResponseSchema,
  PricingResponseSchema,
  ServiceSchema,
  UpdatePackageInputSchema,
  UpdatePricingSettingsInputSchema,
  type Service,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  createPackage,
  getPackageById,
  getPricingSettings,
  listPackagesForService,
  updatePackage,
  updatePricingSettings,
} from '../repositories/pricing';
import type { AuthVariables, Env } from '../types/env';

export const adminPricingRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function parseService(raw: string): Service {
  const parsed = ServiceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HTTPException(400, { message: `Invalid service: "${raw}"` });
  }
  return parsed.data;
}

function validationError(
  issues: { path: PropertyKey[]; message: string }[],
): never {
  const detail = issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  throw new HTTPException(400, { message: `Validation failed — ${detail}` });
}

// --- GET /admin/pricing/sms ---
adminPricingRouter.get('/:service', async (c) => {
  const service = parseService(c.req.param('service'));
  const settings = await getPricingSettings(c.env, service);
  const packages = await listPackagesForService(c.env, service);
  return c.json(
    PricingResponseSchema.parse({
      pricing: { ...settings, packages },
    }),
  );
});

// --- PUT /admin/pricing/sms ---
adminPricingRouter.put(
  '/:service',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const service = parseService(c.req.param('service'));
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = UpdatePricingSettingsInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    await updatePricingSettings(c.env, service, parsed.data, admin.uid);

    const settings = await getPricingSettings(c.env, service);
    const packages = await listPackagesForService(c.env, service);
    return c.json(
      PricingResponseSchema.parse({
        pricing: { ...settings, packages },
      }),
    );
  },
);

// --- POST /admin/pricing/sms/packages ---
adminPricingRouter.post(
  '/:service/packages',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const service = parseService(c.req.param('service'));
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = CreatePackageInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const pkg = await createPackage(
      c.env,
      service,
      {
        name: parsed.data.name,
        units: parsed.data.units,
        priceGhs: parsed.data.priceGhs,
        description: parsed.data.description ?? null,
        active: parsed.data.active ?? true,
        displayOrder: parsed.data.displayOrder ?? 0,
      },
      admin.uid,
    );

    return c.json(PackageResponseSchema.parse({ package: pkg }), 201);
  },
);

// --- PATCH /admin/pricing/packages/:packageId ---
adminPricingRouter.patch(
  '/packages/:packageId',
  requireRole('super_admin', 'admin', 'finance'),
  async (c) => {
    const packageId = c.req.param('packageId');
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = UpdatePackageInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const existing = await getPackageById(c.env, packageId);
    if (!existing) {
      throw new HTTPException(404, { message: 'Package not found.' });
    }

    const admin = c.get('admin');
    const updated = await updatePackage(
      c.env,
      packageId,
      {
        name: parsed.data.name,
        units: parsed.data.units,
        priceGhs: parsed.data.priceGhs,
        description: parsed.data.description ?? undefined,
        active: parsed.data.active,
        displayOrder: parsed.data.displayOrder,
      },
      admin.uid,
    );
    if (!updated) {
      throw new HTTPException(404, { message: 'Package not found.' });
    }

    return c.json(PackageResponseSchema.parse({ package: updated }));
  },
);

// --- POST /admin/pricing/bootstrap/sms ---
// Idempotent. Seeds the initial SMS pricing catalog. Only creates settings
// if missing, and only creates packages by name if they don't already exist.
adminPricingRouter.post(
  '/bootstrap/sms',
  requireRole('super_admin'),
  async (c) => {
    const seedPackages = [
      { name: 'Starter', units: 500, priceGhs: 20, displayOrder: 10 },
      { name: 'Basic', units: 1300, priceGhs: 50, displayOrder: 20 },
      { name: 'Growth', units: 2750, priceGhs: 100, displayOrder: 30 },
      { name: 'Business', units: 5700, priceGhs: 200, displayOrder: 40 },
      { name: 'Professional', units: 14800, priceGhs: 500, displayOrder: 50 },
      { name: 'Enterprise', units: 30000, priceGhs: 1000, displayOrder: 60 },
      { name: 'Business Plus', units: 64000, priceGhs: 2000, displayOrder: 70 },
      {
        name: 'Enterprise Plus',
        units: 165000,
        priceGhs: 5000,
        displayOrder: 80,
      },
    ];

    const admin = c.get('admin');

    // Seed settings (idempotent — this is a no-op if already configured).
    const existing = await getPricingSettings(c.env, 'sms');
    if (existing.updatedBy === 'system' && !existing.active) {
      await updatePricingSettings(
        c.env,
        'sms',
        {
          currency: 'GHS',
          // Reference price for arbitrary purchases — makes the packages look
          // like the discount they are. Adjust to match your business model.
          unitPriceGhs: 0.05,
          minPurchaseUnits: 500,
          maxPurchaseUnits: null,
          active: true,
        },
        admin.uid,
      );
    }

    // Seed packages by name.
    const current = await listPackagesForService(c.env, 'sms');
    const currentNames = new Set(current.map((p) => p.name));

    const created: string[] = [];
    for (const seed of seedPackages) {
      if (currentNames.has(seed.name)) continue;
      await createPackage(
        c.env,
        'sms',
        {
          name: seed.name,
          units: seed.units,
          priceGhs: seed.priceGhs,
          description: null,
          active: true,
          displayOrder: seed.displayOrder,
        },
        admin.uid,
      );
      created.push(seed.name);
    }

    const settings = await getPricingSettings(c.env, 'sms');
    const packages = await listPackagesForService(c.env, 'sms');
    return c.json({
      seeded: created,
      skipped: seedPackages
        .map((s) => s.name)
        .filter((n) => !created.includes(n)),
      pricing: { ...settings, packages },
    });
  },
);