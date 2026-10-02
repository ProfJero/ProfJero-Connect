/**
 * Load test: many customers hammering the hot paths at once, against the
 * real Worker code with the in-memory fake cloud.
 *
 *   npm run test:load --workspace=@profjero/api [-- --customers=30 --rounds=20]
 *
 * What it measures: the Worker's own processing time and the number of
 * database round-trips per request, under concurrency, plus correctness
 * (no 5xx, no overdraft, ledger == wallets). It does NOT measure network
 * or Firestore latency — multiply database calls by your region's
 * Firestore round-trip (~20–60 ms) to estimate real-world latency.
 */
import assert from 'node:assert/strict';
import { approveSenderIdValue } from '../src/services/senderIds';
import { checkWalletIntegrity, createHarness, seedPricing, seedWallet } from './harness';

const arg = (name: string, def: number) => {
  const m = process.argv.find((a: string) => a.startsWith(`--${name}=`));
  return m ? Number(m.split('=')[1]) : def;
};
const CUSTOMERS = arg('customers', 30);
const ROUNDS = arg('rounds', 20);

const h = await createHarness();
const { cloud, call } = h;
seedPricing(cloud);
const SUPER = await h.seedAdmin('root', 'super_admin');
// Lift per-account limits so we measure throughput, not the limiter.
await call('PUT', '/admin/settings/security', {
  token: SUPER,
  body: { customerSignupsEnabled: true, customerSendsPerMinute: 600, customerRequestsPerMinute: 6000 },
});
h.reset();

const silence = console.log;
const quiet = () => { console.log = () => {}; console.warn = () => {}; console.error = () => {}; };
const loud = () => { console.log = silence; };

interface Sample { op: string; ms: number; status: number; dbCalls: number }
const samples: Sample[] = [];

console.log(`Setting up ${CUSTOMERS} customers…`);
quiet();
const customers: Array<{ token: string; pid: string; sender: string }> = [];
for (let i = 0; i < CUSTOMERS; i++) {
  const uid = `load${i}`;
  const token = await h.signUp(uid, `${uid}@example.com`, `Load ${i}`);
  const pid = String(cloud.get(`customers/${uid}`)!.projectId);
  const sender = `LOAD${i}`.slice(0, 11);
  await call('POST', '/customer/sender-ids', { token, body: { value: sender, purpose: 'Business Notifications', description: 'Load testing.' } });
  await approveSenderIdValue(h.env, sender, 'root');
  seedWallet(cloud, pid, 1_000);
  customers.push({ token, pid, sender });
}
loud();

let seq = 0;
async function timed(op: string, fn: () => ReturnType<typeof call>) {
  const before = cloud.firestoreCalls;
  const r = await fn();
  // dbCalls is approximate under concurrency (shared counter); averaged below.
  samples.push({ op, ms: r.ms, status: r.status, dbCalls: cloud.firestoreCalls - before });
  return r;
}

console.log(`Running ${ROUNDS} rounds × ${CUSTOMERS} customers × 5 operations, all customers concurrently…`);
quiet();
const started = performance.now();
for (let round = 0; round < ROUNDS; round++) {
  await Promise.all(
    customers.map(async (c, i) => {
      await timed('GET /customer/wallet', () => call('GET', '/customer/wallet', { token: c.token }));
      await timed('POST /customer/sms/send (3 recipients)', () =>
        call('POST', '/customer/sms/send', {
          token: c.token,
          headers: { 'Idempotency-Key': `load-${round}-${i}-${++seq}` },
          body: { senderId: c.sender, message: `Load test round ${round}`, recipients: ['+233241110022', '+233241110033', '+233241110044'] },
        }),
      );
      await timed('GET /customer/sms/batches', () => call('GET', '/customer/sms/batches?limit=20', { token: c.token }));
      await timed('GET /customer/notifications', () => call('GET', '/customer/notifications', { token: c.token }));
      await timed('GET /admin/dashboard', () => call('GET', '/admin/dashboard', { token: SUPER }));
    }),
  );
}
const wall = (performance.now() - started) / 1000;
loud();

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const ops = [...new Set(samples.map((s) => s.op))];
const rows = ops.map((op) => {
  const xs = samples.filter((s) => s.op === op);
  const ms = xs.map((s) => s.ms);
  return {
    operation: op,
    requests: xs.length,
    'p50 ms': pct(ms, 50).toFixed(1),
    'p95 ms': pct(ms, 95).toFixed(1),
    'p99 ms': pct(ms, 99).toFixed(1),
    'max ms': Math.max(...ms).toFixed(1),
    errors: xs.filter((s) => s.status >= 500).length,
    'non-2xx': xs.filter((s) => s.status >= 300).length,
  };
});
console.table(rows);

const total = samples.length;
const fiveXX = samples.filter((s) => s.status >= 500).length;
console.log(`\n${total} requests in ${wall.toFixed(1)}s (${(total / wall).toFixed(0)} req/s in one Node process).`);
console.log(`Database round-trips: ${cloud.firestoreCalls.toLocaleString()} total.`);

// Database round-trips per request, measured one request at a time (exact).
quiet();
const c0 = customers[0];
const perOp: Array<{ operation: string; 'db round-trips': number }> = [];
const measure = async (op: string, fn: () => ReturnType<typeof call>) => {
  const before = cloud.firestoreCalls;
  await fn();
  perOp.push({ operation: op, 'db round-trips': cloud.firestoreCalls - before });
};
await measure('GET /customer/wallet', () => call('GET', '/customer/wallet', { token: c0.token }));
await measure('POST /customer/sms/send (3 recipients)', () =>
  call('POST', '/customer/sms/send', { token: c0.token, headers: { 'Idempotency-Key': `load-exact-${++seq}` }, body: { senderId: c0.sender, message: 'exact', recipients: ['+233241110022', '+233241110033', '+233241110044'] } }),
);
await measure('GET /customer/sms/batches', () => call('GET', '/customer/sms/batches?limit=20', { token: c0.token }));
await measure('GET /customer/notifications', () => call('GET', '/customer/notifications', { token: c0.token }));
await measure('GET /admin/dashboard', () => call('GET', '/admin/dashboard', { token: SUPER }));
loud();
console.log('\nDatabase round-trips per request (multiply by your Firestore RTT for real latency):');
console.table(perOp);

const problems = checkWalletIntegrity(cloud);
const sends = samples.filter((s) => s.op.startsWith('POST'));
const sentOk = sends.filter((s) => s.status === 201).length;
for (const c of customers) {
  const w = cloud.get(`wallets/${c.pid}`)!;
  assert.ok(Number(w.availableUnits) >= 0, `negative wallet ${c.pid}`);
}
console.log(`Sends accepted: ${sentOk}/${sends.length}. Wallet/ledger problems: ${problems.length}. 5xx: ${fiveXX}.`);
if (fiveXX > 0 || problems.length > 0) {
  console.log(problems.slice(0, 10).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Load test passed.');
}
