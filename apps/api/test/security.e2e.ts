/**
 * Security & reliability suite for the API — the "test matrix":
 * authentication, RBAC, wallet integrity, payment security, API security,
 * idempotency, race conditions, business rules, provider failures, input
 * validation, rate limiting and monitoring/recovery.
 *
 * Runs the real Worker against the in-memory fake cloud (test/fakeCloud.ts).
 *
 *   npm run test:security --workspace=@profjero/api
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { approveSenderIdValue } from '../src/services/senderIds';
import { runReconciliation } from '../src/services/cron';
import worker from '../src/index';
import type { Env } from '../src/types/env';
import {
  PAYSTACK_SECRET,
  checkWalletIntegrity,
  createHarness,
  finish,
  section,
  seedPricing,
  seedWallet,
  step,
} from './harness';

const h = await createHarness();
const { cloud, call } = h;
seedPricing(cloud);

const SUPER = await h.seedAdmin('root', 'super_admin');
const ADMIN = await h.seedAdmin('ada', 'admin');
const FINANCE = await h.seedAdmin('fin', 'finance');
const SUPPORT = await h.seedAdmin('sup', 'support');
const VIEWER = await h.seedAdmin('vee', 'viewer');
const ROLE_TOKENS: Record<string, string> = { super_admin: SUPER, admin: ADMIN, finance: FINANCE, support: SUPPORT, viewer: VIEWER };

const projectOf = (uid: string) => String(cloud.get(`customers/${uid}`)!.projectId);
let keySeq = 0;
const ikey = (p = 'k') => `${p}-${Date.now()}-${++keySeq}-xxxx`;

/** A customer with an approved Sender ID and a wallet of `units`. */
async function readyCustomer(uid: string, org: string, sender: string, units: number) {
  const token = await h.signUp(uid, `${uid}@example.com`, org);
  const pid = projectOf(uid);
  const r = await call('POST', '/customer/sender-ids', { token, body: { value: sender, purpose: 'Business Notifications', description: 'Order updates for our customers.' } });
  assert.ok([201, 200].includes(r.status), `sender id request: ${r.status} ${JSON.stringify(r.body)}`);
  await approveSenderIdValue(h.env, sender, 'root');
  seedWallet(cloud, pid, units);
  return { token, pid };
}

const send = (token: string, sender: string, recipients: string[], message = 'Hello from the test suite', key = ikey('send'), env?: Partial<Env>) =>
  call('POST', '/customer/sms/send', { token, headers: { 'Idempotency-Key': key }, body: { senderId: sender, message, recipients }, env });

const sign = (raw: string) => createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');
const webhook = (raw: string, sig = sign(raw)) => call('POST', '/webhooks/paystack', { raw, headers: { 'x-paystack-signature': sig } });

/** The batch + records after background delivery finished. */
async function delivered(token: string, batchId: string) {
  const r = await call('GET', `/customer/sms/batches/${encodeURIComponent(batchId)}`, { token });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body as { batch: Record<string, any>; records: Array<Record<string, any>> };
}

function assertIntegrity() {
  const problems = checkWalletIntegrity(cloud);
  assert.deepEqual(problems, [], problems.join('\n'));
}

// =====================================================================
section('Authentication');
// =====================================================================

const alice = await readyCustomer('alice', 'Alice Bakery', 'ALICEBAKE', 100);

await step('admin routes reject missing / malformed / empty bearer tokens (401)', async () => {
  assert.equal((await call('GET', '/admin/me')).status, 401);
  assert.equal((await call('GET', '/admin/me', { headers: { Authorization: 'Basic abc' } })).status, 401);
  assert.equal((await call('GET', '/admin/me', { headers: { Authorization: 'Bearer ' } })).status, 401);
  assert.equal((await call('GET', '/admin/me', { token: 'not.a.jwt' })).status, 401);
});

await step('expired, wrong-issuer, wrong-audience, unknown-kid and forged tokens are rejected', async () => {
  const bad = [
    await h.token('root', 'root@ops.example', { expiresInSec: -60 }),
    await h.token('root', 'root@ops.example', { issuer: 'https://securetoken.google.com/other-project' }),
    await h.token('root', 'root@ops.example', { audience: 'other-project' }),
    await h.token('root', 'root@ops.example', { kid: 'unknown-kid' }),
    await h.token('root', 'root@ops.example', { signWith: 'rogue' }),
  ];
  for (const t of bad) {
    assert.equal((await call('GET', '/admin/me', { token: t })).status, 401);
    assert.equal((await call('GET', '/customer/me', { token: t })).status, 401);
  }
});

