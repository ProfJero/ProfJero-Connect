/**
 * In-memory stand-ins for every external HTTP API the Worker calls, so the
 * real Hono app can be exercised end to end in Node with no credentials:
 *
 *   - Google OAuth token endpoint + Firebase x509 certs + Auth Admin
 *   - Firestore REST (get/list/create/patch/delete/runQuery/transactions)
 *   - Payment gateway (initialize / verify)
 *   - Resend (records outgoing email)
 *
 * The Firestore fake implements only what apps/api/src/lib/firestore.ts
 * uses, with the semantics that matter for correctness: ALREADY_EXISTS on
 * create, currentDocument preconditions, updateTime optimistic
 * concurrency, and updateMask partial writes.
 */

type FsValue = Record<string, unknown>;
type FsFields = Record<string, FsValue>;

interface StoredDoc {
  fields: FsFields;
  createTime: string;
  updateTime: string;
}

export interface FakeCloud {
  docs: Map<string, StoredDoc>;
  claims: Map<string, Record<string, unknown>>;
  emails: Array<{ to: string[]; subject: string; text: string }>;
  gatewayStatus: Map<string, string>;
  /** Firebase Auth users: email → { uid, disabled }. */
  authUsers: Map<string, { uid: string; disabled: boolean }>;
  /**
   * SMS provider behaviour for SMS_PROVIDER=arkesel tests:
   * ok | http400 | http503 | network. reports: providerMessageId → status.
   */
  provider: { mode: 'ok' | 'http400' | 'http503' | 'network'; reports: Map<string, string>; balance: number; sent: number; calls: number; delayMs: number };
  /** Simulate a database outage: every Firestore call returns 503. */
  firestoreDown: boolean;
  /** Count of Firestore HTTP calls (for load/efficiency checks). */
  firestoreCalls: number;
  fetch: typeof fetch;
  /** Decoded view of one document, for assertions. */
  get(path: string): Record<string, unknown> | null;
  /** Decoded view of a whole collection. */
  list(collection: string): Array<{ id: string; data: Record<string, unknown> }>;
  /** Seed a document directly. */
  put(path: string, data: Record<string, unknown>): void;
}

// ---------- value codec (mirror of lib/firestore.ts) ----------

export function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === 'object') {
    const fields: FsFields = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) fields[k] = encodeValue(x);
    return { mapValue: { fields } };
  }
  throw new Error(`cannot encode ${typeof v}`);
}

export function decodeValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(String(v.integerValue), 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return decodeFields(((v.mapValue as { fields?: FsFields }).fields) ?? {});
  if ('arrayValue' in v) return (((v.arrayValue as { values?: FsValue[] }).values) ?? []).map(decodeValue);
  return null;
}

function decodeFields(f: FsFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) out[k] = decodeValue(v);
  return out;
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

// ---------- the fake ----------

