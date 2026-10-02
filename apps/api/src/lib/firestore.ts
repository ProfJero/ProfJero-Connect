import { importPKCS8, SignJWT } from 'jose';
import type { Env } from '../types/env';

// ---------- OAuth2 access token ----------

interface AccessToken {
  token: string;
  expiresAt: number;
}

let accessTokenCache: AccessToken | null = null;

function normalizePrivateKey(raw: string): string {
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

async function mintServiceAccountJwt(env: Env, scope: string): Promise<string> {
  const privateKey = await importPKCS8(
    normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    'RS256',
  );

  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(env.FIREBASE_CLIENT_EMAIL)
    .setSubject(env.FIREBASE_CLIENT_EMAIL)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
}

export async function getFirestoreAccessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (accessTokenCache && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token;
  }

  const assertion = await mintServiceAccountJwt(
    env,
    'https://www.googleapis.com/auth/datastore',
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth token exchange failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

// ---------- Field encoding / decoding ----------

type FsValue = Record<string, unknown>;
type FsFields = Record<string, FsValue>;

function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') {
    return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  }
  throw new Error(`Cannot encode value of type ${typeof v}`);
}

function encodeFields(data: Record<string, unknown>): FsFields {
  const out: FsFields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    out[k] = encodeValue(v);
  }
  return out;
}

function decodeValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(String(v.integerValue), 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) {
    const m = v.mapValue as { fields?: FsFields };
    return decodeFields(m.fields ?? {});
  }
  if ('arrayValue' in v) {
    const a = v.arrayValue as { values?: FsValue[] };
    return (a.values ?? []).map(decodeValue);
  }
  return null;
}

function decodeFields(fields: FsFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

// ---------- Core types ----------

interface FsDocument {
  name: string;
  fields?: FsFields;
  updateTime?: string;
  createTime?: string;
}

export interface FirestoreDoc {
  id: string;
  data: Record<string, unknown>;
  /**
   * Firestore's updateTime for this document. Used as an optimistic-
   * concurrency token in transaction preconditions. Always present on
   * documents that exist.
   */
  updateTime: string;
}

function baseUrl(env: Env, path: string): string {
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
}

async function fsFetch(env: Env, url: string, init?: RequestInit): Promise<Response> {
  const token = await getFirestoreAccessToken(env);
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

function idFromName(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1];
}

function docFromFs(doc: FsDocument): FirestoreDoc {
  return {
    id: idFromName(doc.name),
    data: decodeFields(doc.fields ?? {}),
    updateTime: doc.updateTime ?? '',
  };
}

// ---------- Simple operations (non-transactional) ----------

export async function firestoreGetDoc(
  env: Env,
  collection: string,
  docId: string,
): Promise<FirestoreDoc | null> {
  const res = await fsFetch(
    env,
    baseUrl(env, `${collection}/${encodeURIComponent(docId)}`),
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore getDoc failed (${res.status}): ${body}`);
  }
  const doc = (await res.json()) as FsDocument;
  return docFromFs(doc);
}

export async function firestoreListDocs(
  env: Env,
  collection: string,
  opts: { pageSize?: number; pageToken?: string } = {},
): Promise<{ docs: FirestoreDoc[]; nextPageToken: string | null }> {
  const url = new URL(baseUrl(env, collection));
  if (opts.pageSize) url.searchParams.set('pageSize', String(opts.pageSize));
  if (opts.pageToken) url.searchParams.set('pageToken', opts.pageToken);

  const res = await fsFetch(env, url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore listDocs failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as {
    documents?: FsDocument[];
    nextPageToken?: string;
  };
  return {
    docs: (data.documents ?? []).map(docFromFs),
    nextPageToken: data.nextPageToken ?? null,
  };
}

export async function firestoreCreateDoc(
  env: Env,
  collection: string,
  data: Record<string, unknown>,
  opts: { docId?: string } = {},
): Promise<FirestoreDoc> {
  const url = new URL(baseUrl(env, collection));
  if (opts.docId) url.searchParams.set('documentId', opts.docId);

  const res = await fsFetch(env, url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore createDoc failed (${res.status}): ${body}`);
  }
  const doc = (await res.json()) as FsDocument;
  return docFromFs(doc);
}

