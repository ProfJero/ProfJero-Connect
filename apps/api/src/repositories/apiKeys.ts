import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  runTransaction,
} from '../lib/firestore';
import {
  generateApiKey,
  generatePublishableApiKey,
} from '../services/apiKeys';
import type { Env } from '../types/env';
import type {
  ApiKey,
  ApiKeyWithSecret,
  RecipientMode,
} from '@profjero/shared';

const COLLECTION = 'apiKeys';

function parseApiKey(id: string, data: Record<string, unknown>): ApiKey {
  return {
    id,
    projectId: String(data.projectId),
    name: String(data.name),
    // Older docs predate the kind field — default to 'secret'.
    kind: ((data.kind as ApiKey['kind']) ?? 'secret'),
    keyPrefix: String(data.keyPrefix),
    status: data.status as ApiKey['status'],
    createdAt: String(data.createdAt),
    createdBy: String(data.createdBy),
    revokedAt: (data.revokedAt as string | null) ?? null,
    revokedBy: (data.revokedBy as string | null) ?? null,
    lastUsedAt: (data.lastUsedAt as string | null) ?? null,

    recipientMode: (data.recipientMode as RecipientMode | null | undefined) ?? null,
    recipientList: Array.isArray(data.recipientList)
      ? (data.recipientList as string[])
      : [],
    rateLimitPerMinute: Number(data.rateLimitPerMinute ?? 0),
    rateLimitPerHour: Number(data.rateLimitPerHour ?? 0),
    rateLimitPerDay: Number(data.rateLimitPerDay ?? 0),
    lifetimeUnitCap: Number(data.lifetimeUnitCap ?? 0),
    lifetimeUnitsSpent: Number(data.lifetimeUnitsSpent ?? 0),
    expiresAt: (data.expiresAt as string | null) ?? null,

    rateMinuteBucket: (data.rateMinuteBucket as string | null) ?? null,
    rateMinuteCount: Number(data.rateMinuteCount ?? 0),
    rateHourBucket: (data.rateHourBucket as string | null) ?? null,
    rateHourCount: Number(data.rateHourCount ?? 0),
    rateDayBucket: (data.rateDayBucket as string | null) ?? null,
    rateDayCount: Number(data.rateDayCount ?? 0),
  };
}