export function createFakeCloud(opts: { projectId: string; certPem: string; kid: string }): FakeCloud {
  const docs = new Map<string, StoredDoc>();
  const claims = new Map<string, Record<string, unknown>>();
  const emails: FakeCloud['emails'] = [];
  const gatewayStatus = new Map<string, string>();
  const gatewayAmounts = new Map<string, number>();
  const authUsers = new Map<string, { uid: string; disabled: boolean }>();
  const provider: FakeCloud['provider'] = { mode: 'ok', reports: new Map(), balance: 50_000, sent: 0, calls: 0, delayMs: 0 };
  const state = { firestoreDown: false, firestoreCalls: 0 };
  let clock = 0;
  let autoId = 0;

  const now = () => new Date(Date.now() + clock++).toISOString();
  const root = `projects/${opts.projectId}/databases/(default)/documents`;
  const base = `https://firestore.googleapis.com/v1/${root}`;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const fsError = (status: number, code: string, message: string) => json({ error: { code: status, status: code, message } }, status);

  const toFs = (path: string, d: StoredDoc) => ({
    name: `${root}/${path}`,
    fields: d.fields,
    createTime: d.createTime,
    updateTime: d.updateTime,
  });

  const write = (path: string, fields: FsFields, mask?: string[]) => {
    const existing = docs.get(path);
    const t = now();
    if (mask && existing) {
      const merged = { ...existing.fields };
      for (const k of mask) {
        if (k in fields) merged[k] = fields[k];
        else delete merged[k];
      }
      docs.set(path, { fields: merged, createTime: existing.createTime, updateTime: t });
    } else if (mask) {
      const picked: FsFields = {};
      for (const k of mask) if (k in fields) picked[k] = fields[k];
      docs.set(path, { fields: picked, createTime: t, updateTime: t });
    } else {
      docs.set(path, { fields, createTime: existing?.createTime ?? t, updateTime: t });
    }
  };

  const collectionDocs = (collection: string) =>
    [...docs.entries()]
      .filter(([p]) => p.split('/').length === 2 && p.startsWith(`${collection}/`))
      .map(([p, d]) => ({ path: p, id: p.split('/')[1], doc: d }));

  type FieldFilter = { field: { fieldPath: string }; op: string; value: FsValue };
  const matches = (data: Record<string, unknown>, f: FieldFilter) => {
    const actual = data[f.field.fieldPath];
    const expected = decodeValue(f.value);
    switch (f.op) {
      case 'EQUAL':
        return actual === expected;
      case 'LESS_THAN':
        return actual !== undefined && compare(actual, expected) < 0;
      case 'LESS_THAN_OR_EQUAL':
        return actual !== undefined && compare(actual, expected) <= 0;
      case 'GREATER_THAN':
        return actual !== undefined && compare(actual, expected) > 0;
      case 'GREATER_THAN_OR_EQUAL':
        return actual !== undefined && compare(actual, expected) >= 0;
      default:
        throw new Error(`fake firestore: unsupported op ${f.op}`);
    }
  };

  async function handleFirestore(url: URL, init: RequestInit): Promise<Response> {
    const method = (init.method ?? 'GET').toUpperCase();
    const rest = decodeURIComponent(url.pathname.replace(`/v1/${root}`, '')).replace(/^\//, '');
    const body = init.body ? JSON.parse(String(init.body)) : null;

    if (rest === ':beginTransaction' || url.pathname.endsWith(':beginTransaction')) {
      return json({ transaction: `txn-${++autoId}` });
    }

    if (url.pathname.endsWith(':runQuery')) {
      const q = body.structuredQuery;
      const collection = q.from[0].collectionId;
      const filters: FieldFilter[] = q.where?.fieldFilter
        ? [q.where.fieldFilter]
        : (q.where?.compositeFilter?.filters ?? []).map((f: { fieldFilter: FieldFilter }) => f.fieldFilter);
      let rows = collectionDocs(collection)
        .map((r) => ({ ...r, data: decodeFields(r.doc.fields) }))
        .filter((r) => filters.every((f) => matches(r.data, f)));
      if (q.orderBy?.[0]) {
        const { field, direction } = q.orderBy[0];
        rows = rows
          .filter((r) => r.data[field.fieldPath] !== undefined)
          .sort((a, b) => compare(a.data[field.fieldPath], b.data[field.fieldPath]) * (direction === 'DESCENDING' ? -1 : 1));
      }
      if (q.limit) rows = rows.slice(0, q.limit);
      if (rows.length === 0) return json([{ readTime: now() }]);
      return json(rows.map((r) => ({ document: toFs(r.path, r.doc) })));
    }

    if (url.pathname.endsWith(':commit')) {
      const writes: Array<Record<string, unknown>> = body.writes ?? [];
      // Validate every precondition first: commits are atomic.
      for (const w of writes) {
        if (w.delete) continue;
        const update = w.update as { name: string };
        const path = update.name.replace(`${root}/`, '');
        const cur = w.currentDocument as { exists?: boolean; updateTime?: string } | undefined;
        const existing = docs.get(path);
        if (cur?.exists === false && existing) return fsError(409, 'ALREADY_EXISTS', `Document already exists: ${path}`);
        if (cur?.exists === true && !existing) return fsError(404, 'NOT_FOUND', `No document to update: ${path}`);
        if (cur?.updateTime && existing?.updateTime !== cur.updateTime) {
          return fsError(400, 'FAILED_PRECONDITION', `updateTime mismatch for ${path}`);
        }
      }
      for (const w of writes) {
        if (w.delete) {
          docs.delete(String(w.delete).replace(`${root}/`, ''));
          continue;
        }
        const update = w.update as { name: string; fields: FsFields };
        const path = update.name.replace(`${root}/`, '');
        const mask = (w.updateMask as { fieldPaths?: string[] } | undefined)?.fieldPaths;
        write(path, update.fields ?? {}, mask);
      }
      return json({ commitTime: now() });
    }

    const parts = rest.split('/');
    if (parts.length === 1) {
      const collection = parts[0];
      if (method === 'GET') {
        return json({ documents: collectionDocs(collection).map((r) => toFs(r.path, r.doc)) });
      }
      if (method === 'POST') {
        const id = url.searchParams.get('documentId') ?? `auto${String(++autoId).padStart(6, '0')}`;
        const path = `${collection}/${id}`;
        if (docs.has(path)) return fsError(409, 'ALREADY_EXISTS', `Document already exists: ${path}`);
        write(path, body.fields ?? {});
        return json(toFs(path, docs.get(path)!));
      }
    }

    if (parts.length === 2) {
      const path = rest;
      if (method === 'GET') {
        const d = docs.get(path);
        return d ? json(toFs(path, d)) : fsError(404, 'NOT_FOUND', `not found: ${path}`);
      }
      if (method === 'PATCH') {
        const mask = url.searchParams.getAll('updateMask.fieldPaths');
        write(path, body.fields ?? {}, mask.length ? mask : undefined);
        return json(toFs(path, docs.get(path)!));
      }
      if (method === 'DELETE') {
        docs.delete(path);
        return json({});
      }
    }

    throw new Error(`fake firestore: unhandled ${method} ${url.pathname}`);
  }

  const fakeFetch: typeof fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = (init.method ?? 'GET').toUpperCase();

    if (url.href.startsWith('https://www.googleapis.com/robot/v1/metadata/x509/')) {
      return new Response(JSON.stringify({ [opts.kid]: opts.certPem }), {
        headers: { 'cache-control': 'max-age=3600', 'content-type': 'application/json' },
      });
    }
    if (url.href === 'https://oauth2.googleapis.com/token') {
      return json({ access_token: 'fake-access-token', expires_in: 3600 });
    }
    if (url.hostname === 'identitytoolkit.googleapis.com') {
      const body = init.body ? JSON.parse(String(init.body)) : {};
      if (url.pathname.endsWith('accounts:update')) {
        if (body.customAttributes) claims.set(body.localId, JSON.parse(body.customAttributes));
        if (typeof body.disableUser === 'boolean') {
          for (const u of authUsers.values()) if (u.uid === body.localId) u.disabled = body.disableUser;
        }
        return json({ localId: body.localId });
      }
      if (url.pathname.endsWith('accounts:lookup')) {
        const email = String(body.email?.[0] ?? '').toLowerCase();
        const u = authUsers.get(email);
        return json(u ? { users: [{ localId: u.uid, email, disabled: u.disabled }] } : {});
      }
      if (url.pathname.endsWith('accounts:sendOobCode')) {
        return json({ email: body.email, oobLink: `https://auth.example/reset?email=${encodeURIComponent(body.email)}&code=${++autoId}` });
      }
      if (url.pathname.endsWith('/accounts')) {
        const email = String(body.email).toLowerCase();
        if (authUsers.has(email)) return json({ error: { code: 400, message: 'EMAIL_EXISTS' } }, 400);
        const uid = `fbuid${++autoId}`;
        authUsers.set(email, { uid, disabled: false });
        return json({ localId: uid, email });
      }
    }
    if (url.hostname === 'firestore.googleapis.com') {
      state.firestoreCalls += 1;
      if (state.firestoreDown) return fsError(503, 'UNAVAILABLE', 'The service is currently unavailable.');
      return handleFirestore(url, init);
    }
    if (url.hostname === 'sms.arkesel.com') {
      if (url.pathname.endsWith('/sms/send')) {
        provider.calls += 1;
        if (provider.delayMs) await new Promise((r) => setTimeout(r, provider.delayMs));
        if (provider.mode === 'network') throw new TypeError('fetch failed: ECONNRESET');
        if (provider.mode === 'http400') return json({ status: 'error', message: 'Invalid Sender Id' }, 400);
        if (provider.mode === 'http503') return json({ status: 'error', message: 'Service Unavailable' }, 503);
        const body = JSON.parse(String(init.body));
        const data = (body.recipients as string[]).map((r) => ({ recipient: r, id: `prov-${++autoId}` }));
        provider.sent += data.length;
        return json({ status: 'success', data });
      }
      if (url.pathname.endsWith('/sms/message-reports')) {
        const body = JSON.parse(String(init.body));
        const data: Record<string, unknown> = {};
        for (const id of body.msg_ids as string[]) {
          const st = provider.reports.get(id);
          if (st) data[id] = { status: st };
        }
        return json({ status: 'success', data });
      }
      if (url.pathname.endsWith('/clients/balance-details')) {
        return json({ status: 'success', data: { sms_balance: provider.balance, main_balance: 12.5 } });
      }
    }
    if (url.href === 'https://api.paystack.co/transaction/initialize') {
      const body = JSON.parse(String(init.body));
      gatewayStatus.set(body.reference, 'abandoned');
      gatewayAmounts.set(body.reference, body.amount);
      return json({
        status: true,
        message: 'Authorization URL created',
        data: { authorization_url: `https://checkout.example/${body.reference}`, access_code: `ac_${body.reference}`, reference: body.reference },
      });
    }
    if (url.href.startsWith('https://api.paystack.co/transaction/verify/')) {
      const ref = decodeURIComponent(url.pathname.split('/').pop()!);
      return json({
        status: true,
        message: 'Verification successful',
        data: { status: gatewayStatus.get(ref) ?? 'abandoned', reference: ref, amount: gatewayAmounts.get(ref) ?? 0, currency: 'GHS', paid_at: null },
      });
    }
    if (url.href === 'https://api.resend.com/emails' && method === 'POST') {
      const body = JSON.parse(String(init.body));
      emails.push({ to: body.to, subject: body.subject, text: body.text });
      return json({ id: `email_${emails.length}` });
    }
    throw new Error(`fake cloud: unexpected request ${method} ${url.href}`);
  };

  return {
    docs,
    claims,
    emails,
    gatewayStatus,
    authUsers,
    provider,
    get firestoreDown() {
      return state.firestoreDown;
    },
    set firestoreDown(v: boolean) {
      state.firestoreDown = v;
    },
    get firestoreCalls() {
      return state.firestoreCalls;
    },
    set firestoreCalls(v: number) {
      state.firestoreCalls = v;
    },
    fetch: fakeFetch,
    get(path) {
      const d = docs.get(path);
      return d ? decodeFields(d.fields) : null;
    },
    list(collection) {
      return collectionDocs(collection).map((r) => ({ id: r.id, data: decodeFields(r.doc.fields) }));
    },
    put(path, data) {
      const fields: FsFields = {};
      for (const [k, v] of Object.entries(data)) fields[k] = encodeValue(v);
      write(path, fields);
    },
  };
}
