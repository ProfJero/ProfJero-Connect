import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreUpdateDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  Provider,
  ProviderService,
  ProviderStatus,
} from '@profjero/shared';

const COLLECTION = 'providers';

/**
 * Internal shape — includes `driver`, which is never returned to clients.
 */
interface ProviderRecord extends Provider {
  driver: string;
}

function parse(id: string, data: Record<string, unknown>): ProviderRecord {
  return {
    id,
    service: data.service as ProviderService,
    label: String(data.label ?? id),
    status: (data.status as ProviderStatus) ?? 'active',
    costPerUnitGhs:
      data.costPerUnitGhs === null || data.costPerUnitGhs === undefined
        ? null
        : Number(data.costPerUnitGhs),
    credits:
      data.credits === null || data.credits === undefined
        ? null
        : Number(data.credits),
    mainBalanceGhs:
      data.mainBalanceGhs === null || data.mainBalanceGhs === undefined
        ? null
        : Number(data.mainBalanceGhs),
    balanceCheckedAt: (data.balanceCheckedAt as string | null) ?? null,
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    updatedBy: String(data.updatedBy ?? 'system'),
    driver: String(data.driver ?? 'arkesel'),
  };
}

/** Strip `driver` for API responses. */
export function toPublicProvider(rec: ProviderRecord): Provider {
  const { driver: _driver, ...pub } = rec;
  return pub;
}

export async function getProviderRecord(
  env: Env,
  id: string,
): Promise<ProviderRecord | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, id);
  return doc ? parse(doc.id, doc.data) : null;
}

export async function listProviderRecords(
  env: Env,
): Promise<ProviderRecord[]> {
  const { docs } = await firestoreListDocs(env, COLLECTION, { pageSize: 200 });
  return docs
    .map((d) => parse(d.id, d.data))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export interface CreateProviderArgs {
  id: string;
  service: ProviderService;
  label: string;
  driver: string;
  status: ProviderStatus;
}

export async function createProvider(
  env: Env,
  args: CreateProviderArgs,
  adminUid: string,
): Promise<ProviderRecord> {
  const now = new Date().toISOString();
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    {
      service: args.service,
      label: args.label,
      driver: args.driver,
      status: args.status,
      costPerUnitGhs: null,
      credits: null,
      mainBalanceGhs: null,
      balanceCheckedAt: null,
      updatedAt: now,
      updatedBy: adminUid,
    },
    { docId: args.id },
  );
  return parse(doc.id, doc.data);
}

export interface UpdateProviderArgs {
  label?: string;
  costPerUnitGhs?: number | null;
  credits?: number | null;
  mainBalanceGhs?: number | null;
  balanceCheckedAt?: string | null;
}

export async function updateProvider(
  env: Env,
  id: string,
  patch: UpdateProviderArgs,
  adminUid: string,
): Promise<ProviderRecord> {
  const now = new Date().toISOString();
  const fields: Record<string, unknown> = {
    updatedAt: now,
    updatedBy: adminUid,
  };
  if (patch.label !== undefined) fields.label = patch.label;
  if (patch.costPerUnitGhs !== undefined)
    fields.costPerUnitGhs = patch.costPerUnitGhs;
  if (patch.credits !== undefined) fields.credits = patch.credits;
  if (patch.mainBalanceGhs !== undefined)
    fields.mainBalanceGhs = patch.mainBalanceGhs;
  if (patch.balanceCheckedAt !== undefined)
    fields.balanceCheckedAt = patch.balanceCheckedAt;

  const doc = await firestoreUpdateDoc(env, COLLECTION, id, fields);
  return parse(doc.id, doc.data);
}