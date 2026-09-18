import { importPKCS8, SignJWT } from 'jose';
import type { Env } from '../types/env';

// ---------- OAuth2 access token for Firestore REST ----------

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
//
// Firestore REST uses a tagged-union format for field values:
//   { stringValue: "foo" }, { integerValue: "42" }, { timestampValue: "..." }
// We translate JS values to and from this format at the boundary.

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
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(encodeValue) } };
  }
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

// ---------- REST operations ----------

interface FsDocument {
  name: string;
  fields?: FsFields;
}

export interface FirestoreDoc {
  id: string;
  data: Record<string, unknown>;
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
  return { id: idFromName(doc.name), data: decodeFields(doc.fields ?? {}) };
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
    docs: (data.documents ?? []).map((d) => ({
      id: idFromName(d.name),
      data: decodeFields(d.fields ?? {}),
    })),
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
  return { id: idFromName(doc.name), data: decodeFields(doc.fields ?? {}) };
}

export async function firestoreUpdateDoc(
  env: Env,
  collection: string,
  docId: string,
  data: Record<string, unknown>,
): Promise<FirestoreDoc> {
  // PATCH with an explicit updateMask = partial update. Without the mask,
  // Firestore replaces the whole document and drops fields we didn't send.
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
  return { id: idFromName(doc.name), data: decodeFields(doc.fields ?? {}) };
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