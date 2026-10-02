/**
 * End-to-end test of the /customer/* surface against the real Worker code,
 * with Google/Firestore/payment-gateway/email replaced by an in-memory fake
 * (test/fakeCloud.ts). No credentials or network needed.
 *
 *   npm run test:customer --workspace=@profjero/api
 *
 * Requires `openssl` on PATH (to mint a throwaway signing certificate).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import worker from '../src/index';
import { approveSenderIdValue } from '../src/services/senderIds';
import { listProjects } from '../src/repositories/projects';
import type { Env } from '../src/types/env';
import { createFakeCloud } from './fakeCloud';

// ---------- setup ----------

const PROJECT = 'test-project';
const KID = 'test-kid';
const PAYSTACK_SECRET = 'sk_test_fake';

const dir = mkdtempSync(join(tmpdir(), 'pj-e2e-'));
execFileSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
  '-subj', '/CN=test', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem'),
], { stdio: 'ignore' });
const keyPem = readFileSync(join(dir, 'key.pem'), 'utf8');
const certPem = readFileSync(join(dir, 'cert.pem'), 'utf8');
rmSync(dir, { recursive: true, force: true });

const cloud = createFakeCloud({ projectId: PROJECT, certPem, kid: KID });
globalThis.fetch = cloud.fetch;

const env: Env = {
  ENVIRONMENT: 'development',
  FIREBASE_PROJECT_ID: PROJECT,
  FIREBASE_CLIENT_EMAIL: 'svc@test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: keyPem,
  PAYSTACK_SECRET_KEY: PAYSTACK_SECRET,
  RESEND_API_KEY: 're_test',
  EMAIL_FROM: 'ProfJero Connect <test@example.com>',
  CUSTOMER_APP_URL: 'https://app.example',
};

const signingKey = await importPKCS8(keyPem, 'RS256');

/** Mint a Firebase-style ID token, carrying any claims the fake has set. */
async function idToken(uid: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email, ...(cloud.claims.get(uid) ?? {}) })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setAudience(PROJECT)
    .setSubject(uid)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(signingKey);
}

const ctx = { waitUntil() {}, passThroughOnException() {} } as unknown as ExecutionContext;

interface Res<T = Record<string, any>> {
  status: number;
  body: T;
}

async function call<T = Record<string, any>>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string>; raw?: string } = {},
): Promise<Res<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const req = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  });
  const res = await worker.fetch(req as never, env, ctx);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

let passed = 0;
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