export async function listApiKeysForProject(
  env: Env,
  projectId: string,
): Promise<ApiKey[]> {
  const docs = await firestoreQuery(env, COLLECTION, [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  return docs
    .map((d) => parseApiKey(d.id, d.data))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApiKeyById(
  env: Env,
  keyId: string,
): Promise<ApiKey | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, keyId);
  return doc ? parseApiKey(doc.id, doc.data) : null;
}

/**
 * Look up active keys by prefix. Returns array (future-proof against the
 * astronomically unlikely prefix collision between a secret and a
 * publishable key).
 */
export async function findApiKeysByPrefix(
  env: Env,
  prefix: string,
): Promise<Array<{ key: ApiKey; hash: string }>> {
  const docs = await firestoreQuery(env, COLLECTION, [
    { field: 'keyPrefix', op: 'EQUAL', value: prefix },
  ]);
  return docs.map((d) => ({
    key: parseApiKey(d.id, d.data),
    hash: String(d.data.keyHash),
  }));
}

// ---------- Secret keys (existing behaviour) ----------

function secretKeyFields(projectId: string, name: string, createdBy: string, prefix: string, hash: string) {
  return {
    projectId,
    name,
    kind: 'secret',
    keyPrefix: prefix,
    keyHash: hash,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy,
    revokedAt: null,
    revokedBy: null,
    lastUsedAt: null,
    // Publishable fields default to empty; harmless for secret keys.
    recipientMode: null,
    recipientList: [],
    rateLimitPerMinute: 0,
    rateLimitPerHour: 0,
    rateLimitPerDay: 0,
    lifetimeUnitCap: 0,
    lifetimeUnitsSpent: 0,
    expiresAt: null,
    rateMinuteBucket: null,
    rateMinuteCount: 0,
    rateHourBucket: null,
    rateHourCount: 0,
    rateDayBucket: null,
    rateDayCount: 0,
  };
}

export async function createApiKey(
  env: Env,
  projectId: string,
  name: string,
  adminUid: string,
): Promise<ApiKeyWithSecret> {
  const generated = await generateApiKey();
  const doc = await firestoreCreateDoc(
    env,
    COLLECTION,
    secretKeyFields(projectId, name, adminUid, generated.prefix, generated.hash),
  );
  const apiKey = parseApiKey(doc.id, doc.data);
  return { ...apiKey, plaintext: generated.plaintext };
}

/**
 * Create a secret key only if the project has fewer than `maxActive`
 * active keys — atomically. A per-project lock document is written in the
 * same commit as the key, so concurrent requests serialize: the loser's
 * commit fails its precondition, retries, and re-counts. Returns null when
 * the cap is reached.
 */
export async function createApiKeyCapped(
  env: Env,
  projectId: string,
  name: string,
  createdBy: string,
  maxActive: number,
): Promise<ApiKeyWithSecret | null> {
  return runTransaction(env, async (txn) => {
    const lockId = `apikeys__${projectId}`;
    const lock = await txn.get('locks', lockId);
    const active = (await listApiKeysForProject(env, projectId)).filter((k) => k.status === 'active');
    if (active.length >= maxActive) return null;

    const generated = await generateApiKey();
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const fields = secretKeyFields(projectId, name, createdBy, generated.prefix, generated.hash);
    txn.write({ path: `${COLLECTION}/${id}`, fields, precondition: { exists: false } });
    txn.write({
      path: `locks/${lockId}`,
      fields: { kind: 'apiKeys', projectId, updatedAt: fields.createdAt },
      precondition: lock?.updateTime ? { updateTime: lock.updateTime } : { exists: false },
    });
    return { ...parseApiKey(id, fields), plaintext: generated.plaintext };
  });
}

// ---------- Publishable keys ----------

export interface CreatePublishableArgs {
  name: string;
  recipientMode: RecipientMode;
  recipientList: string[];
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  lifetimeUnitCap: number;
  expiresAt: string | null;
}

export async function createPublishableApiKey(
  env: Env,
  projectId: string,
  args: CreatePublishableArgs,
  adminUid: string,
): Promise<ApiKeyWithSecret> {
  const generated = await generatePublishableApiKey();
  const now = new Date().toISOString();

  const doc = await firestoreCreateDoc(env, COLLECTION, {
    projectId,
    name: args.name,
    kind: 'publishable',
    keyPrefix: generated.prefix,
    keyHash: generated.hash,
    status: 'active',
    createdAt: now,
    createdBy: adminUid,
    revokedAt: null,
    revokedBy: null,
    lastUsedAt: null,
    rateMinuteBucket: null,
    rateMinuteCount: 0,
    rateHourBucket: null,
    rateHourCount: 0,
    rateDayBucket: null,
    rateDayCount: 0,

    recipientMode: args.recipientMode,
    recipientList: args.recipientList,
    rateLimitPerMinute: args.rateLimitPerMinute,
    rateLimitPerHour: args.rateLimitPerHour,
    rateLimitPerDay: args.rateLimitPerDay,
    lifetimeUnitCap: args.lifetimeUnitCap,
    lifetimeUnitsSpent: 0,
    expiresAt: args.expiresAt,
  });

  const apiKey = parseApiKey(doc.id, doc.data);
  return { ...apiKey, plaintext: generated.plaintext };
}

// ---------- Revocation + usage (unchanged) ----------

export async function revokeApiKey(
  env: Env,
  keyId: string,
  adminUid: string,
): Promise<ApiKey | null> {
  const existing = await getApiKeyById(env, keyId);
  if (!existing) return null;
  if (existing.status === 'revoked') return existing;

  const now = new Date().toISOString();
  const doc = await firestoreUpdateDoc(env, COLLECTION, keyId, {
    status: 'revoked',
    revokedAt: now,
    revokedBy: adminUid,
  });
  return parseApiKey(doc.id, doc.data);
}

export async function markApiKeyUsed(
  env: Env,
  keyId: string,
  previousLastUsedAt: string | null,
): Promise<void> {
  if (previousLastUsedAt) {
    const elapsed = Date.now() - new Date(previousLastUsedAt).getTime();
    if (elapsed < 5 * 60 * 1000) return;
  }
  try {
    await firestoreUpdateDoc(env, COLLECTION, keyId, {
      lastUsedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('markApiKeyUsed failed:', err);
  }
}

/**
 * Increment the publishable key's lifetime spend tracker.
 * Called after a successful SMS send with the batch's total units charged.
 * Best-effort — a failure here means the cap is undercounted by a small
 * amount until the next send. Not worth a transaction.
 */
export async function incrementApiKeySpend(
  env: Env,
  keyId: string,
  units: number,
): Promise<void> {
  if (units <= 0) return;
  try {
    const current = await getApiKeyById(env, keyId);
    if (!current || current.kind !== 'publishable') return;
    await firestoreUpdateDoc(env, COLLECTION, keyId, {
      lifetimeUnitsSpent: current.lifetimeUnitsSpent + units,
    });
  } catch (err) {
    console.error('incrementApiKeySpend failed:', err);
  }
}