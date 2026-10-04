/**
 * Local API for browser (Playwright) tests: the real Worker running on the
 * in-memory fake cloud, on http://localhost:8787. No credentials, no
 * network. State lives in memory and resets when the process restarts.
 *
 *   npm run dev:fake --workspace=@profjero/api
 *
 * Seeded: SMS pricing + packages, the SMS provider record, two admins
 * (root@ops.example = super_admin, viewer@ops.example = viewer), and one
 * customer with a pending Sender ID request (so the admin bell has work).
 *
 * Test-only endpoints (this file only — never part of the deployed Worker):
 *   GET  /__test/token?uid=&email=   mint a Firebase-style ID token
 *   GET  /__test/approve?value=      approve a Sender ID
 *   GET  /__test/paid                gateway marks pending payments paid
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importPKCS8, SignJWT } from 'jose';
import worker from '../src/index';
import { approveSenderIdValue } from '../src/services/senderIds';
import type { Env } from '../src/types/env';
import { createFakeCloud } from './fakeCloud';

const PORT = Number(process.env.PORT ?? 8787);
const PROJECT = 'test-project';
const KID = 'test-kid';

const dir = mkdtempSync(join(tmpdir(), 'pj-dev-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=test', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem')], { stdio: 'ignore' });
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
  PAYSTACK_SECRET_KEY: 'sk_test_fake',
  RESEND_API_KEY: 're_test',
  EMAIL_FROM: 'ProfJero Connect <test@example.com>',
  CUSTOMER_APP_URL: 'http://localhost:5174',
};
const key = await importPKCS8(keyPem, 'RS256');
// Background work runs after the response, like Workers' waitUntil.
const ctx = {
  waitUntil(p: Promise<unknown>) {
    p.catch((err) => console.error('[background]', err));
  },
  passThroughOnException() {},
} as unknown as ExecutionContext;

/** Firebase-style ID token, carrying any custom claims the fake has set. */
async function mint(uid: string, email: string): Promise<string> {
  const t = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email,
    email_verified: false,
    auth_time: t,
    user_id: uid,
    firebase: { identities: { email: [email] }, sign_in_provider: 'password' },
    ...(cloud.claims.get(uid) ?? {}),
  })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setAudience(PROJECT)
    .setSubject(uid)
    .setIssuedAt(t)
    .setExpirationTime(t + 3600)
    .sign(key);
}

async function call(method: string, path: string, token: string, body?: unknown) {
  const res = await worker.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    }) as never,
    env,
    ctx,
  );
  if (res.status >= 300) throw new Error(`seed ${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<Record<string, any>>;
}

// ---------- seed ----------
const now = new Date().toISOString();
cloud.put('pricingSettings/sms', {
  service: 'sms', currency: 'GHS', unitPriceGhs: 0.04, minPurchaseUnits: 100, maxPurchaseUnits: 100000,
  active: true, updatedAt: now, updatedBy: 'seed',
});
for (const [id, name, units, price, order] of [
  ['p1', 'Starter', 500, 20, 10], ['p2', 'Basic', 1300, 50, 20], ['p3', 'Growth', 2750, 100, 30], ['p4', 'Business', 5700, 200, 40],
] as const) {
  cloud.put(`packages/${id}`, {
    service: 'sms', name, units, priceGhs: price, description: null, active: true, displayOrder: order,
    createdAt: now, updatedAt: now, createdBy: 'seed', updatedBy: 'seed',
  });
}
for (const [uid, role] of [['root', 'super_admin'], ['viewer', 'viewer']] as const) {
  const email = `${uid}@ops.example`;
  cloud.put(`admins/${uid}`, { email, displayName: uid === 'root' ? 'Root Admin' : 'View Only', role, status: 'active', createdAt: now });
  cloud.authUsers.set(email, { uid, disabled: false });
}
const rootToken = await mint('root', 'root@ops.example');
await call('POST', '/admin/providers/bootstrap', rootToken, {});

// A customer with a pending Sender ID request → the admin bell has an alert.
const seedTok = await mint('seedcust', 'kofi@example.com');
await call('POST', '/customer/register', seedTok, { displayName: 'Kofi Boateng', organisationName: 'Boateng Pharmacy', acceptedTerms: true });
await call('POST', '/customer/sender-ids', await mint('seedcust', 'kofi@example.com'), {
  value: 'BOATENG', purpose: 'Transactional & Alerts', description: 'Prescription ready alerts.',
});

// ---------- HTTP ----------
createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const cors = { 'access-control-allow-origin': '*' };
  try {
    if (url.pathname === '/__test/token') {
      const tok = await mint(url.searchParams.get('uid')!, url.searchParams.get('email')!);
      res.writeHead(200, { 'content-type': 'text/plain', ...cors }).end(tok);
      return;
    }
    if (url.pathname === '/__test/approve') {
      await approveSenderIdValue(env, url.searchParams.get('value')!, 'root');
      res.writeHead(200, cors).end('ok');
      return;
    }
    if (url.pathname === '/__test/paid') {
      for (const ref of cloud.gatewayStatus.keys()) cloud.gatewayStatus.set(ref, 'success');
      res.writeHead(200, cors).end('ok');
      return;
    }
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    const r = await worker.fetch(
      new Request(url, {
        method: req.method,
        headers,
        body: req.method === 'GET' || req.method === 'HEAD' || chunks.length === 0 ? undefined : Buffer.concat(chunks),
      }) as never,
      env,
      ctx,
    );
    const out: Record<string, string> = {};
    r.headers.forEach((v, k) => (out[k] = v));
    res.writeHead(r.status, out).end(Buffer.from(await r.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.writeHead(500, cors).end('dev server error');
  }
}).listen(PORT, () => console.log(`fake-cloud API on http://localhost:${PORT}`));
