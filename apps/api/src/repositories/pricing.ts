import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreUpdateDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  Currency,
  Package,
  PricingSettings,
  Service,
} from '@profjero/shared';

const SETTINGS = 'pricingSettings';
const PACKAGES = 'packages';

// ---------- Settings ----------

function parseSettings(
  service: Service,
  data: Record<string, unknown> | null,
): PricingSettings {
  if (!data) {
    // Default for a service that has never been configured.
    const now = new Date().toISOString();
    return {
      service,
      currency: 'GHS',
      unitPriceGhs: null,
      minPurchaseUnits: null,
      maxPurchaseUnits: null,
      active: false,
      updatedAt: now,
      updatedBy: 'system',
    };
  }

  return {
    service,
    currency: (data.currency as Currency) ?? 'GHS',
    unitPriceGhs:
      data.unitPriceGhs === null || data.unitPriceGhs === undefined
        ? null
        : Number(data.unitPriceGhs),
    minPurchaseUnits:
      data.minPurchaseUnits === null || data.minPurchaseUnits === undefined
        ? null
        : Number(data.minPurchaseUnits),
    maxPurchaseUnits:
      data.maxPurchaseUnits === null || data.maxPurchaseUnits === undefined
        ? null
        : Number(data.maxPurchaseUnits),
    active: Boolean(data.active ?? false),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    updatedBy: String(data.updatedBy ?? 'system'),
  };
}

export async function getPricingSettings(
  env: Env,
  service: Service,
): Promise<PricingSettings> {
  const doc = await firestoreGetDoc(env, SETTINGS, service);
  return parseSettings(service, doc?.data ?? null);
}

export async function listAllPricingSettings(
  env: Env,
): Promise<PricingSettings[]> {
  const services: Service[] = ['sms', 'airtime', 'data'];
  const out: PricingSettings[] = [];
  for (const svc of services) {
    out.push(await getPricingSettings(env, svc));
  }
  return out;
}

export interface UpdateSettingsArgs {
  currency?: Currency;
  unitPriceGhs?: number | null;
  minPurchaseUnits?: number | null;
  maxPurchaseUnits?: number | null;
  active?: boolean;
}

export async function updatePricingSettings(
  env: Env,
  service: Service,
  patch: UpdateSettingsArgs,
  adminUid: string,
): Promise<PricingSettings> {
  const now = new Date().toISOString();

  const existing = await firestoreGetDoc(env, SETTINGS, service);

  const fields: Record<string, unknown> = {
    service,
    updatedAt: now,
    updatedBy: adminUid,
  };
  if (patch.currency !== undefined) fields.currency = patch.currency;
  if (patch.unitPriceGhs !== undefined) fields.unitPriceGhs = patch.unitPriceGhs;
  if (patch.minPurchaseUnits !== undefined)
    fields.minPurchaseUnits = patch.minPurchaseUnits;
  if (patch.maxPurchaseUnits !== undefined)
    fields.maxPurchaseUnits = patch.maxPurchaseUnits;
  if (patch.active !== undefined) fields.active = patch.active;

  if (existing) {
    const doc = await firestoreUpdateDoc(env, SETTINGS, service, fields);
    return parseSettings(service, doc.data);
  }

  // Create with defaults + overrides.
  const initial = {
    service,
    currency: patch.currency ?? 'GHS',
    unitPriceGhs: patch.unitPriceGhs ?? null,
    minPurchaseUnits: patch.minPurchaseUnits ?? null,
    maxPurchaseUnits: patch.maxPurchaseUnits ?? null,
    active: patch.active ?? false,
    updatedAt: now,
    updatedBy: adminUid,
  };
  const doc = await firestoreCreateDoc(env, SETTINGS, initial, {
    docId: service,
  });
  return parseSettings(service, doc.data);
}

// ---------- Packages ----------

function parsePackage(id: string, data: Record<string, unknown>): Package {
  const units = Number(data.units ?? 0);
  const priceGhs = Number(data.priceGhs ?? 0);
  return {
    id,
    service: data.service as Service,
    name: String(data.name),
    units,
    priceGhs,
    effectiveRate: units > 0 ? Number((priceGhs / units).toFixed(6)) : 0,
    description: (data.description as string | null) ?? null,
    active: Boolean(data.active ?? true),
    displayOrder: Number(data.displayOrder ?? 0),
    createdAt: String(data.createdAt),
    updatedAt: String(data.updatedAt),
    createdBy: String(data.createdBy),
    updatedBy: String(data.updatedBy),
  };
}

export async function listPackagesForService(
  env: Env,
  service: Service,
): Promise<Package[]> {
  const { docs } = await firestoreListDocs(env, PACKAGES, { pageSize: 500 });
  return docs
    .map((d) => parsePackage(d.id, d.data))
    .filter((p) => p.service === service)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.units - b.units);
}

export async function getPackageById(
  env: Env,
  id: string,
): Promise<Package | null> {
  const doc = await firestoreGetDoc(env, PACKAGES, id);
  return doc ? parsePackage(doc.id, doc.data) : null;
}

export interface CreatePackageArgs {
  name: string;
  units: number;
  priceGhs: number;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export async function createPackage(
  env: Env,
  service: Service,
  args: CreatePackageArgs,
  adminUid: string,
): Promise<Package> {
  const now = new Date().toISOString();
  const doc = await firestoreCreateDoc(env, PACKAGES, {
    service,
    name: args.name,
    units: args.units,
    priceGhs: args.priceGhs,
    description: args.description,
    active: args.active,
    displayOrder: args.displayOrder,
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
    updatedBy: adminUid,
  });
  return parsePackage(doc.id, doc.data);
}

export async function updatePackage(
  env: Env,
  id: string,
  patch: Partial<CreatePackageArgs>,
  adminUid: string,
): Promise<Package | null> {
  const existing = await getPackageById(env, id);
  if (!existing) return null;

  const fields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.units !== undefined) fields.units = patch.units;
  if (patch.priceGhs !== undefined) fields.priceGhs = patch.priceGhs;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.active !== undefined) fields.active = patch.active;
  if (patch.displayOrder !== undefined) fields.displayOrder = patch.displayOrder;

  const doc = await firestoreUpdateDoc(env, PACKAGES, id, fields);
  return parsePackage(doc.id, doc.data);
}