/** Register a customer and return a token that carries the claim. */
async function signUp(uid: string, email: string, org: string): Promise<string> {
  const r = await call('POST', '/customer/register', {
    token: await idToken(uid, email),
    body: { displayName: `${org} Owner`, organisationName: org, acceptedTerms: true },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return idToken(uid, email);
}

// Seed the pricing catalog the way the admin dashboard would.
cloud.put('pricingSettings/sms', {
  service: 'sms', currency: 'GHS', unitPriceGhs: 0.05, minPurchaseUnits: 100, maxPurchaseUnits: 100000,
  active: true, updatedAt: new Date().toISOString(), updatedBy: 'seed',
});
cloud.put('packages/starter', {
  service: 'sms', name: 'Starter', units: 500, priceGhs: 20, description: null, active: true, displayOrder: 10,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'seed', updatedBy: 'seed',
});

console.log('\nCustomer platform e2e');

// ---------- auth + account ----------

let token = '';
let projectId = '';

await step('rejects unauthenticated requests', async () => {
  const r = await call('GET', '/customer/me');
  assert.equal(r.status, 401);
  assert.ok(r.body.error.requestId);
});

await step('register creates account, wallet, starter credit and claim', async () => {
  token = await signUp('uid-alice', 'alice@example.com', 'Alice Bakery');
  assert.deepEqual(cloud.claims.get('uid-alice'), { customer: true });
  const me = await call('GET', '/customer/me', { token });
  assert.equal(me.status, 200);
  assert.equal(me.body.customer.organisationName, 'Alice Bakery');
  assert.equal(me.body.customer.emailNotifications, true);
  assert.equal(me.body.customer.phone, null);
  projectId = me.body.customer.projectId;
  const w = await call('GET', '/customer/wallet', { token });
  assert.equal(w.body.availableUnits, 3);
});

await step('register is idempotent', async () => {
  const r = await call('POST', '/customer/register', {
    token,
    body: { displayName: 'x', organisationName: 'y', acceptedTerms: true },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.isNew, false);
  assert.equal(r.body.project.name, 'Alice Bakery');
});

await step('profile update + email preference', async () => {
  const r = await call('PUT', '/customer/me', { token, body: { phone: '+233241112222' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.customer.phone, '+233241112222');
  const p = await call('PUT', '/customer/me/preferences', { token, body: { emailNotifications: false } });
  assert.equal(p.status, 200);
  assert.equal((await call('GET', '/customer/me', { token })).body.customer.emailNotifications, false);
  await call('PUT', '/customer/me/preferences', { token, body: { emailNotifications: true } });
});

// ---------- payments (CP3) ----------

let reference = '';

await step('package checkout is idempotent on Idempotency-Key', async () => {
  const headers = { 'Idempotency-Key': 'topup-key-0001', Origin: 'http://localhost:5174' };
  const a = await call('POST', '/customer/payments', { token, headers, body: { packageId: 'starter', method: 'mobile_money' } });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  assert.match(a.body.checkoutUrl, /^https:\/\/checkout\.example\//);
  assert.equal(a.body.payment.units, 500);
  assert.equal(a.body.payment.amountGhs, 20);
  assert.equal(a.body.payment.status, 'pending');
  assert.equal('provider' in a.body.payment, false, 'gateway name must not leak');
  const b = await call('POST', '/customer/payments', { token, headers, body: { packageId: 'starter' } });
  assert.equal(b.body.payment.reference, a.body.payment.reference);
  reference = a.body.payment.reference;
});

await step('custom amount respects min purchase and rejects missing key', async () => {
  const low = await call('POST', '/customer/payments', { token, headers: { 'Idempotency-Key': 'topup-key-0002' }, body: { units: 10 } });
  assert.equal(low.status, 400);
  assert.match(low.body.error.message, /minimum purchase/i);
  const ok = await call('POST', '/customer/payments', { token, headers: { 'Idempotency-Key': 'topup-key-0003' }, body: { units: 200 } });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.payment.amountGhs, 10);
  const noKey = await call('POST', '/customer/payments', { token, body: { units: 200 } });
  assert.equal(noKey.status, 400);
});

await step('verify leaves an unfinished checkout pending', async () => {
  const r = await call('POST', `/customer/payments/${reference}/verify`, { token });
  assert.equal(r.status, 200);
  assert.equal(r.body.payment.status, 'pending');
  assert.equal(r.body.walletCredited, false);
});

await step('a checkout abandoned for 30+ minutes is marked abandoned on re-check', async () => {
  const r = await call('POST', '/customer/payments', { token, headers: { 'Idempotency-Key': 'topup-key-0004' }, body: { packageId: 'starter' } });
  const ref = r.body.payment.reference;
  const doc = cloud.get(`payments/${ref}`)!;
  cloud.put(`payments/${ref}`, { ...doc, createdAt: new Date(Date.now() - 31 * 60_000).toISOString() });
  const v = await call('POST', `/customer/payments/${ref}/verify`, { token });
  assert.equal(v.body.payment.status, 'abandoned');
  const fresh = await call('POST', `/customer/payments/${reference}/verify`, { token });
  assert.equal(fresh.body.payment.status, 'pending', 'recent checkout stays pending');
});

await step('payment webhook credits wallet once, notifies and emails once', async () => {
  const payload = JSON.stringify({ event: 'charge.success', data: { reference, status: 'success' } });
  const sig = createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex');
  for (let i = 0; i < 2; i++) {
    const r = await call('POST', '/webhooks/paystack', { raw: payload, headers: { 'x-paystack-signature': sig } });
    assert.equal(r.status, 200);
  }
  const w = await call('GET', '/customer/wallet', { token });
  assert.equal(w.body.availableUnits, 503);
  const receipts = cloud.list('notifications').filter((n) => n.id === `payment__${reference}`);
  assert.equal(receipts.length, 1);
  assert.equal(cloud.emails.filter((e) => e.subject === 'Payment received').length, 1);
  const list = await call('GET', '/customer/payments', { token });
  assert.equal(list.body.summary.totalPaidGhs, 20);
  assert.equal(list.body.summary.totalUnitsPurchased, 500);
  assert.equal(list.body.payments.find((p: any) => p.reference === reference).status, 'success');
});

await step('ledger text is scrubbed of provider names', async () => {
  const t = await call('GET', '/customer/wallet/transactions?view=summary', { token });
  const purchase = t.body.transactions.find((x: any) => x.type === 'purchase');
  assert.ok(purchase);
  assert.doesNotMatch(JSON.stringify(t.body), /paystack|arkesel/i);
});

// ---------- sender IDs (CP6) ----------

await step('sender ID request is pending and blocks sending', async () => {
  const r = await call('POST', '/customer/sender-ids', {
    token,
    body: { value: 'alicebake', purpose: 'Business Notifications', description: 'Order updates for our customers.' },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.senderId.value, 'ALICEBAKE');
  assert.equal(r.body.senderId.status, 'pending');
  const dup = await call('POST', '/customer/sender-ids', {
    token,
    body: { value: 'ALICEBAKE', purpose: 'Business Notifications', description: 'Order updates for our customers.' },
  });
  assert.equal(dup.status, 409);
  const send = await call('POST', '/customer/sms/send', {
    token,
    headers: { 'Idempotency-Key': 'send-pending-01' },
    body: { senderId: 'ALICEBAKE', message: 'hi', recipients: ['0241234567'] },
  });
  assert.equal(send.status, 400);
  assert.match(send.body.error.message, /awaiting approval/);
});

await step('customer projects (incl. legacy CP1 shape) are visible to the admin queue', async () => {
  // A project as CP1's register wrote it, before the contact/audit fields.
  cloud.put('projects/legacycp1', {
    name: 'Legacy Shop', origin: 'customer', status: 'active',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  const ids = (await listProjects(env)).map((p) => p.id);
  assert.ok(ids.includes(projectId), 'new customer project listed');
  assert.ok(ids.includes('legacycp1'), 'legacy customer project listed');
  cloud.docs.delete('projects/legacycp1');
});

await step('admin approval notifies the customer by app and email', async () => {
  await approveSenderIdValue(env, 'ALICEBAKE', 'admin-1');
  const s = await call('GET', '/customer/sender-ids', { token });
  assert.equal(s.body.senderIds[0].status, 'approved');
  assert.equal(s.body.senderIds[0].purpose, 'Business Notifications');
  const n = await call('GET', '/customer/notifications', { token });
  assert.ok(n.body.notifications.some((x: any) => x.title === 'Sender ID "ALICEBAKE" approved'));
  assert.ok(cloud.emails.some((e) => e.subject === 'Sender ID "ALICEBAKE" approved'));
});

// ---------- contacts + groups ----------

let groupId = '';
let kofiId = '';

await step('contacts CRUD with duplicate protection', async () => {
  const g = await call('POST', '/customer/contact-groups', { token, body: { name: 'Customers', color: 'emerald' } });
  assert.equal(g.status, 201);
  groupId = g.body.group.id;
  const c = await call('POST', '/customer/contacts', { token, body: { name: 'Kofi', phone: '024 111 2233', groupIds: [groupId] } });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  assert.equal(c.body.contact.phone, '233241112233');
  kofiId = c.body.contact.id;
  const dup = await call('POST', '/customer/contacts', { token, body: { name: 'Kofi again', phone: '+233241112233' } });
  assert.equal(dup.status, 409);
  const bad = await call('POST', '/customer/contacts', { token, body: { name: 'Bad', phone: '12ab' } });
  assert.equal(bad.status, 400);
  const foreignGroup = await call('POST', '/customer/contacts', { token, body: { name: 'X', phone: '0249998888', groupIds: ['nope'] } });
  assert.equal(foreignGroup.status, 404);
});

await step('CSV-style import upserts and reports skipped rows', async () => {
  const r = await call('POST', '/customer/contacts/import', {
    token,
    body: {
      groupId,
      contacts: [
        { name: 'Ama', phone: '0201234500' }, // ends 00 → mock provider fails it
        { name: 'Yaw', phone: '0201234567' },
        { name: 'Yaw dup', phone: '+233201234567' },
        { name: 'Kofi', phone: '0241112233' }, // already a member
        { phone: 'garbage' },
      ],
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.created, 2);
  assert.equal(r.body.updated, 0);
  assert.equal(r.body.skipped.length, 3);
  const groups = await call('GET', '/customer/contact-groups', { token });
  assert.equal(groups.body.groups[0].contactCount, 3);
  const search = await call('GET', '/customer/contacts?q=yaw', { token });
  assert.equal(search.body.total, 1);
  assert.equal(search.body.stats.total, 3);
});

await step('editing a contact phone moves it safely', async () => {
  const r = await call('PUT', `/customer/contacts/${kofiId}`, { token, body: { phone: '0241112244' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.contact.phone, '233241112244');
  assert.equal(cloud.get(`contacts/${kofiId}`), null);
  kofiId = r.body.contact.id;
  assert.deepEqual(cloud.get(`contacts/${kofiId}`)!.groupIds, [groupId]);
});

// ---------- send SMS (CP4) + history (CP5) ----------

let batchId = '';

await step('send merges numbers + group, dedupes, charges only accepted', async () => {
  const before = (await call('GET', '/customer/wallet', { token })).body.availableUnits;
  const r = await call('POST', '/customer/sms/send', {
    token,
    headers: { 'Idempotency-Key': 'send-batch-0001' },
    body: {
      senderId: 'ALICEBAKE',
      message: 'Fresh bread is ready!',
      recipients: ['0201234567', '+233 55 000 1111'],
      groupIds: [groupId],
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  batchId = r.body.batch.id;
  // 0201234567 is both typed and in the group → 4 unique recipients.
  assert.equal(r.body.batch.totalRecipients, 4);
  assert.equal(r.body.batch.failedCount, 1);
  assert.equal(r.body.batch.submittedCount, 3);
  assert.equal(r.body.batch.status, 'partial');
  assert.equal(r.body.batch.source, 'dashboard');
  assert.doesNotMatch(JSON.stringify(r.body), /providerMessageId|apiKeyId/);
  const after = (await call('GET', '/customer/wallet', { token })).body;
  assert.equal(after.availableUnits, before - 3);
  assert.equal(after.reservedUnits, 0);
});

await step('send replay returns the same batch without charging', async () => {
  const before = (await call('GET', '/customer/wallet', { token })).body.availableUnits;
  const r = await call('POST', '/customer/sms/send', {
    token,
    headers: { 'Idempotency-Key': 'send-batch-0001' },
    body: { senderId: 'ALICEBAKE', message: 'Fresh bread is ready!', recipients: ['0201234567'] },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.batch.id, batchId);
  assert.equal((await call('GET', '/customer/wallet', { token })).body.availableUnits, before);
});

await step('failed recipients raise an in-app notification', async () => {
  const n = await call('GET', '/customer/notifications?type=sms', { token });
  assert.equal(n.body.notifications.length, 1);
  assert.equal(n.body.notifications[0].link, `/messaging/history/${encodeURIComponent(batchId)}`);
});

await step('invalid numbers and insufficient balance are rejected cleanly', async () => {
  const bad = await call('POST', '/customer/sms/send', {
    token,
    headers: { 'Idempotency-Key': 'send-bad-num-01' },
    body: { senderId: 'ALICEBAKE', message: 'x', recipients: ['12'] },
  });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error.message, /invalid phone/);
  const many = Array.from({ length: 600 }, (_, i) => `0249${String(i).padStart(6, '0')}`.replace(/00$/, '11'));
  const poor = await call('POST', '/customer/sms/send', {
    token,
    headers: { 'Idempotency-Key': 'send-too-big-01' },
    body: { senderId: 'ALICEBAKE', message: 'x', recipients: many },
  });
  assert.equal(poor.status, 402);
});

await step('history list, detail, stats, and tenant isolation', async () => {
  const list = await call('GET', '/customer/sms/batches?status=partial', { token });
  assert.ok(list.body.batches.some((b: any) => b.id === batchId));
  const detail = await call('GET', `/customer/sms/batches/${encodeURIComponent(batchId)}`, { token });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.records.length, 4);
  const failed = detail.body.records.find((x: any) => x.status === 'failed');
  assert.equal(failed.recipient, '233201234500');
  assert.equal(failed.unitsReleased, 1);
  const stats = await call('GET', '/customer/sms/stats?days=7', { token });
  assert.equal(stats.body.current.messages >= 4, true);
  assert.equal(stats.body.current.failed >= 1, true);
  assert.equal(stats.body.series.length, 8);
  assert.equal(stats.body.topSenderIds[0].senderId, 'ALICEBAKE');
});

await step('wallet summary view hides per-recipient confirms; type filter works', async () => {
  const t = await call('GET', '/customer/wallet/transactions?view=summary&limit=50', { token });
  const types = t.body.transactions.map((x: any) => x.type);
  assert.ok(types.includes('reserve'));
  assert.ok(types.includes('release'));
  assert.ok(!types.includes('confirm'));
  const only = await call('GET', '/customer/wallet/transactions?view=summary&types=purchase,manual_credit', { token });
  assert.ok(only.body.transactions.every((x: any) => x.type === 'purchase' || x.type === 'manual_credit'));
  assert.equal(only.body.transactions.length, 2);
});

await step('low-balance alert fires on the crossing only', async () => {
  const w = (await call('GET', '/customer/wallet', { token })).body.availableUnits;
  const set = await call('PUT', '/customer/wallet/threshold', { token, body: { threshold: w - 1 } });
  assert.equal(set.status, 200);
  const send = async (key: string) =>
    call('POST', '/customer/sms/send', {
      token,
      headers: { 'Idempotency-Key': key },
      body: { senderId: 'ALICEBAKE', message: 'ping', recipients: ['0557778888', '0557778899'] },
    });
  assert.equal((await send('send-low-bal-01')).status, 201);
  assert.equal((await send('send-low-bal-02')).status, 201);
  const alerts = cloud.list('notifications').filter((n) => n.data.type === 'low_balance');
  assert.equal(alerts.length, 1);
  assert.ok(cloud.emails.some((e) => e.subject === 'Your wallet balance is low'));
});

// ---------- API keys ----------

await step('self-service API key works on /v1 and revocation is immediate', async () => {
  const k = await call('POST', '/customer/api-keys', { token, body: { name: 'Server' } });
  assert.equal(k.status, 201);
  const plaintext: string = k.body.apiKey.plaintext;
  assert.match(plaintext, /^pk_live_/);
  const me = await call('GET', '/v1/me', { token: plaintext });
  assert.equal(me.status, 200);
  assert.equal(me.body.projectId, projectId);
  const listed = await call('GET', '/customer/api-keys', { token });
  assert.doesNotMatch(JSON.stringify(listed.body), /keyHash|plaintext/);
  const rev = await call('POST', `/customer/api-keys/${k.body.apiKey.id}/revoke`, { token });
  assert.equal(rev.body.apiKey.status, 'revoked');
  assert.equal((await call('GET', '/v1/me', { token: plaintext })).status, 401);
});

// ---------- notifications ----------

await step('notifications: unread count, mark one, mark all', async () => {
  const n = await call('GET', '/customer/notifications?limit=50', { token });
  assert.ok(n.body.unreadCount > 0);
  const first = n.body.notifications[0];
  assert.equal((await call('POST', `/customer/notifications/${first.id}/read`, { token })).status, 200);
  const after = await call('GET', '/customer/notifications', { token });
  assert.equal(after.body.unreadCount, n.body.unreadCount - 1);
  await call('POST', '/customer/notifications/read-all', { token });
  assert.equal((await call('GET', '/customer/notifications', { token })).body.unreadCount, 0);
});

// ---------- tenant isolation ----------

await step('a second customer cannot see the first customer’s data', async () => {
  const bob = await signUp('uid-bob', 'bob@example.com', 'Bob Garage');
  const paths = [
    `/customer/sms/batches/${encodeURIComponent(batchId)}`,
    `/customer/payments/${reference}`,
  ];
  for (const p of paths) assert.equal((await call('GET', p, { token: bob })).status, 404, p);
  assert.equal((await call('PUT', `/customer/contacts/${kofiId}`, { token: bob, body: { name: 'Hacked' } })).status, 404);
  assert.equal((await call('DELETE', `/customer/contact-groups/${groupId}`, { token: bob })).status, 404);
  assert.equal((await call('GET', '/customer/contacts', { token: bob })).body.total, 0);
  assert.equal((await call('GET', '/customer/sms/batches', { token: bob })).body.batches.length, 0);
  const send = await call('POST', '/customer/sms/send', {
    token: bob,
    headers: { 'Idempotency-Key': 'send-batch-0001' }, // same key as Alice
    body: { senderId: 'ALICEBAKE', message: 'x', groupIds: [groupId] },
  });
  assert.equal(send.status, 400, 'group of another tenant must resolve to nothing');
});

await step('deleting a group keeps its contacts', async () => {
  assert.equal((await call('DELETE', `/customer/contact-groups/${groupId}`, { token })).status, 200);
  const c = await call('GET', '/customer/contacts', { token });
  assert.equal(c.body.total, 3);
  assert.ok(c.body.contacts.every((x: any) => x.groupIds.length === 0));
});

console.log(`\n${passed} checks passed.\n`);
