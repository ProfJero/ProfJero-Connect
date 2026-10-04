/**
 * Feature suite: fast background sending, personalised SMS, contact
 * fields + import, campaigns (one-time, recurring, birthday), templates,
 * and the extended public API (balance, estimate, payments, scheduling).
 *
 *   npm run test:features --workspace=@profjero/api
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { approveSenderIdValue } from '../src/services/senderIds';
import { resumeStalledBatches } from '../src/services/sms';
import { dispatchDueCampaigns, nextDailyRun, zonedParts } from '../src/services/campaigns';
import { parseDateOfBirth } from '../src/services/contacts';
import { renderTemplate, contactVariables, extractVariables } from '@profjero/shared';
import type { Env } from '../src/types/env';
import {
  PAYSTACK_SECRET,
  checkWalletIntegrity,
  createHarness,
  drainBackground,
  finish,
  section,
  seedPricing,
  seedWallet,
  step,
} from './harness';

const h = await createHarness();
const { cloud, call } = h;
seedPricing(cloud);
await h.seedAdmin('root', 'super_admin');
// Lift customer limits; this suite measures features, not the limiter.
await call('PUT', '/admin/settings/security', {
  token: await h.token('root', 'root@ops.example'),
  body: { customerSignupsEnabled: true, customerSendsPerMinute: 600, customerRequestsPerMinute: 6000 },
});
await call('PUT', '/admin/settings/sms', {
  token: await h.token('root', 'root@ops.example'),
  body: { starterUnits: 3, defaultLowBalanceThreshold: null, maxRecipientsPerSend: 5000, senderIdReviewSla: 'up to 1 business day' },
});
h.reset();

const projectOf = (uid: string) => String(cloud.get(`customers/${uid}`)!.projectId);
let seq = 0;
const ikey = (p = 'k') => `${p}-${Date.now()}-${++seq}-xxxx`;
const walletOf = (pid: string) => cloud.get(`wallets/${pid}`)!;

async function ready(uid: string, sender: string, units: number) {
  const token = await h.signUp(uid, `${uid}@example.com`, `${uid} Org`);
  const pid = projectOf(uid);
  await call('POST', '/customer/sender-ids', { token, body: { value: sender, purpose: 'Business Notifications', description: 'Testing the platform end to end.' } });
  await approveSenderIdValue(h.env, sender, 'root');
  seedWallet(cloud, pid, units);
  return { token, pid };
}

function assertIntegrity() {
  const problems = checkWalletIntegrity(cloud);
  assert.deepEqual(problems, [], problems.join('\n'));
}

const numbers = (n: number, start = 1000) =>
  Array.from({ length: n }, (_, i) => `+23324${String(start + i * 7).padStart(7, '0').slice(-7)}`).filter((p) => !/0[01]$/.test(p));

// =====================================================================
section('Fast sending (respond now, deliver in the background)');
// =====================================================================

const ama = await ready('ama', 'AMASHOP', 5000);

await step('a send returns before the provider finishes, then completes in the background', async () => {
  cloud.provider.delayMs = 400;
  const LIVE: Partial<Env> = { SMS_PROVIDER: 'arkesel', ARKESEL_API_KEY: 'k' };
  const r = await call('POST', '/customer/sms/send', {
    token: ama.token,
    headers: { 'Idempotency-Key': ikey() },
    body: { senderId: 'AMASHOP', message: 'Quick hello', recipients: numbers(5) },
    env: LIVE,
    noWait: true,
  });
  cloud.provider.delayMs = 0;
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.batch.status, 'submitting');
  assert.ok(r.ms < 400, `response took ${r.ms.toFixed(0)}ms although the provider takes 400ms`);
  await drainBackground();
  const done = await call('GET', `/customer/sms/batches/${r.body.batch.id}`, { token: ama.token });
  assert.equal(done.body.batch.status, 'completed');
  assertIntegrity();
});

await step('a 1,200-recipient send uses a handful of database round-trips before responding', async () => {
  const list = numbers(1260).slice(0, 1200);
  const before = cloud.firestoreCalls;
  const r = await call('POST', '/customer/sms/send', {
    token: ama.token,
    headers: { 'Idempotency-Key': ikey() },
    body: { senderId: 'AMASHOP', message: 'Big list', recipients: list },
    noWait: true,
  });
  const requestCalls = cloud.firestoreCalls - before;
  assert.equal(r.status, 201, JSON.stringify(r.body).slice(0, 300));
  assert.ok(requestCalls <= 20, `request made ${requestCalls} database calls`);
  await drainBackground();
  const after = cloud.firestoreCalls - before;
  // ~6 chunks of 200: mark + settle (3) per chunk, plus reads — not ~4 per recipient.
  assert.ok(after < 120, `whole send made ${after} database calls for 1,200 recipients`);
  const done = await call('GET', `/customer/sms/batches/${r.body.batch.id}`, { token: ama.token });
  assert.equal(done.body.batch.status, 'completed');
  assert.equal(done.body.batch.submittedCount, list.length);
  assertIntegrity();
});

await step('an interrupted delivery is resumed by the per-minute job, never sent twice', async () => {
  const sentBefore = cloud.provider.sent;
  const r = await call('POST', '/customer/sms/send', {
    token: ama.token,
    headers: { 'Idempotency-Key': ikey() },
    body: { senderId: 'AMASHOP', message: 'Resume me', recipients: numbers(450, 3000) },
    noWait: true,
    env: { SMS_PROVIDER: 'arkesel', ARKESEL_API_KEY: 'k' },
  });
  const batchId = r.body.batch.id as string;
  // The worker "dies": its background work is discarded. Simulate a crash
  // mid-chunk: one chunk marked in flight, nothing settled.
  await drainBackground().catch(() => {});
  // Rewind to a crash state: the first 200 records "submitting", the rest queued.
  const recs = cloud.list('smsRecords').filter((x) => x.data.batchId === batchId);
  const total = recs.length;
  for (const x of recs) {
    const idx = Number(x.id.split('__r').pop());
    cloud.put(`smsRecords/${x.id}`, { ...x.data, status: idx < 200 ? 'submitting' : 'queued', unitsCharged: 0, unitsReleased: 0, providerMessageId: null });
  }
  for (const t of cloud.list('walletTransactions')) if (t.data.batchId === batchId && t.data.type !== 'reserve') cloud.docs.delete(`walletTransactions/${t.id}`);
  const w = walletOf(ama.pid);
  const reserveTx = cloud.list('walletTransactions').find((t) => t.id === `reserve__${batchId}`)!;
  const held = Number(reserveTx.data.reservedDelta);
  // Rebuild the wallet so it matches the rewound ledger.
  const ledger = cloud.list('walletTransactions').filter((t) => t.data.projectId === ama.pid);
  cloud.put(`wallets/${ama.pid}`, {
    ...w,
    availableUnits: ledger.reduce((s, t) => s + Number(t.data.availableDelta), 0),
    reservedUnits: ledger.reduce((s, t) => s + Number(t.data.reservedDelta), 0),
  });
  cloud.put(`smsBatches/${batchId}`, { ...cloud.get(`smsBatches/${batchId}`)!, status: 'submitting', leaseUntil: new Date(Date.now() - 1000).toISOString() });
  assert.equal(held, total);

  const sentMid = cloud.provider.sent;
  const { resumed } = await resumeStalledBatches({ ...h.env, SMS_PROVIDER: 'arkesel', ARKESEL_API_KEY: 'k' } as Env);
  assert.equal(resumed, 1);
  const recsAfter = cloud.list('smsRecords').filter((x) => x.data.batchId === batchId);
  const unknown = recsAfter.filter((x) => x.data.status === 'unknown').length;
  const submitted = recsAfter.filter((x) => x.data.status === 'submitted').length;
  assert.equal(unknown, 200, 'in-flight records become unknown (units held for reconciliation)');
  assert.equal(submitted, total - 200);
  assert.equal(cloud.provider.sent - sentMid, total - 200, 'only never-sent records go to the provider');
  assert.equal(cloud.get(`smsBatches/${batchId}`)!.status, 'partial');
  assert.ok(cloud.provider.sent - sentBefore >= total - 200);
  assertIntegrity();
});

await step('a second resume finds nothing to do', async () => {
  const { resumed } = await resumeStalledBatches(h.env);
  assert.equal(resumed, 0);
});

// =====================================================================
section('Personalised SMS');
// =====================================================================

await step('template rendering: fields, fallbacks, case-insensitive names', async () => {
  const vars = contactVariables({ name: 'Kofi Mensah', phone: '233241112233', dateOfBirth: '1990-05-12', customFields: { 'Loyalty Points': '120' } });
  assert.equal(vars.first_name, 'Kofi');
  assert.equal(vars.last_name, 'Mensah');
  assert.equal(vars.loyalty_points, '120');
  const r = renderTemplate('Hi {First Name}, you have {loyalty_points} points. {missing|See you soon}!', vars);
  assert.equal(r.text, 'Hi Kofi, you have 120 points. See you soon!');
  assert.deepEqual(r.missing, []);
  assert.deepEqual(renderTemplate('Hi {nickname}', vars).missing, ['nickname']);
  assert.deepEqual(extractVariables('{a} {A} {b|x}').map((v) => v.key), ['a', 'b']);
});

await step('contacts store first/last name, birthday and custom fields', async () => {
  const r = await call('POST', '/customer/contacts', {
    token: ama.token,
    body: { firstName: 'Esi', lastName: 'Owusu', phone: '0245550101', dateOfBirth: '1995-03-02', customFields: { 'Loyalty Points': '75', Branch: 'Kumasi' } },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.contact.name, 'Esi Owusu');
  assert.deepEqual(r.body.contact.customFields, { loyalty_points: '75', branch: 'Kumasi' });
  const fields = await call('GET', '/customer/contacts/fields', { token: ama.token });
  assert.ok(fields.body.builtin.includes('first_name'));
  assert.deepEqual(fields.body.custom, ['branch', 'loyalty_points']);
});

await step('CSV import maps extra columns to custom fields and reads common date formats', async () => {
  assert.equal(parseDateOfBirth('12/05/1990'), '1990-05-12');
  assert.equal(parseDateOfBirth('1990-05-12'), '1990-05-12');
  assert.equal(parseDateOfBirth('12 May 1990'), '1990-05-12');
  assert.equal(parseDateOfBirth('May 12, 1990'), '1990-05-12');
  assert.equal(parseDateOfBirth('31/02/1990'), null);
  const g = await call('POST', '/customer/contact-groups', { token: ama.token, body: { name: 'VIP' } });
  const r = await call('POST', '/customer/contacts/import', {
    token: ama.token,
    body: {
      groupId: g.body.group.id,
      contacts: [
        { firstName: 'Yaw', lastName: 'Boateng', phone: '0245550202', dateOfBirth: '02/03/1988', customFields: { Balance: 'GH₵ 50' } },
        { firstName: 'Abena', phone: '0245550303', customFields: { Balance: 'GH₵ 10' } },
        { firstName: 'Esi', phone: '0245550101', customFields: { Balance: 'GH₵ 5' } }, // existing: gains a field
      ],
    },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.created, 2);
  assert.equal(r.body.updated, 1);
  const list = await call('GET', '/customer/contacts?q=yaw', { token: ama.token });
  assert.equal(list.body.contacts[0].dateOfBirth, '1988-03-02');
  assert.equal(list.body.contacts[0].customFields.balance, 'GH₵ 50');
  const esi = (await call('GET', '/customer/contacts?q=esi', { token: ama.token })).body.contacts[0];
  assert.equal(esi.customFields.balance, 'GH₵ 5');
  assert.equal(esi.customFields.loyalty_points, '75', 'existing fields kept');
});

await step('preview shows exact per-person text and units', async () => {
  const groupId = (await call('GET', '/customer/contact-groups', { token: ama.token })).body.groups.find((x: { name: string }) => x.name === 'VIP').id;
  const r = await call('POST', '/customer/sms/preview', {
    token: ama.token,
    body: { message: 'Hi {first_name}, your balance is {balance}.', groupIds: [groupId] },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.recipients, 3);
  assert.equal(r.body.personalized, true);
  assert.ok(r.body.samples.some((s: { message: string }) => s.message === 'Hi Yaw, your balance is GH₵ 50.'));
  // The ₵ sign makes each message Unicode (UCS-2); all three still fit in one segment.
  assert.equal(r.body.units, 3);
});

await step('personalised send: each recipient gets their own text, billed by its own length', async () => {
  const groupId = (await call('GET', '/customer/contact-groups', { token: ama.token })).body.groups.find((x: { name: string }) => x.name === 'VIP').id;
  const before = Number(walletOf(ama.pid).availableUnits);
  const message = 'Hello {first_name}! Your {branch|main} branch has a gift for you. Balance: {balance}.';
  const pv = await call('POST', '/customer/sms/preview', { token: ama.token, body: { message, groupIds: [groupId] } });
  const r = await call('POST', '/customer/sms/send', {
    token: ama.token,
    headers: { 'Idempotency-Key': ikey() },
    body: { senderId: 'AMASHOP', message, groupIds: [groupId] },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const recs = cloud.list('smsRecords').filter((x) => x.data.batchId === r.body.batch.id);
  const byPhone = new Map(recs.map((x) => [x.data.recipient, x.data.message]));
  assert.equal(byPhone.get('233245550202'), 'Hello Yaw! Your main branch has a gift for you. Balance: GH₵ 50.');
  assert.equal(byPhone.get('233245550101'), 'Hello Esi! Your Kumasi branch has a gift for you. Balance: GH₵ 5.');
  const charged = before - Number(walletOf(ama.pid).availableUnits);
  assert.equal(charged, pv.body.units, 'preview units = units charged');
  assert.equal(cloud.get(`smsBatches/${r.body.batch.id}`)!.personalized, true);
  await drainBackground();
  const done = cloud.get(`smsBatches/${r.body.batch.id}`)!;
  // Esi's number ends in 01, which the test provider reports as "unknown".
  assert.deepEqual([done.status, done.submittedCount, done.unknownCount], ['partial', 2, 1]);
  assertIntegrity();
});

await step('a variable some recipients lack is refused with a clear message (no "Hi ,")', async () => {
  const r = await call('POST', '/customer/sms/send', {
    token: ama.token,
    headers: { 'Idempotency-Key': ikey() },
    body: { senderId: 'AMASHOP', message: 'Happy birthday {first_name}, born {dob}!', recipients: ['0245550303', '0245550202', '0249990000'] },
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error.message, /\{dob\} is empty for 2 recipients/);
  assert.match(r.body.error.message, /fallback/);
});

await step('typed numbers that are saved contacts get their details', async () => {
  const r = await call('POST', '/customer/sms/preview', { token: ama.token, body: { message: 'Hi {first_name|friend}', recipients: ['0245550202', '0249990011'] } });
  const texts = r.body.samples.map((s: { message: string }) => s.message).sort();
  assert.deepEqual(texts, ['Hi Yaw', 'Hi friend']);
});

// =====================================================================
section('Campaigns & templates');
// =====================================================================

const kojo = await ready('kojo', 'KOJOSTORE', 200);
const inAMinute = () => new Date(Date.now() + 60_000).toISOString();
async function makeDue(id: string) {
  cloud.put(`campaigns/${id}`, { ...cloud.get(`campaigns/${id}`)!, nextRunAt: new Date(Date.now() - 1000).toISOString() });
}

await step('schedule a one-time campaign; it sends when due, exactly once', async () => {
  const r = await call('POST', '/customer/campaigns', {
    token: kojo.token,
    body: { name: 'Weekend sale', kind: 'once', senderId: 'KOJOSTORE', message: 'Sale this weekend!', recipients: ['0241112223', '0241112224'], scheduledAt: inAMinute() },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.deepEqual(r.body.campaign.estimate, { recipients: 2, units: 2 });
  const id = r.body.campaign.id;
  assert.equal((await dispatchDueCampaigns(h.env)).dispatched, 0, 'not due yet');
  await makeDue(id);
  const before = Number(walletOf(kojo.pid).availableUnits);
  const d1 = await dispatchDueCampaigns(h.env);
  const d2 = await dispatchDueCampaigns(h.env);
  assert.equal(d1.dispatched, 1);
  assert.equal(d2.dispatched, 0);
  const c = (await call('GET', `/customer/campaigns/${id}`, { token: kojo.token })).body.campaign;
  assert.equal(c.status, 'sent');
  assert.equal(c.runs, 1);
  assert.equal(before - Number(walletOf(kojo.pid).availableUnits), 2);
  assert.equal(cloud.get(`smsBatches/${c.lastBatchId}`)!.campaignId, id);
  assertIntegrity();
});

await step('validation: past times, unapproved Sender IDs and missing schedule are refused', async () => {
  const past = await call('POST', '/customer/campaigns', { token: kojo.token, body: { name: 'x', kind: 'once', senderId: 'KOJOSTORE', message: 'm', recipients: ['0241112223'], scheduledAt: new Date(Date.now() - 3_600_000).toISOString() } });
  assert.equal(past.status, 400);
  const sid = await call('POST', '/customer/campaigns', { token: kojo.token, body: { name: 'x', kind: 'once', senderId: 'NOTMINE', message: 'm', recipients: ['0241112223'], scheduledAt: inAMinute() } });
  assert.equal(sid.status, 400);
  const none = await call('POST', '/customer/campaigns', { token: kojo.token, body: { name: 'x', kind: 'recurring', senderId: 'KOJOSTORE', message: 'm', recipients: ['0241112223'], scheduledAt: inAMinute() } });
  assert.equal(none.status, 400);
});

await step('recurring campaign reschedules itself after each run', async () => {
  const r = await call('POST', '/customer/campaigns', {
    token: kojo.token,
    body: { name: 'Daily tip', kind: 'recurring', repeat: 'daily', senderId: 'KOJOSTORE', message: 'Tip of the day', recipients: ['0241112230'], scheduledAt: inAMinute() },
  });
  const id = r.body.campaign.id;
  await makeDue(id);
  await dispatchDueCampaigns(h.env);
  const c = (await call('GET', `/customer/campaigns/${id}`, { token: kojo.token })).body.campaign;
  assert.equal(c.status, 'scheduled');
  assert.equal(c.runs, 1);
  assert.ok(new Date(c.nextRunAt).getTime() > Date.now() + 23 * 3_600_000, c.nextRunAt);
  const cancel = await call('POST', `/customer/campaigns/${id}/cancel`, { token: kojo.token });
  assert.equal(cancel.body.campaign.status, 'cancelled');
  assert.equal((await call('POST', `/customer/campaigns/${id}/cancel`, { token: kojo.token })).status, 409);
});

await step('birthday campaign greets only today’s celebrants, by name', async () => {
  const today = zonedParts(new Date(), 'Africa/Accra');
  const mmdd = `${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
  await call('POST', '/customer/contacts', { token: kojo.token, body: { firstName: 'Akua', phone: '0247770001', dateOfBirth: `1992-${mmdd}` } });
  await call('POST', '/customer/contacts', { token: kojo.token, body: { firstName: 'Kwame', phone: '0247770002', dateOfBirth: '1992-01-01' === `1992-${mmdd}` ? '1992-06-15' : '1992-01-01' } });
  const r = await call('POST', '/customer/campaigns', {
    token: kojo.token,
    body: { name: 'Birthdays', kind: 'birthday', sendTime: '08:00', senderId: 'KOJOSTORE', message: 'Happy birthday {first_name}! 🎂' },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const id = r.body.campaign.id;
  await makeDue(id);
  await dispatchDueCampaigns(h.env);
  const c = (await call('GET', `/customer/campaigns/${id}`, { token: kojo.token })).body.campaign;
  assert.equal(c.status, 'scheduled', 'birthday campaigns keep running daily');
  const recs = cloud.list('smsRecords').filter((x) => x.data.batchId === c.lastBatchId);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].data.message, 'Happy birthday Akua! 🎂');
  const next = new Date(c.nextRunAt);
  assert.equal(zonedParts(next, 'Africa/Accra').hour, 8);
  assertIntegrity();
});

await step('a due campaign the wallet can’t cover fails cleanly and notifies the customer', async () => {
  const many = numbers(300, 9000);
  const r = await call('POST', '/customer/campaigns', {
    token: kojo.token,
    body: { name: 'Too big', kind: 'once', senderId: 'KOJOSTORE', message: 'Hello all', recipients: many, scheduledAt: inAMinute() },
  });
  const id = r.body.campaign.id;
  await makeDue(id);
  const before = JSON.stringify(walletOf(kojo.pid));
  const d = await dispatchDueCampaigns(h.env);
  assert.equal(d.failed, 1);
  const c = (await call('GET', `/customer/campaigns/${id}`, { token: kojo.token })).body.campaign;
  assert.equal(c.status, 'failed');
  assert.match(c.lastError, /enough units/);
  assert.equal(JSON.stringify(walletOf(kojo.pid)).includes('availableUnits'), true);
  assert.equal(walletOf(kojo.pid).availableUnits, JSON.parse(before).availableUnits);
  const n = await call('GET', '/customer/notifications', { token: kojo.token });
  assert.ok(n.body.notifications.some((x: { title: string }) => x.title.includes('Too big')));
});

await step('time zones: next 08:00 in Accra and in Lagos', async () => {
  const at = new Date('2026-06-01T09:00:00Z');
  assert.equal(nextDailyRun('08:00', 'Africa/Accra', at).toISOString(), '2026-06-02T08:00:00.000Z');
  assert.equal(nextDailyRun('08:00', 'Africa/Lagos', new Date('2026-06-01T06:00:00Z')).toISOString(), '2026-06-01T07:00:00.000Z');
});

await step('saved templates: create, list, update, delete', async () => {
  const c = await call('POST', '/customer/templates', { token: kojo.token, body: { name: 'Reminder', body: 'Hi {first_name}, see you tomorrow.' } });
  assert.equal(c.status, 201);
  const id = c.body.template.id;
  assert.equal((await call('PUT', `/customer/templates/${id}`, { token: kojo.token, body: { name: 'Reminder', body: 'Hi {first_name}!' } })).status, 200);
  const list = await call('GET', '/customer/templates', { token: kojo.token });
  assert.equal(list.body.templates[0].body, 'Hi {first_name}!');
  // Another tenant can't touch it.
  assert.equal((await call('DELETE', `/customer/templates/${id}`, { token: ama.token })).status, 404);
  assert.equal((await call('DELETE', `/customer/templates/${id}`, { token: kojo.token })).status, 200);
});

// =====================================================================
section('Public API (/v1)');
// =====================================================================

const secretKey = (await call('POST', '/customer/api-keys', { token: kojo.token, body: { name: 'server' } })).body.apiKey.plaintext as string;

await step('GET /v1/balance', async () => {
  const r = await call('GET', '/v1/balance', { token: secretKey });
  assert.equal(r.status, 200);
  assert.equal(typeof r.body.availableUnits, 'number');
  assert.equal(typeof r.body.lowBalance, 'boolean');
});

await step('POST /v1/sms/send with per-recipient fields personalises each message', async () => {
  seedWallet(cloud, kojo.pid, 100);
  const r = await call('POST', '/v1/sms/send', {
    token: secretKey,
    headers: { 'Idempotency-Key': ikey('v1') },
    body: {
      senderId: 'KOJOSTORE',
      message: 'Hi {first_name}, order {order_id} is ready.',
      recipients: [{ phone: '0243334441', fields: { first_name: 'Ama', order_id: 'A-17' } }, { phone: '0243334442', fields: { first_name: 'Kofi', order_id: 'B-02' } }],
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const texts = cloud.list('smsRecords').filter((x) => x.data.batchId === r.body.batch.id).map((x) => x.data.message).sort();
  assert.deepEqual(texts, ['Hi Ama, order A-17 is ready.', 'Hi Kofi, order B-02 is ready.']);
});

await step('POST /v1/sms/estimate reports units and whether the balance covers them', async () => {
  const r = await call('POST', '/v1/sms/estimate', { token: secretKey, body: { message: 'x'.repeat(200), recipients: ['0243334443'] } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.units, 2);
  assert.equal(r.body.sufficient, true);
});

await step('POST /v1/sms/send with scheduleAt creates a campaign (idempotent)', async () => {
  const key = ikey('sched');
  const body = { senderId: 'KOJOSTORE', message: 'Later!', recipients: ['0243334444'], scheduleAt: inAMinute() };
  const a = await call('POST', '/v1/sms/send', { token: secretKey, headers: { 'Idempotency-Key': key }, body });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  assert.equal(a.body.scheduled, true);
  const b = await call('POST', '/v1/sms/send', { token: secretKey, headers: { 'Idempotency-Key': key }, body });
  assert.equal(b.status, 200);
  assert.equal(b.body.campaign.id, a.body.campaign.id);
  const list = await call('GET', '/v1/campaigns', { token: secretKey });
  assert.ok(list.body.campaigns.some((x: { id: string }) => x.id === a.body.campaign.id));
  const cancel = await call('POST', `/v1/campaigns/${a.body.campaign.id}/cancel`, { token: secretKey });
  assert.equal(cancel.body.campaign.status, 'cancelled');
});

await step('POST /v1/payments starts a checkout; webhook credits; GET shows success', async () => {
  const key = ikey('pay');
  const r = await call('POST', '/v1/payments', { token: secretKey, headers: { 'Idempotency-Key': key }, body: { packageId: 'starter', email: 'billing@kojo.example', callbackUrl: 'https://kojo.example/paid' } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(r.body.checkoutUrl, /^https:\/\//);
  const ref = r.body.payment.reference;
  assert.equal(r.body.payment.status, 'pending');
  const again = await call('POST', '/v1/payments', { token: secretKey, headers: { 'Idempotency-Key': key }, body: { packageId: 'starter', email: 'billing@kojo.example' } });
  assert.equal(again.body.payment.reference, ref, 'same key → same checkout');
  const before = Number(walletOf(kojo.pid).availableUnits);
  const raw = JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: 2000, currency: 'GHS' } });
  await call('POST', '/webhooks/paystack', { raw, headers: { 'x-paystack-signature': createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex') } });
  const status = await call('GET', `/v1/payments/${ref}`, { token: secretKey });
  assert.equal(status.body.payment.status, 'success');
  assert.equal(Number(walletOf(kojo.pid).availableUnits), before + 500);
  const list = await call('GET', '/v1/payments', { token: secretKey });
  assert.ok(list.body.payments.some((p: { reference: string }) => p.reference === ref));
  assertIntegrity();
});

await step('payments: http callback URLs, unknown packages and other tenants are refused', async () => {
  const http = await call('POST', '/v1/payments', { token: secretKey, headers: { 'Idempotency-Key': ikey('pay') }, body: { units: 200, email: 'a@b.co', callbackUrl: 'http://insecure.example' } });
  assert.equal(http.status, 400);
  const otherRef = cloud.list('payments').find((p) => p.data.projectId !== kojo.pid)?.id;
  if (otherRef) assert.equal((await call('GET', `/v1/payments/${otherRef}`, { token: secretKey })).status, 404);
});

await step('publishable keys can’t create payments or schedules', async () => {
  const pub = cloud.list('apiKeys').find((k) => k.data.projectId === kojo.pid);
  void pub;
  const adminTok = await h.token('root', 'root@ops.example');
  const created = await call('POST', `/admin/projects/${kojo.pid}/api-keys/publishable`, {
    token: adminTok,
    body: { name: 'web form', recipientMode: 'any', recipientList: [], rateLimitPerMinute: 5, rateLimitPerHour: 50, rateLimitPerDay: 100, lifetimeUnitCap: 100, expiresAt: null },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const pk = created.body.apiKey?.plaintext ?? created.body.plaintext;
  assert.equal((await call('POST', '/v1/payments', { token: pk, headers: { 'Idempotency-Key': ikey('pay') }, body: { units: 200, email: 'a@b.co' } })).status, 403);
  assert.equal(
    (await call('POST', '/v1/sms/send', { token: pk, headers: { 'Idempotency-Key': ikey() }, body: { senderId: 'KOJOSTORE', message: 'x', recipients: ['0243334445'], scheduleAt: inAMinute() } })).status,
    403,
  );
});

// =====================================================================
section('Monitoring');
// =====================================================================

const rootTok = await h.token('root', 'root@ops.example');

await step('every request is counted by route, status and latency', async () => {
  for (let i = 0; i < 5; i++) await call('GET', '/customer/wallet', { token: ama.token });
  const m = await call('GET', '/admin/monitoring?range=1h', { token: rootTok });
  assert.equal(m.status, 200, JSON.stringify(m.body).slice(0, 200));
  assert.ok(m.body.totals.requests >= 5, `requests ${m.body.totals.requests}`);
  assert.ok(m.body.routes.some((r: { route: string }) => r.route === 'customer/wallet'));
  assert.ok(m.body.totals.p95Ms !== null);
  assert.equal(m.body.series.length, 60);
  assert.ok(m.body.sms.sent > 0, 'SMS delivery counted');
  assert.ok(m.body.sms.providerCalls > 0);
});

await step('bad API keys and failed sign-ins are recorded as security events with the IP', async () => {
  for (let i = 0; i < 3; i++) {
    await call('GET', '/v1/balance', { token: 'pk_live_000000000000000000_garbage', headers: { 'CF-Connecting-IP': '198.51.100.7' } });
  }
  await call('GET', '/customer/me', { token: 'not.a.token', headers: { 'CF-Connecting-IP': '198.51.100.7' } });
  const m = await call('GET', '/admin/monitoring?range=1h', { token: rootTok });
  assert.ok(m.body.security.byType.bad_api_key >= 3, JSON.stringify(m.body.security));
  assert.ok(m.body.security.byType.auth_failed >= 1);
  assert.ok(m.body.security.topIps.some((x: { ip: string; events: number }) => x.ip === '198.51.100.7' && x.events >= 4));
  assert.ok(m.body.events.security.some((e: { type: string; ip: string }) => e.type === 'bad_api_key' && e.ip === '198.51.100.7'));
});

await step('server errors are captured with their request ID', async () => {
  cloud.put('admins/broken', { email: 'broken@ops.example', role: 'not-a-role', status: 'active', createdAt: new Date().toISOString() });
  const r = await call('GET', '/admin/me', { token: await h.token('broken', 'broken@ops.example') });
  assert.equal(r.status, 500);
  const m = await call('GET', '/admin/monitoring?range=1h', { token: rootTok });
  assert.ok(m.body.totals.errors5xx >= 1);
  const ev = m.body.events.errors.find((e: { requestId: string }) => e.requestId === r.body.error.requestId);
  assert.ok(ev, 'the error event carries the same request ID the user saw');
  assert.ok(m.body.routes.find((x: { route: string; errors: number }) => x.route === 'admin/me')!.errors >= 1);
});

await step('browser crashes reported by the apps show up (validated, rate-limited)', async () => {
  const ok = await call('POST', '/monitor/client-error', { body: { app: 'customer', message: 'TypeError: x is undefined', url: '/wallet', stack: 'at Wallet (wallet.tsx:10)' } });
  assert.equal(ok.status, 202);
  assert.equal((await call('POST', '/monitor/client-error', { body: { app: 'hacker', message: 'x' } })).status, 400);
  assert.equal((await call('POST', '/monitor/client-error', { raw: 'x'.repeat(9000) })).status, 413);
  const m = await call('GET', '/admin/monitoring?range=1h', { token: rootTok });
  assert.ok(m.body.totals.clientErrors >= 1);
  assert.ok(m.body.events.client.some((e: { message: string }) => e.message.includes('x is undefined')));
  const statuses: number[] = [];
  for (let i = 0; i < 35; i++) statuses.push((await call('POST', '/monitor/client-error', { body: { app: 'admin', message: 'spam' }, headers: { 'CF-Connecting-IP': '203.0.113.50' } })).status);
  assert.ok(statuses.includes(429), 'reports are rate-limited per IP');
});

await step('monitoring is for admins only', async () => {
  const viewer = await h.seedAdmin('mon_viewer', 'viewer');
  assert.equal((await call('GET', '/admin/monitoring', { token: viewer })).status, 403);
  assert.equal((await call('GET', '/admin/monitoring', { token: ama.token })).status, 403);
});

await step('an error spike raises a bell alert and emails operators once', async () => {
  await call('PUT', '/admin/settings/notifications', {
    token: rootTok,
    body: { adminAlertEmails: ['ops@example.com'], emailOnSenderIdRequest: false, emailOnNewCustomer: false, emailOnPaymentReceived: false, emailOnProviderLowBalance: false, emailOnIncidents: true, providerLowBalanceCredits: null },
  });
  h.reset();
  const { minuteKey } = await import('../src/lib/monitor');
  const key = minuteKey(new Date());
  cloud.put(`metricsMinute/${key}`, { ...(cloud.get(`metricsMinute/${key}`) ?? {}), req: 100, e5: 30 });
  const alerts = await call('GET', '/admin/alerts', { token: rootTok });
  assert.ok(alerts.body.alerts.some((a: { type: string }) => a.type === 'error_spike'), JSON.stringify(alerts.body.alerts.map((a: { type: string }) => a.type)));
  const { checkIncidents } = await import('../src/services/monitoring');
  const before = cloud.emails.length;
  await checkIncidents(h.env);
  await checkIncidents(h.env);
  const sent = cloud.emails.slice(before).filter((e) => e.subject.includes('Server errors'));
  assert.equal(sent.length, 1, 'once per hour, not every check');
});

await step('everything above left every wallet consistent with its ledger', async () => {
  assertIntegrity();
});

finish('Features suite');