export async function firestoreUpdateDoc(
  env: Env,
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<FirestoreDoc> {
  const url = new URL(
    baseUrl(env, `${collection}/${encodeURIComponent(docId)}`),
  );
  for (const key of Object.keys(data)) {
    url.searchParams.append('updateMask.fieldPaths', key);
  }

  const res = await fsFetch(env, url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore updateDoc failed (${res.status}): ${body}`);
  }
  const doc = (await res.json()) as FsDocument;
  return docFromFs(doc);
}

export async function firestoreDeleteDoc(
  env: Env,
  collection: string,
  docId: string,
): Promise<void> {
  const res = await fsFetch(
    env,
    baseUrl(env, `${collection}/${encodeURIComponent(docId)}`),
    { method: 'DELETE' },
  );
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Firestore deleteDoc failed (${res.status}): ${body}`);
  }
}

// ---------- Structured queries ----------

export type QueryOp = 'EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL';

export interface QueryFilter {
  field: string;
  op: QueryOp;
  value: unknown;
}

export async function firestoreQuery(
  env: Env,
  collection: string,
  filters: QueryFilter[],
  opts: { orderBy?: { field: string; direction: 'ASCENDING' | 'DESCENDING' }; limit?: number } = {},
): Promise<FirestoreDoc[]> {
  const token = await getFirestoreAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

  const query: Record<string, unknown> = {
    from: [{ collectionId: collection }],
  };

  if (filters.length === 1) {
    query.where = {
      fieldFilter: {
        field: { fieldPath: filters[0].field },
        op: filters[0].op,
        value: encodeValue(filters[0].value),
      },
    };
  } else if (filters.length > 1) {
    query.where = {
      compositeFilter: {
        op: 'AND',
        filters: filters.map((f) => ({
          fieldFilter: {
            field: { fieldPath: f.field },
            op: f.op,
            value: encodeValue(f.value),
          },
        })),
      },
    };
  }

  if (opts.orderBy) {
    query.orderBy = [
      {
        field: { fieldPath: opts.orderBy.field },
        direction: opts.orderBy.direction,
      },
    ];
  }
  if (opts.limit) query.limit = opts.limit;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ structuredQuery: query }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore query failed (${res.status}): ${body}`);
  }

  // runQuery returns an array of { document } or { readTime } for empty rows.
  const results = (await res.json()) as Array<{ document?: FsDocument }>;
  return results
    .filter((r): r is { document: FsDocument } => !!r.document)
    .map((r) => docFromFs(r.document));
}

// ---------- Transactions ----------

export type FirestorePrecondition =
  | { exists: true }
  | { exists: false }
  | { updateTime: string };

export interface FirestoreWrite {
  /** Path within the database: "collection/docId" */
  path: string;
  /** Fields to write */
  fields: Record<string, unknown>;
  /**
   * If provided, only these fields are updated; other fields are preserved.
   * If omitted, the entire document is replaced (Firestore's default).
   */
  updateFieldPaths?: string[];
  /** Precondition to fail the write atomically if not met. */
  precondition?: FirestorePrecondition;
}

export interface TransactionHandle {
  get: (collection: string, docId: string) => Promise<FirestoreDoc | null>;
  write: (write: FirestoreWrite) => void;
}

async function beginTransaction(env: Env): Promise<string> {
  const token = await getFirestoreAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:beginTransaction`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ options: { readWrite: {} } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`beginTransaction failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { transaction: string };
  return data.transaction;
}

async function getDocInTransaction(
  env: Env,
  txnId: string,
  collection: string,
  docId: string,
): Promise<FirestoreDoc | null> {
  const token = await getFirestoreAccessToken(env);
  const url = new URL(
    baseUrl(env, `${collection}/${encodeURIComponent(docId)}`),
  );
  url.searchParams.set('transaction', txnId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`getDocInTransaction failed (${res.status}): ${body}`);
  }
  const doc = (await res.json()) as FsDocument;
  return docFromFs(doc);
}

async function commitTransaction(
  env: Env,
  txnId: string,
  writes: FirestoreWrite[],
): Promise<void> {
  const token = await getFirestoreAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`;

  const fsWrites: Record<string, unknown>[] = [];
  for (const w of writes) {
    const docName = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${w.path}`;
    const entry: Record<string, unknown> = {
      update: { name: docName, fields: encodeFields(w.fields) },
    };
    if (w.updateFieldPaths && w.updateFieldPaths.length > 0) {
      entry.updateMask = { fieldPaths: w.updateFieldPaths };
    }
    if (w.precondition) {
      // Firestore's Precondition is a oneof: exists OR updateTime, never both.
      if ('updateTime' in w.precondition && w.precondition.updateTime) {
        entry.currentDocument = { updateTime: w.precondition.updateTime };
      } else if ('exists' in w.precondition) {
        entry.currentDocument = { exists: w.precondition.exists };
      }
    }
    fsWrites.push(entry);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction: txnId, writes: fsWrites }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`commitTransaction failed (${res.status}): ${body}`);
  }
}

/**
 * Run a function within a Firestore transaction, retrying on precondition
 * failures. The function receives a handle with `get` (reads locked to this
 * transaction) and `write` (queued; flushed atomically at the end).
 */
export async function runTransaction<T>(
  env: Env,
  fn: (txn: TransactionHandle) => Promise<T>,
  options: { maxAttempts?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 8;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const txnId = await beginTransaction(env);
    const writes: FirestoreWrite[] = [];

    const txn: TransactionHandle = {
      get: (collection, docId) =>
        getDocInTransaction(env, txnId, collection, docId),
      write: (write) => {
        writes.push(write);
      },
    };

    try {
      const result = await fn(txn);
      await commitTransaction(env, txnId, writes);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Firestore returns 409 ABORTED / FAILED_PRECONDITION when a
      // transaction's precondition fails. Retry with a fresh transaction.
      const isRetryable =
        msg.includes('409') ||
        msg.includes('ABORTED') ||
        msg.includes('FAILED_PRECONDITION');

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw err;
      }

      // Exponential backoff — 50ms, 100ms, 200ms, 400ms.
            // Exponential backoff with jitter. Base 100ms, cap 3000ms, plus 0-50%
      // random jitter to prevent retry storms from synchronized clients.
      const base = Math.min(100 * Math.pow(2, attempt), 3000);
      const jitter = base * 0.5 * Math.random();
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }

  throw new Error('runTransaction exhausted retries');
}
// ---------- Batched writes (non-transactional) ----------

export type BatchWrite = FirestoreWrite | { deletePath: string };

/**
 * Apply many writes with as few round-trips as possible. Each chunk of up
 * to 500 writes commits atomically (Firestore's per-commit limit); chunks
 * are independent. Use for bulk, idempotent operations like contact
 * imports — never for wallet/ledger changes, which go through
 * runTransaction.
 */
export async function firestoreBatchWrite(
  env: Env,
  writes: BatchWrite[],
): Promise<void> {
  if (writes.length === 0) return;
  const token = await getFirestoreAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`;
  const docPrefix = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/`;

  for (let i = 0; i < writes.length; i += 500) {
    const chunk = writes.slice(i, i + 500).map((w) => {
      if ('deletePath' in w) return { delete: docPrefix + w.deletePath };
      const entry: Record<string, unknown> = {
        update: { name: docPrefix + w.path, fields: encodeFields(w.fields) },
      };
      if (w.updateFieldPaths && w.updateFieldPaths.length > 0) {
        entry.updateMask = { fieldPaths: w.updateFieldPaths };
      }
      if (w.precondition && 'exists' in w.precondition) {
        entry.currentDocument = { exists: w.precondition.exists };
      }
      return entry;
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes: chunk }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`firestoreBatchWrite failed (${res.status}): ${body}`);
    }
  }
}
