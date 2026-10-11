import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  type QueryFilter,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  DataOrder,
  DataOrderStatus,
  DataPaymentStatus,
} from '@profjero/shared';

const COLLECTION = 'dataOrders';

function parse(id: string, d: Record<string, unknown>): DataOrder {
  return {
    id,
    projectId: String(d.projectId ?? ''),
    customerUid: String(d.customerUid ?? ''),
    bundleId: String(d.bundleId ?? ''),
    bundleLabel: String(d.bundleLabel ?? ''),
    network: String(d.network ?? ''),
    size: String(d.size ?? ''),
    recipientNumber: String(d.recipientNumber ?? ''),
    providerCostGhs: Number(d.providerCostGhs ?? 0),
    sellPriceGhs: Number(d.sellPriceGhs ?? 0),
    paymentReference: (d.paymentReference as string | null) ?? null,
    paymentStatus: (d.paymentStatus as DataPaymentStatus) ?? 'pending',
    orderStatus: (d.orderStatus as DataOrderStatus) ?? 'pending_payment',
    providerOrderId: (d.providerOrderId as string | null) ?? null,
    providerReference: String(d.providerReference ?? ''),
    providerStatus: (d.providerStatus as string | null) ?? null,
    providerError: (d.providerError as string | null) ?? null,
    idempotencyKey: String(d.idempotencyKey ?? ''),
    paymentConfirmedAt: (d.paymentConfirmedAt as string | null) ?? null,
    providerSubmittedAt: (d.providerSubmittedAt as string | null) ?? null,
    completedAt: (d.completedAt as string | null) ?? null,
    amountPesewas: d.amountPesewas !== undefined ? Number(d.amountPesewas) : Math.round(Number(d.sellPriceGhs ?? 0) * 100),
    checkoutUrl: (d.checkoutUrl as string | null) ?? null,
    customerEmail: (d.customerEmail as string | null) ?? null,
    needsReview: d.needsReview === true,
    refundedAt: (d.refundedAt as string | null) ?? null,
    refundError: (d.refundError as string | null) ?? null,
    createdAt: String(d.createdAt ?? ''),
    updatedAt: String(d.updatedAt ?? ''),
  };
}

export async function getOrder(env: Env, id: string): Promise<DataOrder | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, id);
  return doc ? parse(doc.id, doc.data) : null;
}

export async function getOrderByReference(
  env: Env,
  providerReference: string,
): Promise<DataOrder | null> {
  const docs = await firestoreQuery(env, COLLECTION, [
    { field: 'providerReference', op: 'EQUAL', value: providerReference },
  ]);
  return docs.length > 0 ? parse(docs[0].id, docs[0].data) : null;
}

export async function createOrder(
  env: Env,
  order: Omit<DataOrder, 'id'>,
  orderId: string,
): Promise<DataOrder> {
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    { ...order },
    { docId: orderId },
  );
  return parse(doc.id, doc.data);
}

export async function updateOrder(
  env: Env,
  id: string,
  fields: Partial<Record<string, unknown>>,
): Promise<void> {
  await firestoreUpdateDoc(env, COLLECTION, id, {
    ...fields,
    updatedAt: new Date().toISOString(),
  });
}

export async function listOrdersForProject(
  env: Env,
  projectId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<{ orders: DataOrder[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const filters: QueryFilter[] = [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ];
  if (opts.before) {
    filters.push({ field: 'createdAt', op: 'LESS_THAN', value: opts.before });
  }

  const docs = await firestoreQuery(env, COLLECTION, filters, {
    orderBy: { field: 'createdAt', direction: 'DESCENDING' },
    limit: limit + 1,
  });

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor =
    hasMore && page.length > 0
      ? ((page[page.length - 1].data.createdAt as string) ?? null)
      : null;

  return {
    orders: page.map((d) => parse(d.id, d.data)),
    nextCursor,
  };
}

/**
 * Orders still in "processing" that haven't been updated recently — used
 * by the reconciliation cron to poll EliteData for a definitive status.
 * Requires composite index: dataOrders(orderStatus ASC, updatedAt ASC).
 */
export async function listOrdersPendingReconciliation(
  env: Env,
  olderThanMinutes: number,
  limit: number,
): Promise<DataOrder[]> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const docs = await firestoreQuery(
    env,
    COLLECTION,
    [
      { field: 'orderStatus', op: 'EQUAL', value: 'processing' },
      { field: 'updatedAt', op: 'LESS_THAN', value: cutoff },
    ],
    {
      orderBy: { field: 'updatedAt', direction: 'ASCENDING' },
      limit,
    },
  );
  return docs.map((d) => parse(d.id, d.data));
}
/**
 * Every project's orders, newest first (admin). Optional status filter.
 * Requires composite index: dataOrders(orderStatus ASC, createdAt DESC).
 */
export async function listAllOrders(
  env: Env,
  opts: { status?: DataOrderStatus; needsReview?: boolean; limit?: number; before?: string } = {},
): Promise<{ orders: DataOrder[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const filters: QueryFilter[] = [];
  if (opts.status) filters.push({ field: 'orderStatus', op: 'EQUAL', value: opts.status });
  if (opts.needsReview) filters.push({ field: 'needsReview', op: 'EQUAL', value: true });
  if (opts.before) filters.push({ field: 'createdAt', op: 'LESS_THAN', value: opts.before });
  const docs = await firestoreQuery(env, COLLECTION, filters, {
    orderBy: { field: 'createdAt', direction: 'DESCENDING' },
    limit: limit + 1,
  });
  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  return {
    orders: page.map((d) => parse(d.id, d.data)),
    nextCursor: hasMore && page.length > 0 ? String(page[page.length - 1].data.createdAt ?? '') || null : null,
  };
}
