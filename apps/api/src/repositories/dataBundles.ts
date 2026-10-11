import {
  firestoreCreateDoc,
  firestoreDeleteDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type { DataBundle } from '@profjero/shared';

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

export async function upsertBundle(
  env: Env,
  bundle: Omit<DataBundle, 'createdAt' | 'updatedAt'>,
): Promise<DataBundle> {
  const existing = await firestoreGetDoc(env, COLLECTION, bundle.id);
  const now = new Date().toISOString();

  if (existing) {
    // Preserve admin curation: availableToCustomers is NOT overwritten by
    // a sync. Admin toggles it; sync only refreshes provider-supplied fields.
    await firestoreUpdateDoc(env, COLLECTION, bundle.id, {
      network: bundle.network,
      size: bundle.size,
      label: bundle.label,
      providerCostGhs: bundle.providerCostGhs,
      sellPriceGhs: bundle.sellPriceGhs,
      markupPercent: bundle.markupPercent,
      active: bundle.active,
      displayOrder: bundle.displayOrder,
      syncedAt: bundle.syncedAt,
      updatedAt: now,
    });
    return parse(bundle.id, {
      ...existing.data,
      network: bundle.network,
      size: bundle.size,
      label: bundle.label,
      providerCostGhs: bundle.providerCostGhs,
      sellPriceGhs: bundle.sellPriceGhs,
      markupPercent: bundle.markupPercent,
      active: bundle.active,
      displayOrder: bundle.displayOrder,
      syncedAt: bundle.syncedAt,
      updatedAt: now,
    });
  }

  // New bundle: default hidden so admin can curate before customers see it.
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    {
      network: bundle.network,
      size: bundle.size,
      label: bundle.label,
      providerCostGhs: bundle.providerCostGhs,
      sellPriceGhs: bundle.sellPriceGhs,
      markupPercent: bundle.markupPercent,
      availableToCustomers: false,
      active: bundle.active,
      displayOrder: bundle.displayOrder,
      syncedAt: bundle.syncedAt,
      createdAt: now,
      updatedAt: now,
    },
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
    const raw = b.providerCostGhs * (1 + markupPercent / 100);
    const pesewas = Math.ceil((raw * 100) / 10) * 10;
    const sellPriceGhs = pesewas / 100;
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