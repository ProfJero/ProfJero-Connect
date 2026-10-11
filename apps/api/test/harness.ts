/**
 * Shared harness for the API test suites: boots the real Worker against
 * the in-memory fake cloud, mints Firebase-style ID tokens, and provides
 * request + assertion helpers.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importPKCS8, SignJWT } from 'jose';
import worker from '../src/index';
import type { Env } from '../src/types/env';
import { createFakeCloud, type FakeCloud } from './fakeCloud';
import { resetSettingsCache } from '../src/services/settings';
import { resetMemoryLimits } from '../src/lib/rateLimit';

export const PROJECT = 'test-project';
export const KID = 'test-kid';
export const PAYSTACK_SECRET = 'sk_test_fake';

function makeKeys(): { keyPem: string; certPem: string } {
  const dir = mkdtempSync(join(tmpdir(), 'pj-test-'));
  try {
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
      '-subj', '/CN=test', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem'),
    ], { stdio: 'ignore' });
    return {
      keyPem: readFileSync(join(dir, 'key.pem'), 'utf8'),
      certPem: readFileSync(join(dir, 'cert.pem'), 'utf8'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export interface Harness {
  cloud: FakeCloud;
  env: Env;
  keyPem: string;
  /** A second, unrelated key — tokens it signs must be rejected. */
  rogueKeyPem: string;
  token(uid: string, email: string, opts?: TokenOpts): Promise<string>;
  call<T = any>(method: string, path: string, opts?: CallOpts): Promise<Res<T>>;
  seedAdmin(uid: string, role: string, status?: 'active' | 'disabled'): Promise<string>;
  signUp(uid: string, email: string, org: string, headers?: Record<string, string>): Promise<string>;
  reset(): void;
}

export interface TokenOpts {
  claims?: Record<string, unknown>;
  expiresInSec?: number;
  issuer?: string;
  audience?: string;
  kid?: string;
  signWith?: 'real' | 'rogue';
}

export interface CallOpts {
  token?: string;
  body?: unknown;
  raw?: string;
  headers?: Record<string, string>;
  env?: Partial<Env>;
  /** Return as soon as the response is ready, without waiting for background work. */
  noWait?: boolean;
}

export interface Res<T = any> {
  status: number;
  body: T;
  headers: Headers;
  ms: number;
}

/** Background work (ctx.waitUntil) started by requests. */
const pendingWork: Promise<unknown>[] = [];
const ctx = {
  waitUntil(p: Promise<unknown>) {
    pendingWork.push(p);
  },
  passThroughOnException() {},
} as unknown as ExecutionContext;

/** Let background work (e.g. SMS delivery) finish. */
export async function drainBackground(): Promise<void> {
  while (pendingWork.length > 0) await Promise.allSettled(pendingWork.splice(0));
}

export async function createHarness(envOverrides: Partial<Env> = {}): Promise<Harness> {
  const { keyPem, certPem } = makeKeys();
  const rogue = makeKeys();
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
    ...envOverrides,
  };
  const realKey = await importPKCS8(keyPem, 'RS256');
  const rogueKey = await importPKCS8(rogue.keyPem, 'RS256');

  const token: Harness['token'] = async (uid, email, opts = {}) => {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({ email, ...(cloud.claims.get(uid) ?? {}), ...(opts.claims ?? {}) })
      .setProtectedHeader({ alg: 'RS256', kid: opts.kid ?? KID })
      .setIssuer(opts.issuer ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.audience ?? PROJECT)
      .setSubject(uid)
      .setIssuedAt(now - 10)
      .setExpirationTime(now + (opts.expiresInSec ?? 3600))
      .sign(opts.signWith === 'rogue' ? rogueKey : realKey);
  };

  const call: Harness['call'] = async (method, path, opts = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers ?? {}) };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const req = new Request(`http://localhost${path}`, {
      method,
      headers,
      body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
    });
    const started = performance.now();
    const res = await worker.fetch(req as never, { ...env, ...(opts.env ?? {}) } as Env, ctx);
    const ms = performance.now() - started;
    if (!opts.noWait) await drainBackground();
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, body: body as never, headers: res.headers, ms };
  };

  const seedAdmin: Harness['seedAdmin'] = async (uid, role, status = 'active') => {
    cloud.put(`admins/${uid}`, {
      email: `${uid}@ops.example`,
      displayName: `${role} person`,
      role,
      status,
      createdAt: new Date().toISOString(),
    });
    cloud.authUsers.set(`${uid}@ops.example`, { uid, disabled: status === 'disabled' });
    return token(uid, `${uid}@ops.example`);
  };

  let ipSeq = 0;
  const signUp: Harness['signUp'] = async (uid, email, org, headers) => {
    const r = await call('POST', '/customer/register', {
      token: await token(uid, email),
      body: { displayName: `${org} Owner`, organisationName: org, acceptedTerms: true },
      // A distinct network per signup so the per-IP signup limit only
      // applies where a test means it to.
      headers: { 'CF-Connecting-IP': `10.0.${Math.floor(ipSeq / 250)}.${(ipSeq++ % 250) + 1}`, ...(headers ?? {}) },
    });
    if (r.status !== 201 && r.status !== 200) throw new Error(`signUp failed ${r.status}: ${JSON.stringify(r.body)}`);
    return token(uid, email);
  };

  return {
    cloud,
    env,
    keyPem,
    rogueKeyPem: rogue.keyPem,
    token,
    call,
    seedAdmin,
    signUp,
    reset: () => {
      resetSettingsCache();
      resetMemoryLimits();
      for (const r of cloud.list('rateLimits')) cloud.docs.delete(`rateLimits/${r.id}`);
    },
  };
}

