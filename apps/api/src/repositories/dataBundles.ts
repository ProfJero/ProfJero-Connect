import {
  firestoreCreateDoc,
  firestoreDeleteDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import { applyDataMarkup, type DataBundle } from '@profjero/shared';

const COLLECTION = 'dataBundles';

function parse(id: string, d: Record<string, unknown>): DataBundle {
  return {
    id,
    network: String(d.network ?? ''),
    size: String(d.size ?? ''),
    label: String(d.label ?? ''),
    providerCostGhs: Number(d.providerCostGhs ?? 0),
    sellPriceGhs: Number(d.sellPriceGhs ?? 0),
    markupPercent: Number(d.markupPercent ?? 0),
    providerListedPriceGhs: d.providerListedPriceGhs !== undefined && d.providerListedPriceGhs !== null ? Number(d.providerListedPriceGhs) : null,
    guestPriceGhs: d.guestPriceGhs !== undefined && d.guestPriceGhs !== null ? Number(d.guestPriceGhs) : null,
    availableToCustomers: d.availableToCustomers === true,
    active: d.active !== false,
    displayOrder: Number(d.displayOrder ?? 999),
    syncedAt: String(d.syncedAt ?? ''),
    createdAt: String(d.createdAt ?? ''),
    updatedAt: String(d.updatedAt ?? ''),
  };
}

export async function listAllBundles(env: Env): Promise<DataBundle[]> {
  const docs = await firestoreQuery(env, COLLECTION, []);
  return docs
    .map((d) => parse(d.id, d.data))
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.network.localeCompare(b.network) ||
        a.size.localeCompare(b.size),
    );
}

export async function listCustomerVisibleBundles(env: Env): Promise<DataBundle[]> {
  const all = await listAllBundles(env);
  return all.filter((b) => b.availableToCustomers && b.active);
}

export async function getBundle(env: Env, id: string): Promise<DataBundle | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, id);
  return doc ? parse(doc.id, doc.data) : null;
}

/**
 * Create or refresh a bundle from a sync. Pass the stored copy (from the
 * same sync's list) to skip a read. Admin curation is preserved:
 * availableToCustomers is never overwritten; price fields are whatever
 * the caller decided (the sync keeps admin prices unless the cost moved).
 */
export async function upsertBundle(
  env: Env,
  bundle: Omit<DataBundle, 'createdAt' | 'updatedAt'>,
  existing?: DataBundle | null,
): Promise<DataBundle> {
  const now = new Date().toISOString();
  const stored = existing === undefined ? await getBundle(env, bundle.id) : existing;
  const fields = {
    network: bundle.network,
    size: bundle.size,
    label: bundle.label,
    providerCostGhs: bundle.providerCostGhs,
    sellPriceGhs: bundle.sellPriceGhs,
    markupPercent: bundle.markupPercent,
    providerListedPriceGhs: bundle.providerListedPriceGhs ?? null,
    guestPriceGhs: bundle.guestPriceGhs ?? null,
    active: bundle.active,
    displayOrder: bundle.displayOrder,
    syncedAt: bundle.syncedAt,
  };

  if (stored) {
    await firestoreUpdateDoc(env, COLLECTION, bundle.id, { ...fields, updatedAt: now });
    return { ...stored, ...fields, updatedAt: now };
  }

  // New bundle: default hidden so admin can curate before customers see it.
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    { ...fields, availableToCustomers: false, createdAt: now, updatedAt: now },
    { docId: bundle.id },
  );
  return parse(doc.id, doc.data);
}

export async function setBundleAvailability(
  env: Env,
  id: string,
  available: boolean,
): Promise<void> {
  await firestoreUpdateDoc(env, COLLECTION, id, {
    availableToCustomers: available,
    updatedAt: new Date().toISOString(),
  });
}

export async function setBundleSellPrice(
  env: Env,
  id: string,
  sellPriceGhs: number,
): Promise<void> {
  await firestoreUpdateDoc(env, COLLECTION, id, {
    sellPriceGhs,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateBundleFields(
  env: Env,
  id: string,
  fields: Partial<{
    label: string;
    sellPriceGhs: number;
    displayOrder: number;
    availableToCustomers: boolean;
    active: boolean;
  }>,
): Promise<void> {
  await firestoreUpdateDoc(env, COLLECTION, id, {
    ...fields,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBundle(env: Env, id: string): Promise<void> {
  await firestoreDeleteDoc(env, COLLECTION, id);
}

/**
 * Recompute every bundle's sellPriceGhs from its providerCostGhs × the
 * given markup. Used by the admin "set global markup" action. Skips
 * inactive bundles (they're not for sale anyway).
 *
 * Firestore REST has no batch update beyond firestoreBatchWrite, but our
 * collection is small (dozens), so a sequential loop is fine.
 */
export async function applyGlobalMarkup(
  env: Env,
  markupPercent: number,
): Promise<{ updated: number }> {
  const all = await listAllBundles(env);
  let updated = 0;
  for (const b of all) {
    if (!b.active) continue;
    const sellPriceGhs = applyDataMarkup(b.providerCostGhs, markupPercent);
    if (sellPriceGhs === b.sellPriceGhs && markupPercent === b.markupPercent) continue;
    await firestoreUpdateDoc(env, COLLECTION, b.id, {
      sellPriceGhs,
      markupPercent,
      updatedAt: new Date().toISOString(),
    });
    updated += 1;
  }
  return { updated };
}
// ---------- Global data pricing (config/dataPricing) ----------

export async function getDataMarkupPercent(env: Env, fallback: number): Promise<number> {
  const doc = await firestoreGetDoc(env, 'config', 'dataPricing');
  const v = Number(doc?.data.markupPercent);
  return doc && Number.isFinite(v) ? v : fallback;
}

export async function setDataMarkupPercent(env: Env, markupPercent: number, actor: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = await firestoreGetDoc(env, 'config', 'dataPricing');
  if (existing) await firestoreUpdateDoc(env, 'config', 'dataPricing', { markupPercent, updatedAt: now, updatedBy: actor });
  else await firestoreCreateDoc(env, 'config', { markupPercent, updatedAt: now, updatedBy: actor }, { docId: 'dataPricing' });
}