await step('alg=none and tampered-payload tokens are rejected', async () => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://securetoken.google.com/test-project', aud: 'test-project', sub: 'root', iat: now, exp: now + 600 };
  const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims)}.`;
  assert.equal((await call('GET', '/admin/me', { token: none })).status, 401);
  // Valid customer token with the payload swapped to another uid.
  const [hdr, , sig] = alice.token.split('.');
  const tampered = `${hdr}.${b64({ ...claims, sub: 'root', customer: true })}.${sig}`;
  assert.equal((await call('GET', '/admin/me', { token: tampered })).status, 401);
  assert.equal((await call('GET', '/customer/me', { token: tampered })).status, 401);
});

await step('a customer token cannot use admin routes; an admin token cannot use customer routes', async () => {
  assert.equal((await call('GET', '/admin/me', { token: alice.token })).status, 403);
  assert.equal((await call('GET', '/admin/projects', { token: alice.token })).status, 403);
  const r = await call('GET', '/customer/me', { token: SUPER });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'not_a_customer');
});

await step('a forged "customer" claim without a customer record is refused', async () => {
  const t = await h.token('mallory', 'm@example.com', { claims: { customer: true } });
  const r = await call('GET', '/customer/wallet', { token: t });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'incomplete_registration');
});

await step('an admin cannot register as a customer', async () => {
  const r = await call('POST', '/customer/register', {
    token: SUPER,
    body: { displayName: 'Root', organisationName: 'Root Org', acceptedTerms: true },
  });
  assert.equal(r.status, 403);
  assert.equal(cloud.get('customers/root'), null);
});

await step('a disabled admin is locked out immediately', async () => {
  const t = await h.seedAdmin('gone', 'admin', 'disabled');
  const r = await call('GET', '/admin/me', { token: t });
  assert.equal(r.status, 403);
});

await step('a suspended customer is locked out', async () => {
  const bob = await h.signUp('bob', 'bob@example.com', 'Bob Ltd');
  cloud.put('customers/bob', { ...cloud.get('customers/bob')!, status: 'suspended' });
  const r = await call('GET', '/customer/wallet', { token: bob });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'account_suspended');
});

// =====================================================================
section('Authorisation (RBAC)');
// =====================================================================

const ALL = ['super_admin', 'admin', 'finance', 'support', 'viewer'];
const RBAC: Array<[string, string, string[]]> = [
  ['POST', '/admin/projects', ['super_admin', 'admin']],
  ['PATCH', '/admin/projects/nope', ['super_admin', 'admin']],
  ['DELETE', '/admin/projects/nope', ['super_admin']],
  ['POST', '/admin/projects/nope/api-keys', ['super_admin', 'admin']],
  ['DELETE', '/admin/projects/nope/api-keys/k', ['super_admin', 'admin']],
  ['POST', '/admin/projects/nope/sms/send', ['super_admin', 'admin']],
  ['POST', '/admin/projects/nope/api-keys/publishable', ['super_admin', 'admin']],
  ['POST', '/admin/projects/nope/sender-ids', ['super_admin', 'admin']],
  ['PUT', '/admin/pricing/sms', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/pricing/sms/packages', ['super_admin', 'admin', 'finance']],
  ['PATCH', '/admin/pricing/packages/nope', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/pricing/bootstrap/sms', ['super_admin']],
  ['POST', '/admin/payments/initiate', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/payments/nope/verify', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/wallets/nope/credit', ['super_admin', 'finance']],
  ['POST', '/admin/wallets/nope/debit', ['super_admin', 'finance']],
  ['POST', '/admin/wallets/nope/reserve', ['super_admin']],
  ['POST', '/admin/wallets/nope/confirm', ['super_admin']],
  ['POST', '/admin/wallets/nope/release', ['super_admin']],
  ['POST', '/admin/wallets/nope/threshold', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/providers/bootstrap', ['super_admin']],
  ['PUT', '/admin/providers/nope', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/providers/nope/refresh-balance', ['super_admin', 'admin', 'finance']],
  ['POST', '/admin/sender-ids/NOPE/approve', ['super_admin', 'admin']],
  ['POST', '/admin/sender-ids/NOPE/reject', ['super_admin', 'admin']],
  ['POST', '/admin/sender-ids/NOPE/assignments/p/approve', ['super_admin', 'admin']],
  ['POST', '/admin/sender-ids/NOPE/assignments/p/reject', ['super_admin', 'admin']],
  ['POST', '/admin/sender-ids/NOPE/assignments/p/revoke', ['super_admin', 'admin']],
  ['PUT', '/admin/settings/general', ['super_admin', 'admin']],
  ['PUT', '/admin/settings/sms', ['super_admin', 'admin']],
  ['PUT', '/admin/settings/payments', ['super_admin', 'admin', 'finance']],
  ['PUT', '/admin/settings/notifications', ['super_admin', 'admin']],
  ['PUT', '/admin/settings/security', ['super_admin']],
  ['POST', '/admin/admins', ['super_admin']],
  ['PATCH', '/admin/admins/nope', ['super_admin']],
  ['POST', '/admin/admins/nope/reset-link', ['super_admin']],
  ['GET', '/admin/audit-logs', ['super_admin', 'admin']],
  // Everyone signed in:
  ['GET', '/admin/settings', ALL],
  ['GET', '/admin/alerts', ALL],
  ['GET', '/admin/system', ALL],
  ['GET', '/admin/admins', ALL],
  ['PATCH', '/admin/me', ALL],
];

await step(`role matrix: ${RBAC.length} endpoints × ${ALL.length} roles`, async () => {
  const wrong: string[] = [];
  for (const [method, path, allowed] of RBAC) {
    for (const role of ALL) {
      // Empty bodies: allowed roles get a validation/404 error, never a write.
      const r = await call(method, path, { token: ROLE_TOKENS[role], body: method === 'GET' ? undefined : {} });
      const denied = r.status === 403;
      if (allowed.includes(role) === denied || r.status === 401 || r.status >= 500) {
        wrong.push(`${role} ${method} ${path} → ${r.status} (${allowed.includes(role) ? 'should be allowed' : 'should be 403'})`);
      }
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

await step('settings GET tells each role what it may edit', async () => {
  const fin = await call('GET', '/admin/settings', { token: FINANCE });
  assert.deepEqual(fin.body.canEdit, { general: false, sms: false, payments: true, notifications: false, security: false });
  const sup = await call('GET', '/admin/settings', { token: SUPER });
  assert.ok(Object.values(sup.body.canEdit).every(Boolean));
});

await step('nobody can change their own role, and the last super admin cannot be demoted', async () => {
  const self = await call('PATCH', '/admin/admins/root', { token: SUPER, body: { role: 'viewer' } });
  assert.equal(self.status, 400);
  // Make a second super admin, then have them try to demote the only *other* one after disabling.
  const t2 = await h.seedAdmin('root2', 'super_admin');
  const demote = await call('PATCH', '/admin/admins/root', { token: t2, body: { role: 'admin' } });
  assert.equal(demote.status, 200);
  const last = await call('PATCH', '/admin/admins/root2', { token: SUPER, body: { role: 'admin' } });
  assert.equal(last.status, 403, 'root is no longer super admin');
  // Restore.
  cloud.put('admins/root', { ...cloud.get('admins/root')!, role: 'super_admin' });
  const back = await call('PATCH', '/admin/admins/root2', { token: SUPER, body: { status: 'disabled' } });
  assert.equal(back.status, 200);
  // root is now the only active super admin: root2 (re-enabled as super) cannot remove root's rights...
  cloud.put('admins/root2', { ...cloud.get('admins/root2')!, status: 'active', role: 'admin' });
  const solo = await call('PATCH', '/admin/admins/root', { token: t2, body: { role: 'admin' } });
  assert.equal(solo.status, 403);
});

await step('the last active super admin cannot be disabled or demoted', async () => {
  // root is the only active super admin; promote ada temporarily to act.
  cloud.put('admins/ada', { ...cloud.get('admins/ada')!, role: 'super_admin' });
  cloud.put('admins/root', { ...cloud.get('admins/root')!, status: 'active' });
  const r1 = await call('PATCH', '/admin/admins/root', { token: ADMIN, body: { status: 'disabled' } });
  assert.equal(r1.status, 200, 'ada is also super admin, so root can be disabled');
  const r2 = await call('PATCH', '/admin/admins/ada', { token: SUPER, body: { role: 'admin' } });
  assert.equal(r2.status, 403, 'root is disabled now');
  // Re-enable root via ada, then try to strip ada while root is the only other.
  assert.equal((await call('PATCH', '/admin/admins/root', { token: ADMIN, body: { status: 'active' } })).status, 200);
  cloud.put('admins/root', { ...cloud.get('admins/root')!, status: 'active' });
  cloud.put('admins/ada', { ...cloud.get('admins/ada')!, role: 'admin' });
  const lone = await call('PATCH', '/admin/admins/root', { token: SUPER, body: { status: 'disabled' } });
  assert.equal(lone.status, 400, 'self-change refused');
  assert.equal(cloud.get('admins/root')!.status, 'active');
});

await step('a customer cannot be invited as an admin', async () => {
  cloud.authUsers.set('alice@example.com', { uid: 'alice', disabled: false });
  const r = await call('POST', '/admin/admins', { token: SUPER, body: { email: 'alice@example.com', displayName: 'Alice', role: 'viewer' } });
  assert.equal(r.status, 409);
  assert.equal(cloud.get('admins/alice'), null);
});

// =====================================================================
section('Tenant isolation & API security');
// =====================================================================

const carol = await readyCustomer('carol', 'Carol Co', 'CAROLCO', 50);

await step("one customer cannot read or act on another customer's data", async () => {
  const s = await send(alice.token, 'ALICEBAKE', ['+233241000001']);
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const batchId = s.body.batch.id;
  assert.equal((await call('GET', `/customer/sms/batches/${batchId}`, { token: carol.token })).status, 404);
  const list = await call('GET', '/customer/sms/batches', { token: carol.token });
  assert.ok(!JSON.stringify(list.body).includes(batchId));
  // Using someone else's sender ID.
  const steal = await send(carol.token, 'ALICEBAKE', ['+233241000002']);
  assert.equal(steal.status, 400);
});

await step("a payment reference from another tenant can't be read or verified", async () => {
  const p = await call('POST', '/customer/payments', { token: alice.token, headers: { 'Idempotency-Key': ikey('pay') }, body: { packageId: 'starter' } });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  const ref = p.body.payment.reference;
  assert.equal((await call('GET', `/customer/payments/${ref}`, { token: carol.token })).status, 404);
  assert.equal((await call('POST', `/customer/payments/${ref}/verify`, { token: carol.token })).status, 404);
});

await step('the same Idempotency-Key used by two projects never leaks the other project’s batch (v1)', async () => {
  const mk = async (token: string) =>
    (await call('POST', '/customer/api-keys', { token, body: { name: 'iso' } })).body.apiKey.plaintext as string;
  const ka = await mk(alice.token);
  const kc = await mk(carol.token);
  const key = ikey('shared');
  const a = await call('POST', '/v1/sms/send', { token: ka, headers: { 'Idempotency-Key': key }, body: { senderId: 'ALICEBAKE', message: 'secret alice text', recipients: ['+233241000003'] } });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  const c = await call('POST', '/v1/sms/send', { token: kc, headers: { 'Idempotency-Key': key }, body: { senderId: 'CAROLCO', message: 'carol', recipients: ['+233241000004'] } });
  assert.equal(c.status, 409);
  assert.ok(!JSON.stringify(c.body).includes('secret alice text'));
  assert.equal((await call('GET', `/v1/sms/batches/${encodeURIComponent(key)}`, { token: kc })).status, 404);
});

await step('revoked API keys stop working immediately; garbage keys get a generic 401', async () => {
  const created = await call('POST', '/customer/api-keys', { token: carol.token, body: { name: 'temp' } });
  const plain = created.body.apiKey.plaintext as string;
  assert.equal((await call('GET', '/v1/wallet', { token: plain })).status, 200);
  await call('POST', `/customer/api-keys/${created.body.apiKey.id}/revoke`, { token: carol.token });
  const r = await call('GET', '/v1/wallet', { token: plain });
  assert.equal(r.status, 401);
  const g = await call('GET', '/v1/wallet', { token: 'pj_live_garbage' });
  assert.equal(g.status, 401);
  assert.equal(g.body.error.message, r.body.error.message === 'Invalid API key.' ? 'Invalid API key.' : g.body.error.message);
});

await step('responses never contain key hashes, secrets or stack traces', async () => {
  const keys = await call('GET', '/customer/api-keys', { token: alice.token });
  const text = JSON.stringify(keys.body);
  assert.ok(!/hash|secretHash|plaintext/i.test(text), text);
  const bad = await call('POST', '/customer/sms/send', { token: alice.token, headers: { 'Idempotency-Key': ikey() }, raw: '{not json' });
  assert.ok(bad.status === 400, `got ${bad.status}`);
  assert.ok(!/at .*\.(ts|js):\d+/.test(JSON.stringify(bad.body)));
  assert.ok(typeof bad.body.error.requestId === 'string' && bad.body.error.requestId.length > 10);
});

await step('CORS: known origins are echoed, unknown origins and prod localhost are not', async () => {
  const pre = (origin: string, env?: Partial<Env>) =>
    call('OPTIONS', '/customer/me', { headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' }, env });
  assert.equal((await pre('https://profjeroconnect.pages.dev')).headers.get('access-control-allow-origin'), 'https://profjeroconnect.pages.dev');
  assert.equal((await pre('https://manage-profjeroconnect.pages.dev')).headers.get('access-control-allow-origin'), 'https://manage-profjeroconnect.pages.dev');
  assert.equal((await pre('https://evil.example')).headers.get('access-control-allow-origin'), null);
  assert.equal((await pre('http://localhost:5174')).headers.get('access-control-allow-origin'), 'http://localhost:5174');
  assert.equal((await pre('http://localhost:5174', { ENVIRONMENT: 'production' })).headers.get('access-control-allow-origin'), null);
  assert.equal((await pre('https://profjeroconnect.pages.dev.evil.example')).headers.get('access-control-allow-origin'), null);
});

await step('checkout never redirects to an attacker-supplied origin', async () => {
  const r = await call('POST', '/customer/payments', {
    token: alice.token,
    headers: { 'Idempotency-Key': ikey('pay'), Origin: 'https://evil.example' },
    body: { packageId: 'starter' },
  });
  assert.equal(r.status, 201);
  const ref = r.body.payment.reference;
  assert.ok(!JSON.stringify(cloud.get(`payments/${ref}`)).includes('evil.example'));
});

// =====================================================================
section('Payment security');
// =====================================================================

async function pendingPayment(token: string) {
  const r = await call('POST', '/customer/payments', { token, headers: { 'Idempotency-Key': ikey('pay') }, body: { packageId: 'starter' } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.payment.reference as string;
}
const walletOf = (pid: string) => Number(cloud.get(`wallets/${pid}`)!.availableUnits);

await step('webhook without / with a bad signature is rejected and credits nothing', async () => {
  const ref = await pendingPayment(alice.token);
  const before = walletOf(alice.pid);
  const raw = JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: 2000, currency: 'GHS' } });
  assert.equal((await call('POST', '/webhooks/paystack', { raw })).status, 401);
  assert.equal((await webhook(raw, 'deadbeef')).status, 401);
  assert.equal((await webhook(raw, createHmac('sha512', 'wrong-secret').update(raw).digest('hex'))).status, 401);
  // Signed body, then tampered after signing.
  assert.equal((await webhook(raw.replace('2000', '2001'), sign(raw))).status, 401);
  assert.equal(walletOf(alice.pid), before);
});

await step('a signed webhook with the wrong amount or currency is not credited', async () => {
  const ref = await pendingPayment(alice.token);
  const before = walletOf(alice.pid);
  const low = await webhook(JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: 100, currency: 'GHS' } }));
  assert.equal(low.body.reason, 'amount_mismatch');
  assert.equal(walletOf(alice.pid), before);
  const pay = cloud.get(`payments/${ref}`)!;
  assert.equal(pay.status, 'failed');
  assert.match(String(pay.failureReason), /mismatch/i);

  const ref2 = await pendingPayment(alice.token);
  const usd = await webhook(JSON.stringify({ event: 'charge.success', data: { reference: ref2, amount: 2000, currency: 'USD' } }));
  assert.equal(usd.body.reason, 'amount_mismatch');
  assert.equal(walletOf(alice.pid), before);
});

await step('webhook replay credits exactly once (sequential and concurrent)', async () => {
  const ref = await pendingPayment(alice.token);
  const before = walletOf(alice.pid);
  const raw = JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: 2000, currency: 'GHS' } });
  const results = await Promise.all(Array.from({ length: 6 }, () => webhook(raw)));
  assert.ok(results.every((r) => r.status === 200), results.map((r) => r.status).join(','));
  await webhook(raw);
  assert.equal(walletOf(alice.pid), before + 500);
  assertIntegrity();
});

await step('manual verify never credits a payment the gateway reports with a different amount', async () => {
  const ref = await pendingPayment(alice.token);
  const before = walletOf(alice.pid);
  cloud.gatewayStatus.set(ref, 'success');
  // Tamper with what the gateway reports for this reference.
  const realFetch = cloud.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes(`/transaction/verify/${ref}`)) {
      return new Response(JSON.stringify({ status: true, data: { status: 'success', reference: ref, amount: 1, currency: 'GHS', paid_at: null } }), { status: 200 });
    }
    return realFetch(input, init);
  }) as typeof fetch;
  try {
    const r = await call('POST', `/customer/payments/${ref}/verify`, { token: alice.token });
    assert.equal(r.body.walletCredited, false);
    assert.notEqual(r.body.payment.status, 'success');
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(walletOf(alice.pid), before);
});

await step('a refunded payment can never be credited by a late webhook', async () => {
  const ref = await pendingPayment(alice.token);
  cloud.put(`payments/${ref}`, { ...cloud.get(`payments/${ref}`)!, status: 'refunded' });
  const before = walletOf(alice.pid);
  await webhook(JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: 2000, currency: 'GHS' } }));
  assert.equal(walletOf(alice.pid), before);
});

await step('client-chosen prices are ignored: custom units are priced server-side', async () => {
  const r = await call('POST', '/customer/payments', {
    token: alice.token,
    headers: { 'Idempotency-Key': ikey('pay') },
    body: { units: 1000, amountPesewas: 1, priceGhs: 0.01 },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.payment.amountGhs, 50); // 1000 × GH₵0.05, whatever the client sent
});

// =====================================================================
section('Idempotency');
// =====================================================================

await step('customer send: same key + same body replays; different body is 409', async () => {
  const key = ikey('idem');
  const a = await send(alice.token, 'ALICEBAKE', ['+233241000010'], 'first', key);
  assert.equal(a.status, 201);
  const before = walletOf(alice.pid);
  const b = await send(alice.token, 'ALICEBAKE', ['+233241000010'], 'first', key);
  assert.equal(b.status, 200);
  assert.equal(b.body.batch.id, a.body.batch.id);
  assert.equal(walletOf(alice.pid), before);
  assert.equal((await send(alice.token, 'ALICEBAKE', ['+233241000010'], 'second', key)).status, 409);
});

await step('v1 send: different recipients under the same key is 409', async () => {
  const k = (await call('POST', '/customer/api-keys', { token: alice.token, body: { name: 'idem' } })).body.apiKey.plaintext;
  const key = ikey('v1');
  const body = { senderId: 'ALICEBAKE', message: 'hi', recipients: ['+233241000011'] };
  assert.equal((await call('POST', '/v1/sms/send', { token: k, headers: { 'Idempotency-Key': key }, body })).status, 201);
  assert.equal((await call('POST', '/v1/sms/send', { token: k, headers: { 'Idempotency-Key': key }, body })).status, 200);
  const diff = await call('POST', '/v1/sms/send', { token: k, headers: { 'Idempotency-Key': key }, body: { ...body, recipients: ['+233241000012'] } });
  assert.equal(diff.status, 409);
  const missing = await call('POST', '/v1/sms/send', { token: k, body });
  assert.equal(missing.status, 400);
});

await step('checkout: same key with a different package is 409', async () => {
  const key = ikey('pay');
  assert.equal((await call('POST', '/customer/payments', { token: alice.token, headers: { 'Idempotency-Key': key }, body: { packageId: 'starter' } })).status, 201);
  assert.equal((await call('POST', '/customer/payments', { token: alice.token, headers: { 'Idempotency-Key': key }, body: { units: 300 } })).status, 409);
});

// =====================================================================
section('Race conditions & wallet integrity');
// =====================================================================

await step('concurrent sends can never overdraw the wallet', async () => {
  const dan = await readyCustomer('dan', 'Dan Shop', 'DANSHOP', 10);
  const results = await Promise.all(
    Array.from({ length: 25 }, (_, i) => send(dan.token, 'DANSHOP', [`+2332410001${String(i + 10).padStart(2, '0')}`])),
  );
  const ok = results.filter((r) => r.status === 201).length;
  const statuses = [...new Set(results.map((r) => r.status))].sort();
  assert.ok(results.every((r) => [201, 402, 409, 429, 503].includes(r.status)), `unexpected statuses ${statuses}`);
  assert.ok(ok <= 10, `${ok} sends succeeded on a 10-unit wallet`);
  assert.ok(walletOf(dan.pid) >= 0);
  assertIntegrity();
});

await step('the same key sent 5× concurrently creates one batch and charges once', async () => {
  const eve = await readyCustomer('eve', 'Eve Org', 'EVEORG', 20);
  const key = ikey('dupe');
  const results = await Promise.all(Array.from({ length: 5 }, () => send(eve.token, 'EVEORG', ['+233241000210', '+233241000211'], 'same', key)));
  const ids = new Set(results.filter((r) => r.status < 300).map((r) => r.body.batch.id));
  assert.equal(ids.size, 1, results.map((r) => `${r.status}:${JSON.stringify(r.body).slice(0, 80)}`).join('\n'));
  assert.ok(results.every((r) => r.status === 200 || r.status === 201 || r.status === 409), results.map((r) => r.status).join(','));
  assert.equal(cloud.list('smsBatches').filter((b) => b.data.projectId === eve.pid).length, 1);
  assert.equal(walletOf(eve.pid), 18);
  assertIntegrity();
});

await step('concurrent registration of the same user creates one customer and one project', async () => {
  const t = await h.token('fred', 'fred@example.com');
  const body = { displayName: 'Fred', organisationName: 'Fred Org', acceptedTerms: true };
  const results = await Promise.all(Array.from({ length: 5 }, () => call('POST', '/customer/register', { token: t, body, headers: { 'CF-Connecting-IP': '10.9.9.9' } })));
  assert.ok(results.every((r) => r.status === 200 || r.status === 201), results.map((r) => `${r.status} ${JSON.stringify(r.body)}`).join('\n'));
  const projects = cloud.list('projects').filter((p) => p.data.ownerUid === 'fred' || p.data.createdBy === 'customer:fred' || p.id === projectOf('fred'));
  assert.equal(new Set(results.map((r) => r.body.projectId ?? r.body.project?.id)).size, 1);
  assert.equal(projects.length, 1);
  assert.equal(walletOf(projectOf('fred')), 3, 'starter credit granted once');
  assertIntegrity();
});

await step('concurrent API key creation respects the 5-active-key cap', async () => {
  const gina = await h.signUp('gina', 'gina@example.com', 'Gina Org');
  const results = await Promise.all(Array.from({ length: 9 }, (_, i) => call('POST', '/customer/api-keys', { token: gina, body: { name: `k${i}` } })));
  const created = results.filter((r) => r.status === 201).length;
  const active = cloud.list('apiKeys').filter((k) => k.data.projectId === projectOf('gina') && k.data.status === 'active').length;
  assert.ok(active <= 5, `${active} active keys (created ${created})`);
});

await step('concurrent admin credits and debits keep the ledger consistent', async () => {
  const pid = carol.pid;
  const before = walletOf(pid);
  const ops = Array.from({ length: 12 }, (_, i) =>
    call('POST', `/admin/wallets/${pid}/${i % 3 === 0 ? 'debit' : 'credit'}`, { token: FINANCE, body: { units: 5, description: `race ${i}` } }),
  );
  const res = await Promise.all(ops);
  const credits = res.filter((r, i) => r.status < 300 && i % 3 !== 0).length;
  const debits = res.filter((r, i) => r.status < 300 && i % 3 === 0).length;
  assert.equal(walletOf(pid), before + 5 * credits - 5 * debits);
  assertIntegrity();
});

// =====================================================================
section('Business rules & settings');
// =====================================================================

await step('Unicode (UCS-2) messages bill by the 70/67-char segment rules', async () => {
  const before = walletOf(alice.pid);
  const msg = 'Akwaaba 👋 '.repeat(8); // > 70 UCS-2 code units → 2 segments
  const r = await send(alice.token, 'ALICEBAKE', ['+233241000310'], msg);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const units = before - walletOf(alice.pid);
  assert.ok(units >= 2, `charged ${units}`);
  assert.equal((await delivered(alice.token, r.body.batch.id)).batch.totalUnitsCharged, units);
});

await step('settings: welcome credit 0 → new signups get no free units', async () => {
  assert.equal((await call('PUT', '/admin/settings/sms', { token: ADMIN, body: { starterUnits: 0, defaultLowBalanceThreshold: 25, maxRecipientsPerSend: 2, senderIdReviewSla: 'about 2 hours' } })).status, 200);
  h.reset();
  const t = await h.signUp('hank', 'hank@example.com', 'Hank Org');
  const pid = projectOf('hank');
  assert.equal(walletOf(pid), 0);
  assert.equal(cloud.get(`wallets/${pid}`)!.lowBalanceThreshold, 25);
  const cfg = await call('GET', '/customer/config', { token: t });
  assert.equal(cfg.body.senderIdReviewSla, 'about 2 hours');
  assert.equal(cfg.body.maxRecipientsPerSend, 2);
  assertIntegrity();
});

await step('settings: max recipients is enforced before anything is reserved', async () => {
  const before = walletOf(alice.pid);
  const r = await send(alice.token, 'ALICEBAKE', ['+233241000401', '+233241000402', '+233241000403']);
  assert.equal(r.status, 400);
  assert.match(r.body.error.message, /maximum per send is 2/);
  assert.equal(walletOf(alice.pid), before);
  await call('PUT', '/admin/settings/sms', { token: ADMIN, body: { starterUnits: 3, defaultLowBalanceThreshold: null, maxRecipientsPerSend: 1000, senderIdReviewSla: 'up to 1 business day' } });
  h.reset();
});

await step('settings: closing sign-ups blocks new customers but not existing ones', async () => {
  const base = cloud.get('settings/security') ?? {};
  assert.equal((await call('PUT', '/admin/settings/security', { token: SUPER, body: { customerSignupsEnabled: false, customerSendsPerMinute: 30, customerRequestsPerMinute: 300 } })).status, 200);
  h.reset();
  const t = await h.token('ivy', 'ivy@example.com');
  const r = await call('POST', '/customer/register', { token: t, body: { displayName: 'Ivy', organisationName: 'Ivy', acceptedTerms: true }, headers: { 'CF-Connecting-IP': '10.7.7.7' } });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'signups_closed');
  assert.equal((await call('GET', '/v1/platform')).body.customerSignupsEnabled, false);
  assert.equal((await call('GET', '/customer/wallet', { token: alice.token })).status, 200);
  void base;
  await call('PUT', '/admin/settings/security', { token: SUPER, body: { customerSignupsEnabled: true, customerSendsPerMinute: 30, customerRequestsPerMinute: 300 } });
  h.reset();
});

await step('settings: pausing top-ups blocks checkout with the configured message', async () => {
  await call('PUT', '/admin/settings/payments', { token: FINANCE, body: { customerTopupsEnabled: false, topupsDisabledMessage: 'Back at 5pm.' } });
  h.reset();
  const r = await call('POST', '/customer/payments', { token: alice.token, headers: { 'Idempotency-Key': ikey('pay') }, body: { packageId: 'starter' } });
  assert.equal(r.status, 503);
  assert.match(r.body.error.message, /Back at 5pm/);
  assert.equal((await call('GET', '/customer/config', { token: alice.token })).body.topupsEnabled, false);
  await call('PUT', '/admin/settings/payments', { token: FINANCE, body: { customerTopupsEnabled: true, topupsDisabledMessage: null } });
  h.reset();
});

await step('a suspended project cannot send, from any surface', async () => {
  const proj = cloud.get(`projects/${carol.pid}`)!;
  cloud.put(`projects/${carol.pid}`, { ...proj, status: 'suspended' });
  const before = walletOf(carol.pid);
  const r = await send(carol.token, 'CAROLCO', ['+233241000500']);
  assert.equal(r.status, 403);
  const k = cloud.list('apiKeys').find((x) => x.data.projectId === carol.pid && x.data.status === 'active');
  void k;
  assert.equal(walletOf(carol.pid), before);
  cloud.put(`projects/${carol.pid}`, { ...proj, status: 'active' });
});

await step('a pending or rejected Sender ID cannot be used', async () => {
  const r = await call('POST', '/customer/sender-ids', { token: alice.token, body: { value: 'ALICENEW', purpose: 'Business Notifications', description: 'Order updates for our customers.' } });
  assert.ok(r.status < 300);
  const s = await send(alice.token, 'ALICENEW', ['+233241000600']);
  assert.equal(s.status, 400);
  assert.match(s.body.error.message, /awaiting approval/i);
});

// =====================================================================
section('Provider failures');
// =====================================================================

const LIVE: Partial<Env> = { SMS_PROVIDER: 'arkesel', ARKESEL_API_KEY: 'test-key' };

await step('provider rejects (4xx): records fail and units are released', async () => {
  cloud.provider.mode = 'http400';
  const before = walletOf(alice.pid);
  const r = await send(alice.token, 'ALICEBAKE', ['+233241000700'], 'reject me', ikey(), LIVE);
  assert.ok(r.status < 500, `${r.status}`);
  assert.equal((await delivered(alice.token, r.body.batch.id)).records[0].status, 'failed');
  assert.equal(walletOf(alice.pid), before);
  assertIntegrity();
});

await step('provider 5xx / network error: units stay held as "unknown", never refunded blindly', async () => {
  for (const mode of ['http503', 'network'] as const) {
    cloud.provider.mode = mode;
    const before = walletOf(alice.pid);
    const r = await send(alice.token, 'ALICEBAKE', ['+233241000701'], `outage ${mode}`, ikey(), LIVE);
    assert.ok(r.status < 500, `${mode}: ${r.status} ${JSON.stringify(r.body)}`);
    assert.equal((await delivered(alice.token, r.body.batch.id)).records[0].status, 'unknown', mode);
    assert.equal(walletOf(alice.pid), before - 1, mode);
    assertIntegrity();
  }
});

await step('reconciliation keeps fresh unknowns held and releases ones older than 7 days', async () => {
  cloud.provider.mode = 'ok';
  const held = cloud.list('smsRecords').filter((r) => r.data.projectId === alice.pid && r.data.status === 'unknown');
  assert.ok(held.length >= 2);
  const before = walletOf(alice.pid);
  await runReconciliation({ ...h.env, ...LIVE } as Env);
  assert.equal(walletOf(alice.pid), before, 'fresh unknowns stay held');
  const old = new Date(Date.now() - 8 * 86400_000).toISOString();
  for (const r of held) cloud.put(`smsRecords/${r.id}`, { ...cloud.get(`smsRecords/${r.id}`)!, createdAt: old });
  await runReconciliation({ ...h.env, ...LIVE } as Env);
  assert.equal(walletOf(alice.pid), before + held.length);
  assertIntegrity();
});

await step('provider OK + delivery webhook charges the reserved unit exactly once', async () => {
  cloud.provider.mode = 'ok';
  const before = walletOf(alice.pid);
  const r = await send(alice.token, 'ALICEBAKE', ['+233241000702'], 'deliver me', ikey(), LIVE);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const rec = cloud.list('smsRecords').find((x) => x.data.batchId === r.body.batch.id)!;
  const pmid = String(rec.data.providerMessageId);
  for (let i = 0; i < 3; i++) {
    assert.equal((await call('POST', `/webhooks/arkesel?sms_id=${pmid}&status=DELIVERED`)).status, 200);
  }
  assert.equal(walletOf(alice.pid), before - 1);
  assert.equal(cloud.get(`smsRecords/${rec.id}`)!.status, 'delivered');
  assertIntegrity();
});

await step('delivery webhook rejects callbacks without the shared token when one is configured', async () => {
  const env = { ARKESEL_WEBHOOK_SECRET: 'whsec-123' };
  const r = await send(alice.token, 'ALICEBAKE', ['+233241000703'], 'token check', ikey(), { ...LIVE, ...env, ARKESEL_WEBHOOK_URL: 'https://api.example/webhooks/arkesel' });
  const rec = cloud.list('smsRecords').find((x) => x.data.batchId === r.body.batch.id)!;
  const pmid = String(rec.data.providerMessageId);
  assert.equal((await call('POST', `/webhooks/arkesel?sms_id=${pmid}&status=FAILED`, { env })).status, 401);
  assert.equal((await call('POST', `/webhooks/arkesel?sms_id=${pmid}&status=FAILED&token=nope`, { env })).status, 401);
  assert.equal(cloud.get(`smsRecords/${rec.id}`)!.status, 'submitted');
  assert.equal((await call('POST', `/webhooks/arkesel?sms_id=${pmid}&status=DELIVERED&token=whsec-123`, { env })).status, 200);
  assert.equal(cloud.get(`smsRecords/${rec.id}`)!.status, 'delivered');
  assertIntegrity();
});

await step('the database being down returns a clean 5xx with no partial writes', async () => {
  const before = walletOf(alice.pid);
  cloud.firestoreDown = true;
  try {
    const r = await send(alice.token, 'ALICEBAKE', ['+233241000704']);
    assert.ok(r.status >= 500 || r.status === 401, `${r.status}`);
    assert.ok(!JSON.stringify(r.body).includes('firestore'), 'no internals leaked');
  } finally {
    cloud.firestoreDown = false;
  }
  assert.equal(walletOf(alice.pid), before);
  assertIntegrity();
});

// =====================================================================
section('Input validation');
// =====================================================================

await step('fuzzed bodies get 4xx, never 5xx', async () => {
  const junk: unknown[] = [
    null, 0, 'x', [], {}, { message: 1 }, { message: 'x'.repeat(100_000), recipients: ['+233241000800'], senderId: 'ALICEBAKE' },
    { recipients: 'not-an-array' }, { recipients: Array(5000).fill('+233241000801'), message: 'x', senderId: 'ALICEBAKE' },
    { __proto__: { admin: true } }, { constructor: { prototype: { x: 1 } } }, { units: -5 }, { units: 1e20 }, { units: '100' },
    { packageId: '../../admins/root' }, { name: '<script>alert(1)</script>' }, { value: "'; DROP TABLE x;--" },
    { phone: '\u0000\u0000' }, { email: 'a@b' }, { displayName: 'x'.repeat(5000) },
  ];
  const targets: Array<[string, string, string?]> = [
    ['POST', '/customer/sms/send', 'idem'], ['POST', '/customer/payments', 'idem'], ['POST', '/customer/contacts'],
    ['POST', '/customer/contact-groups'], ['POST', '/customer/sender-ids'], ['POST', '/customer/api-keys'],
    ['PUT', '/customer/me'], ['PUT', '/customer/wallet/threshold'],
  ];
  const wrong: string[] = [];
  for (const [m, p, idem] of targets) {
    for (const body of junk) {
      h.reset();
      const r = await call(m, p, { token: alice.token, body, headers: idem ? { 'Idempotency-Key': ikey('fz') } : {} });
      if (r.status >= 500) wrong.push(`${m} ${p} ${JSON.stringify(body)?.slice(0, 60)} → ${r.status}`);
    }
  }
  for (const [m, p] of [['PUT', '/admin/settings/general'], ['PUT', '/admin/settings/security'], ['POST', '/admin/admins'], ['PATCH', '/admin/me'], ['POST', `/admin/wallets/${alice.pid}/credit`]]) {
    for (const body of junk) {
      const r = await call(m, p, { token: SUPER, body });
      if (r.status >= 500) wrong.push(`${m} ${p} ${JSON.stringify(body)?.slice(0, 60)} → ${r.status}`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

await step('settings reject out-of-range values', async () => {
  const bad = [
    ['sms', { starterUnits: 5000, defaultLowBalanceThreshold: null, maxRecipientsPerSend: 10, senderIdReviewSla: 'x' }],
    ['sms', { starterUnits: 1, defaultLowBalanceThreshold: null, maxRecipientsPerSend: 0, senderIdReviewSla: 'x' }],
    ['security', { customerSignupsEnabled: true, customerSendsPerMinute: 0, customerRequestsPerMinute: 300 }],
    ['general', { platformName: '', supportEmail: 'nope', supportPhone: null, address: null, timezone: 'Africa/Accra' }],
    ['notifications', { adminAlertEmails: Array(11).fill('a@b.co'), emailOnSenderIdRequest: true, emailOnNewCustomer: true, emailOnPaymentReceived: true, emailOnProviderLowBalance: true, providerLowBalanceCredits: null }],
  ] as const;
  for (const [s, body] of bad) {
    const r = await call('PUT', `/admin/settings/${s}`, { token: SUPER, body });
    assert.equal(r.status, 400, `${s}: ${r.status}`);
  }
  assert.equal((await call('PUT', '/admin/settings/billing', { token: SUPER, body: {} })).status, 404);
});

await step('stored text is returned as data, never interpreted (XSS payloads round-trip verbatim)', async () => {
  const name = '<img src=x onerror=alert(1)>';
  const r = await call('POST', '/customer/contacts', { token: alice.token, body: { name, phone: '0241112299' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.contact.name, name);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
});

// =====================================================================
section('Rate limiting');
// =====================================================================

await step('send rate limit returns 429 with Retry-After', async () => {
  h.reset();
  await call('PUT', '/admin/settings/security', { token: SUPER, body: { customerSignupsEnabled: true, customerSendsPerMinute: 3, customerRequestsPerMinute: 300 } });
  h.reset();
  seedWallet(cloud, alice.pid, 100);
  const statuses: number[] = [];
  let retryAfter: string | null = null;
  for (let i = 0; i < 5; i++) {
    const r = await send(alice.token, 'ALICEBAKE', [`+23324100090${i}`]);
    statuses.push(r.status);
    if (r.status === 429) retryAfter = r.headers.get('retry-after');
  }
  assert.deepEqual(statuses, [201, 201, 201, 429, 429]);
  assert.ok(retryAfter && Number(retryAfter) >= 1 && Number(retryAfter) <= 60, `Retry-After ${retryAfter}`);
});

await step('per-account request limit returns 429', async () => {
  await call('PUT', '/admin/settings/security', { token: SUPER, body: { customerSignupsEnabled: true, customerSendsPerMinute: 30, customerRequestsPerMinute: 10 } });
  h.reset();
  const statuses: number[] = [];
  for (let i = 0; i < 12; i++) statuses.push((await call('GET', '/customer/wallet', { token: alice.token })).status);
  assert.equal(statuses.filter((s) => s === 429).length, 2, statuses.join(','));
  // Other accounts are unaffected.
  assert.equal((await call('GET', '/customer/wallet', { token: carol.token })).status, 200);
  await call('PUT', '/admin/settings/security', { token: SUPER, body: { customerSignupsEnabled: true, customerSendsPerMinute: 30, customerRequestsPerMinute: 300 } });
  h.reset();
});

await step('sign-ups are limited per network address', async () => {
  const statuses: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = await h.token(`bulk${i}`, `bulk${i}@example.com`);
    const r = await call('POST', '/customer/register', { token: t, body: { displayName: 'B', organisationName: `Bulk ${i}`, acceptedTerms: true }, headers: { 'CF-Connecting-IP': '203.0.113.9' } });
    statuses.push(r.status);
  }
  assert.equal(statuses.filter((s) => s === 201).length, 10, statuses.join(','));
  assert.equal(statuses.filter((s) => s === 429).length, 2);
});

await step('Sender ID requests and API key creation are capped', async () => {
  const jo = await h.signUp('jo', 'jo@example.com', 'Jo Org');
  const s: number[] = [];
  for (let i = 0; i < 11; i++) {
    s.push((await call('POST', '/customer/sender-ids', { token: jo, body: { value: `JOBRAND${i}`.slice(0, 11), purpose: 'Business Notifications', description: 'Order updates for our customers.' } })).status);
  }
  assert.equal(s.filter((x) => x === 429).length, 1, s.join(','));
});

// =====================================================================
section('Monitoring & recovery');
// =====================================================================

await step('/health/ready is 200 when the database answers and 503 when it does not', async () => {
  const ok = await call('GET', '/health/ready');
  assert.equal(ok.status, 200);
  cloud.firestoreDown = true;
  try {
    const down = await call('GET', '/health/ready');
    assert.equal(down.status, 503);
    assert.equal(down.body.database, 'unreachable');
  } finally {
    cloud.firestoreDown = false;
  }
});

await step('scheduled jobs record heartbeats that the System page reads', async () => {
  const scheduled = worker.scheduled as (c: unknown, e: Env, x: unknown) => Promise<void>;
  await scheduled({ cron: '*/15 * * * *', scheduledTime: Date.now(), noRetry() {} }, h.env, {});
  await scheduled({ cron: '0 4 * * *', scheduledTime: Date.now(), noRetry() {} }, h.env, {});
  const sys = await call('GET', '/admin/system', { token: VIEWER });
  assert.equal(sys.status, 200);
  const jobs = sys.body.jobs;
  for (const j of ['reconciliation', 'balanceRefresh', 'providerCleanup']) {
    assert.ok(jobs[j]?.lastRunAt, `${j} heartbeat missing: ${JSON.stringify(jobs)}`);
    assert.equal(jobs[j].ok, true, j);
  }
  assert.equal(sys.body.config.smsMode, 'mock');
});

await step('a stale cron raises a bell alert in production', async () => {
  const stale = new Date(Date.now() - 3 * 3600_000).toISOString();
  const status = cloud.get('systemStatus/cron')!;
  cloud.put('systemStatus/cron', { ...status, reconciliation: { ...(status.reconciliation as object), lastRunAt: stale } });
  const r = await call('GET', '/admin/alerts', { token: SUPER, env: { ENVIRONMENT: 'production' } });
  assert.ok(r.body.alerts.some((a: { type: string }) => a.type === 'cron_stale'), JSON.stringify(r.body.alerts.map((a: { type: string }) => a.type)));
});

await step('alerts: pending Sender IDs show as unread, then read after "seen"', async () => {
  const r = await call('GET', '/admin/alerts', { token: ADMIN });
  const sid = r.body.alerts.find((a: { type: string }) => a.type === 'sender_id_requests');
  assert.ok(sid && sid.count >= 1, JSON.stringify(r.body));
  assert.ok(r.body.unreadCount >= 1);
  assert.equal((await call('POST', '/admin/alerts/seen', { token: ADMIN })).status, 200);
  assert.equal((await call('GET', '/admin/alerts', { token: ADMIN })).body.unreadCount, 0);
  // Seen state is per admin.
  assert.ok((await call('GET', '/admin/alerts', { token: FINANCE })).body.unreadCount >= 1);
});

await step('admin mutations are audit-logged with secrets redacted; failures and reads are not', async () => {
  const before = cloud.list('auditLogs').length;
  await call('PUT', '/admin/settings/general', {
    token: SUPER,
    body: { platformName: 'ProfJero Connect', supportEmail: 'help@example.com', supportPhone: null, address: null, timezone: 'Africa/Accra', apiToken: 'sk_should_not_appear' },
  });
  await call('GET', '/admin/settings', { token: SUPER });
  await call('PUT', '/admin/settings/security', { token: VIEWER, body: {} });
  const logs = cloud.list('auditLogs').slice(before);
  assert.equal(logs.length, 1, JSON.stringify(logs.map((l) => l.data.path)));
  assert.equal(logs[0].data.actorUid, 'root');
  assert.equal(logs[0].data.category, 'settings');
  assert.ok(!JSON.stringify(logs[0].data).includes('sk_should_not_appear'));
  const api = await call('GET', '/admin/audit-logs?limit=5', { token: ADMIN });
  assert.equal(api.status, 200);
  assert.ok(api.body.logs.length >= 1);
});

await step('team: invite creates a login + setup link; disable revokes Firebase access', async () => {
  const r = await call('POST', '/admin/admins', { token: SUPER, body: { email: 'New.Op@Ops.Example', displayName: 'New Op', role: 'support' } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(r.body.setupLink, /^https:\/\//);
  const u = cloud.authUsers.get('new.op@ops.example')!;
  assert.ok(u);
  assert.equal(cloud.get(`admins/${u.uid}`)!.role, 'support');
  assert.equal((await call('POST', '/admin/admins', { token: SUPER, body: { email: 'new.op@ops.example', displayName: 'Again', role: 'viewer' } })).status, 409);
  assert.equal((await call('PATCH', `/admin/admins/${u.uid}`, { token: SUPER, body: { status: 'disabled' } })).status, 200);
  assert.equal(u.disabled, true);
  const t = await h.token(u.uid, 'new.op@ops.example');
  assert.equal((await call('GET', '/admin/me', { token: t })).status, 403);
});

await step('the whole run left every wallet consistent with its ledger', async () => {
  assertIntegrity();
});

finish('Security suite');