// ---------- tiny test runner ----------

let passed = 0;
let failed = 0;
const failures: string[] = [];

export function section(name: string) {
  console.log(`\n${name}`);
}

export async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    failures.push(name);
    console.error(`  ✗ ${name}\n      ${(err as Error).message.split('\n').join('\n      ')}`);
  }
}

export function finish(label: string): void {
  console.log(`\n${label}: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    console.log(`Failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
    process.exitCode = 1;
  }
}

/** Seed the SMS pricing catalog the way the admin dashboard would. */
export function seedPricing(cloud: FakeCloud): void {
  const now = new Date().toISOString();
  cloud.put('pricingSettings/sms', {
    service: 'sms', currency: 'GHS', unitPriceGhs: 0.05, minPurchaseUnits: 100, maxPurchaseUnits: 100000,
    active: true, updatedAt: now, updatedBy: 'seed',
  });
  cloud.put('packages/starter', {
    service: 'sms', name: 'Starter', units: 500, priceGhs: 20, description: null, active: true, displayOrder: 10,
    createdAt: now, updatedAt: now, createdBy: 'seed', updatedBy: 'seed',
  });
}

/** Approve a Sender ID for a project directly in the store. */
export function seedApprovedSenderId(cloud: FakeCloud, projectId: string, value: string): void {
  const now = new Date().toISOString();
  cloud.put(`senderIds/${value}`, {
    value, status: 'approved', requestedByProjectId: projectId, requestedAt: now, approvedAt: now,
    approvedByAdminUid: 'seed', rejectedAt: null, rejectedByAdminUid: null, rejectionReason: null,
  });
  cloud.put(`senderIdAssignments/${projectId}__${value}`, {
    projectId, senderId: value, status: 'approved', requestedAt: now, decidedAt: now, decidedByAdminUid: 'seed', notes: null,
  });
}

/**
 * Set a wallet's available balance directly, with a matching ledger entry.
 * Units still held by unresolved messages stay reserved, so the integrity
 * invariant keeps holding mid-run.
 */
export function seedWallet(cloud: FakeCloud, projectId: string, units: number): void {
  const now = new Date().toISOString();
  const held = heldUnits(cloud, projectId);
  cloud.put(`wallets/${projectId}`, { projectId, availableUnits: units, reservedUnits: held, lowBalanceThreshold: null, updatedAt: now, createdAt: now });
  // Replace the ledger so the invariant (ledger sum == wallet) holds.
  for (const t of cloud.list('walletTransactions')) {
    if (t.data.projectId === projectId) cloud.docs.delete(`walletTransactions/${t.id}`);
  }
  cloud.put(`walletTransactions/seed__${projectId}`, {
    id: `seed__${projectId}`, projectId, type: 'manual_credit', availableDelta: units, reservedDelta: held,
    availableAfter: units, reservedAfter: held, batchId: null, recordId: null, amountGhs: null,
    description: 'seed', createdBy: 'seed', createdAt: '2000-01-01T00:00:00.000Z', reversesTransactionId: null, metadata: null,
  });
}

/** Units reserved by a project's unresolved messages (batches past "queued"). */
function heldUnits(cloud: FakeCloud, projectId: string): number {
  return cloud
    .list('smsRecords')
    .filter((r) => r.data.projectId === projectId && ['unknown', 'queued', 'submitting'].includes(String(r.data.status)))
    .filter((r) => {
      const b = cloud.get(`smsBatches/${r.data.batchId}`);
      return b && b.status !== 'queued'; // queued batches never reserved
    })
    .reduce((s, r) => s + Number(r.data.unitsReserved) - Number(r.data.unitsCharged) - Number(r.data.unitsReleased), 0);
}

/**
 * The wallet integrity invariant: for every project, the wallet snapshot
 * equals the sum of its ledger, nothing is negative, and reserved units
 * equal what unresolved ("unknown"/in-flight) records still hold.
 */
export function checkWalletIntegrity(cloud: FakeCloud): string[] {
  const problems: string[] = [];
  for (const w of cloud.list('wallets')) {
    const pid = w.id;
    const ledger = cloud.list('walletTransactions').filter((t) => t.data.projectId === pid);
    const avail = ledger.reduce((s, t) => s + Number(t.data.availableDelta), 0);
    const res = ledger.reduce((s, t) => s + Number(t.data.reservedDelta), 0);
    const wa = Number(w.data.availableUnits);
    const wr = Number(w.data.reservedUnits);
    if (wa !== avail) problems.push(`${pid}: available ${wa} != ledger ${avail}`);
    if (wr !== res) problems.push(`${pid}: reserved ${wr} != ledger ${res}`);
    if (wa < 0 || wr < 0) problems.push(`${pid}: negative balance (${wa}/${wr})`);
    const held = heldUnits(cloud, pid);
    if (held !== wr) problems.push(`${pid}: reserved ${wr} != units held by unresolved records ${held}`);
  }
  return problems;
}
