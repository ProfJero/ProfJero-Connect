import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreUpdateDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type { Payment, PaymentStatus } from '@profjero/shared';

const COLLECTION = 'payments';

function parsePayment(id: string, data: Record<string, unknown>): Payment {
  return {
    reference: id,
    provider: (data.provider as Payment['provider']) ?? 'paystack',
    projectId: String(data.projectId),
    packageId: (data.packageId as string | null) ?? null,
    units: Number(data.units ?? 0),
    amountPesewas: Number(data.amountPesewas ?? 0),
    currency: String(data.currency ?? 'GHS'),
    status: data.status as PaymentStatus,
    customerEmail: (data.customerEmail as string | null) ?? null,
    authorizationUrl: (data.authorizationUrl as string | null) ?? null,
    accessCode: (data.accessCode as string | null) ?? null,
    createdAt: String(data.createdAt),
    createdBy: String(data.createdBy),
    paidAt: (data.paidAt as string | null) ?? null,
    walletCreditedAt: (data.walletCreditedAt as string | null) ?? null,
    walletTransactionId: (data.walletTransactionId as string | null) ?? null,
    failureReason: (data.failureReason as string | null) ?? null,
    webhookData:
      (data.webhookData as Record<string, unknown> | null) ?? null,
  };
}

export async function getPaymentByReference(
  env: Env,
  reference: string,
): Promise<Payment | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, reference);
  return doc ? parsePayment(doc.id, doc.data) : null;
}

export async function listPayments(
  env: Env,
  filters: { projectId?: string; status?: PaymentStatus } = {},
): Promise<Payment[]> {
  const { docs } = await firestoreListDocs(env, COLLECTION, { pageSize: 500 });
  let payments = docs.map((d) => parsePayment(d.id, d.data));
  if (filters.projectId) {
    payments = payments.filter((p) => p.projectId === filters.projectId);
  }
  if (filters.status) {
    payments = payments.filter((p) => p.status === filters.status);
  }
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface CreatePaymentArgs {
  reference: string;
  projectId: string;
  packageId: string | null;
  units: number;
  amountPesewas: number;
  currency: string;
  customerEmail: string;
  authorizationUrl: string;
  accessCode: string;
  createdBy: string;
}

export async function createPayment(
  env: Env,
  args: CreatePaymentArgs,
): Promise<Payment> {
  const now = new Date().toISOString();
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    {
      provider: 'paystack',
      projectId: args.projectId,
      packageId: args.packageId,
      units: args.units,
      amountPesewas: args.amountPesewas,
      currency: args.currency,
      status: 'pending',
      customerEmail: args.customerEmail,
      authorizationUrl: args.authorizationUrl,
      accessCode: args.accessCode,
      createdAt: now,
      createdBy: args.createdBy,
      paidAt: null,
      walletCreditedAt: null,
      walletTransactionId: null,
      failureReason: null,
      webhookData: null,
    },
    { docId: args.reference },
  );
  return parsePayment(doc.id, doc.data);
}

export async function updatePayment(
  env: Env,
  reference: string,
  fields: Partial<Record<string, unknown>>,
): Promise<Payment> {
  const doc = await firestoreUpdateDoc(env, COLLECTION, reference, fields);
  return parsePayment(doc.id, doc.data);
}