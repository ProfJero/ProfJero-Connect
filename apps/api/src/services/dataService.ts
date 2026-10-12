import {
  DEFAULT_DATA_MARKUP_PERCENT,
  applyDataMarkup,
  dataReferencePrice,
  type CustomerDataBundle,
  type DataOrder,
} from '@profjero/shared';
import { elitedata } from '../providers/elitedataClient';
import {
  getBundle,
  getDataMarkupPercent,
  listAllBundles,
  listCustomerVisibleBundles,
  upsertBundle,
} from '../repositories/dataBundles';
import {
  createOrder as createOrderDoc,
  getOrder,
} from '../repositories/dataOrders';
import { DomainError } from '../lib/domainError';
import type { Env } from '../types/env';


/**
 * Apply a markup percentage to a cost and round up to the nearest
 * 0.10 GHS. Predictable for customers, keeps margins non-negative.
 *
 *   cost 4.00, markup 25% → raw 5.00 → 5.00
 *   cost 4.50, markup 25% → raw 5.625 → 5.70
 *   cost 3.30, markup 25% → raw 4.125 → 4.20
 */
export function applyMarkup(costGhs: number, markupPercent: number): number {
  return applyDataMarkup(costGhs, markupPercent);
}

/**
 * Natural display order for bundles: network first (MTN → Telecel →
 * AirtelTigo → Glo), then by size in GB ascending. Keeps the customer
 * UI consistent across syncs.
 */
function displayOrderFor(network: string, size: string): number {
  const networkOrder: Record<string, number> = {
    MTN: 0,
    Telecel: 1,
    AirtelTigo: 2,
    Glo: 3,
  };
  const gb = parseFloat(size.replace(/[^\d.]/g, '')) || 9999;
  return (networkOrder[network] ?? 99) * 1000 + gb;
}

/**
 * EliteData's `label` field has varied across their docs — sometimes it's
 * "MTN 1GB Data", sometimes just "1GB". Build a consistent label from
 * network + size when the provider value is missing or degenerate.
 *
 *   ("MTN", "1GB", "MTN 1GB Data") → "MTN 1GB Data"
 *   ("MTN", "1GB", "1GB")          → "MTN 1GB Data"
 *   ("MTN", "1GB", "")             → "MTN 1GB Data"
 *   ("MTN", "1GB", null)           → "MTN 1GB Data"
 */
function bundleLabel(network: string, size: string, providerLabel: string | null | undefined): string {
  const trimmed = (providerLabel ?? '').trim();
  if (trimmed && trimmed !== size.trim()) return trimmed;
  return `${network} ${size} Data`;
}

/**
 * Pull the current bundle catalog from EliteData and upsert into our
 * Firestore collection. Existing bundles keep their availableToCustomers
 * flag (admin curation is preserved). New bundles default to hidden so
 * they can be reviewed. Bundles the provider no longer offers are marked
 * inactive.
 */
export async function syncBundlesFromProvider(env: Env): Promise<{
  total: number;
  created: number;
  updated: number;
  deactivated: number;
}> {
  const providerBundles = await elitedata.listBundles(env);
  const providerIds = new Set(providerBundles.map((b) => b.bundleId));
  const existing = await listAllBundles(env);
  const existingById = new Map(existing.map((b) => [b.id, b]));

  const now = new Date().toISOString();
  const markup = await getDataMarkupPercent(env, DEFAULT_DATA_MARKUP_PERCENT);
  let created = 0;
  let updated = 0;

  for (const pb of providerBundles) {
    // What we really pay: the published API price when we know it (the
    // bundle list may report a retail price), else what the API reports.
    const ref = dataReferencePrice(pb.network, pb.size);
    const cost = ref?.api ?? pb.price;
    const stored = existingById.get(pb.bundleId) ?? null;
    // Keep the admin's price and markup unless our cost changed; then
    // re-price with the bundle's own markup.
    let sellPriceGhs: number;
    let markupPercent: number;
    if (stored && Math.abs(stored.providerCostGhs - cost) < 0.005) {
      sellPriceGhs = stored.sellPriceGhs;
      markupPercent = stored.markupPercent;
    } else {
      markupPercent = stored ? stored.markupPercent : markup;
      sellPriceGhs = applyMarkup(cost, markupPercent);
    }
    await upsertBundle(
      env,
      {
        id: pb.bundleId,
        network: pb.network,
        size: pb.size,
        label: bundleLabel(pb.network, pb.size, pb.label),
        providerCostGhs: cost,
        sellPriceGhs,
        markupPercent,
        providerListedPriceGhs: pb.price,
        guestPriceGhs: ref?.guest ?? null,
        availableToCustomers: false, // ignored for existing rows
        active: true,
        displayOrder: displayOrderFor(pb.network, pb.size),
        syncedAt: now,
      },
      stored,
    );
    if (stored) updated++;
    else created++;
  }

  let deactivated = 0;
  for (const b of existing) {
    if (!providerIds.has(b.id) && b.active) {
      await upsertBundle(env, { ...b, active: false, syncedAt: now }, b);
      deactivated++;
    }
  }

  return { total: providerBundles.length, created, updated, deactivated };
}

/**
 * Customer-visible bundle list, projected to a safe shape (no provider
 * cost leaked).
 */
export async function getCustomerCatalog(env: Env): Promise<CustomerDataBundle[]> {
  const bundles = await listCustomerVisibleBundles(env);
  return bundles.map((b) => ({
    id: b.id,
    network: b.network,
    size: b.size,
    label: b.label,
    sellPriceGhs: b.sellPriceGhs,
    displayOrder: b.displayOrder,
  }));
}

/**
 * Create a pending data order. Provider submission happens AFTER payment
 * confirmation (DB3). This just records intent and returns the pending doc.
 *
 * Idempotent: the order ID is derived deterministically from the idempotency
 * key. A replay returns the existing order instead of creating a second one.
 */
export async function createDataOrder(
  env: Env,
  args: {
    projectId: string;
    customerUid: string;
    bundleId: string;
    recipientNumber: string;
    idempotencyKey: string;
  },
): Promise<DataOrder> {
  const bundle = await getBundle(env, args.bundleId);
  if (!bundle) {
    throw new DomainError('Bundle not found.', 404);
  }
  if (!bundle.active || !bundle.availableToCustomers) {
    throw new DomainError('This bundle is not available.', 400);
  }

  const now = new Date().toISOString();
  const safeKey = args.idempotencyKey.replace(/[^a-z0-9]/gi, '').slice(0, 32);
  const orderId = `do_${safeKey}`;
  const providerReference = orderId;

  const existing = await getOrder(env, orderId);
  if (existing) {
    if (
      existing.projectId !== args.projectId ||
      existing.bundleId !== args.bundleId ||
      existing.recipientNumber !== args.recipientNumber
    ) {
      throw new DomainError(
        'This Idempotency-Key was already used with a different request.',
        409,
      );
    }
    return existing;
  }

  return createOrderDoc(
    env,
    {
      projectId: args.projectId,
      customerUid: args.customerUid,
      bundleId: bundle.id,
      bundleLabel: bundle.label,
      network: bundle.network,
      size: bundle.size,
      recipientNumber: args.recipientNumber,
      providerCostGhs: bundle.providerCostGhs,
      sellPriceGhs: bundle.sellPriceGhs,
      paymentReference: null,
      paymentStatus: 'pending',
      orderStatus: 'pending_payment',
      providerOrderId: null,
      providerReference,
      providerStatus: null,
      providerError: null,
      idempotencyKey: args.idempotencyKey,
      paymentConfirmedAt: null,
      providerSubmittedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    orderId,
  );
}