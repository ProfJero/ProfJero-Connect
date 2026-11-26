/**
 * Data bundle suite: catalogue, checkout, payment confirmation (webhook and
 * return page), delivery, status polling, refunds, operator actions,
 * tenant isolation and no provider leaks.
 *
 *   npm run test:data --workspace=@profjero/api
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { detectGhanaNetwork, canonicalNetwork } from '@profjero/shared';
import { reconcileDataOrders, mapProviderStatus } from '../src/services/dataOrders';
import { dataProfit, gatewayAmountPesewas } from '@profjero/shared';
import { PAYSTACK_SECRET, createHarness, finish, section, step } from './harness';

const WEBHOOK_SECRET = 'whsec_test_123';
const h = await createHarness({ ELITEDATA_WEBHOOK_SECRET: WEBHOOK_SECRET });
const { cloud, call } = h;
await h.seedAdmin('root', 'super_admin');
await h.seedAdmin('viewer', 'viewer');
const root = await h.token('root', 'root@ops.example');
const viewer = await h.token('viewer', 'viewer@ops.example');
await call('PUT', '/admin/settings/security', {
  token: root,
  body: { customerSignupsEnabled: true, customerSendsPerMinute: 600, customerRequestsPerMinute: 6000 },
});
h.reset();

let seq = 0;
const ikey = () => `data-${Date.now()}-${++seq}-xxxx`;
/** Gateway webhook; by default for exactly what the checkout was initialised with. */
const paidWebhook = (reference: string, amount: number = cloud.gatewayAmounts.get(reference) ?? 0, event = 'charge.success') => {
  const raw = JSON.stringify({ event, data: { reference, amount, currency: 'GHS', status: event === 'charge.success' ? 'success' : 'failed' } });
  return call('POST', '/webhooks/paystack', { raw, headers: { 'x-paystack-signature': createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex') } });
};

const esi = await h.signUp('esi', 'esi@example.com', 'Esi Ventures');
const kojo = await h.signUp('kojo', 'kojo@example.com', 'Kojo Stores');

async function buy(token: string, bundleId = 'mtn_1gb', recipientNumber = '0241234567') {
  const r = await call('POST', '/customer/data/orders', { token, headers: { 'Idempotency-Key': ikey() }, body: { bundleId, recipientNumber } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body as { order: { id: string; amountGhs: number }; checkoutUrl: string };
}

// =====================================================================
section('Network detection');
// =====================================================================

await step('Ghana numbers map to their network in any format; ported/unknown → null', async () => {
  assert.equal(detectGhanaNetwork('0241234567'), 'MTN');
  assert.equal(detectGhanaNetwork('+233 55 123 4567'), 'MTN');
  assert.equal(detectGhanaNetwork('233201234567'), 'Telecel');
  assert.equal(detectGhanaNetwork('0501234567'), 'Telecel');
  assert.equal(detectGhanaNetwork('0271234567'), 'AirtelTigo');
  assert.equal(detectGhanaNetwork('0571234567'), 'AirtelTigo');
  assert.equal(detectGhanaNetwork('0311234567'), null);
  assert.equal(detectGhanaNetwork('12345'), null);
  assert.equal(canonicalNetwork('Vodafone'), 'Telecel');
  assert.equal(canonicalNetwork('AT iShare'), 'AirtelTigo');
  assert.equal(mapProviderStatus('Completed'), 'delivered');
  assert.equal(mapProviderStatus('FAILED'), 'failed');
  assert.equal(mapProviderStatus('pending'), 'processing');
});

// =====================================================================
section('Catalogue');
// =====================================================================

await step('admin sync imports bundles hidden; customers see only what the operator puts on sale', async () => {
  const sync = await call('POST', '/admin/providers/data/sync', { token: root, body: {} });
  assert.equal(sync.status, 200, JSON.stringify(sync.body));
  let cat = await call('GET', '/customer/data/bundles', { token: esi });
  assert.equal(cat.body.bundles.length, 0, 'new bundles start hidden');
  for (const id of ['mtn_1gb', 'mtn_5gb', 'tel_2gb']) {
    await call('PUT', `/admin/providers/data/bundles/${id}/availability`, { token: root, body: { available: true } });
  }
  cat = await call('GET', '/customer/data/bundles', { token: esi });
  assert.equal(cat.status, 200);
  assert.deepEqual(cat.body.bundles.map((b: { id: string }) => b.id).sort(), ['mtn_1gb', 'mtn_5gb', 'tel_2gb']);
  assert.deepEqual(cat.body.networks.sort(), ['MTN', 'Telecel']);
  const raw = JSON.stringify(cat.body);
  assert.ok(!/providerCost|markup|elitedata/i.test(raw), 'no cost or provider name leaks');
  // The bundle list reports the provider's retail price (4.70); we pay
  // the published API price (4.10) and add the 10% default markup
  // (4.51, rounded up to the next 10 pesewas).
  assert.equal(cat.body.bundles.find((b: { id: string }) => b.id === 'mtn_1gb').sellPriceGhs, 4.6);
  const stored = cloud.get('dataBundles/mtn_1gb')!;
  assert.equal(stored.providerCostGhs, 4.1);
  assert.equal(stored.providerListedPriceGhs, 4.7);
  assert.equal(stored.guestPriceGhs, 4.7);
  assert.equal(cloud.get('dataBundles/tel_2gb')!.providerCostGhs, 8, 'unlisted bundles use the API price');
});

await step('a sync keeps the admin\'s prices and markup; a cost change re-prices with the bundle\'s own markup', async () => {
  await call('PATCH', '/admin/providers/data/bundles/tel_2gb', { token: root, body: { sellPriceGhs: 8.5 } });
  await call('POST', '/admin/providers/data/sync', { token: root, body: {} });
  assert.equal(cloud.get('dataBundles/tel_2gb')!.sellPriceGhs, 8.5, 'edited price kept');
  // Global markup applies to everything and is remembered for new bundles.
  const m = await call('PUT', '/admin/providers/data/markup', { token: root, body: { markupPercent: 15 } });
  assert.equal(m.status, 200, JSON.stringify(m.body));
  assert.equal(cloud.get('dataBundles/mtn_1gb')!.sellPriceGhs, 4.8);
  const list = await call('GET', '/admin/providers/data/bundles', { token: root });
  assert.equal(list.body.markupPercent, 15);
  cloud.dataProvider.bundles.push({ bundleId: 'mtn_10gb', network: 'MTN', size: '10GB', price: 47, label: 'MTN 10GB Data' });
  await call('POST', '/admin/providers/data/sync', { token: root, body: {} });
  assert.equal(cloud.get('dataBundles/mtn_10gb')!.providerCostGhs, 41);
  assert.equal(cloud.get('dataBundles/mtn_10gb')!.sellPriceGhs, 47.2, 'new bundle uses the saved markup');
  // Back to the 10% the rest of this suite expects.
  await call('PUT', '/admin/providers/data/markup', { token: root, body: { markupPercent: 10 } });
  await call('PATCH', '/admin/providers/data/bundles/tel_2gb', { token: root, body: { sellPriceGhs: 8.8 } });
  cloud.dataProvider.bundles.pop();
  assert.equal(cloud.get('dataBundles/mtn_1gb')!.sellPriceGhs, 4.6);
});

await step('the data provider appears on the Providers page with its wallet balance', async () => {
  const list = await call('GET', '/admin/providers', { token: root });
  const dp = list.body.providers.find((p: { id: string }) => p.id === 'data_gw_01');
  assert.ok(dp, JSON.stringify(list.body));
  assert.equal(dp.service, 'data');
  assert.ok(!('driver' in dp), 'driver stays server-side');
  const r = await call('POST', '/admin/providers/data_gw_01/refresh-balance', { token: root, body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.provider.mainBalanceGhs, 500);
});

// =====================================================================
section('Checkout');
// =====================================================================

await step('the customer sees the bundle price; only the gateway charge includes the service charge; a retry reuses it', async () => {
  const key = ikey();
  const body = { bundleId: 'mtn_1gb', recipientNumber: '024 123 4567' };
  const a = await call('POST', '/customer/data/orders', { token: esi, headers: { 'Idempotency-Key': key }, body });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  assert.match(a.body.order.id, /^pjd_[a-f0-9]{24}$/);
  assert.equal(a.body.order.amountGhs, 4.6);
  assert.equal(cloud.gatewayAmounts.get(a.body.order.id), 469, 'GH₵4.60 + 2% = GH₵4.69 at the gateway');
  assert.ok(!/service|charge|469|4\.69/i.test(JSON.stringify(a.body.order)), 'the charge is never shown in our app');
  assert.ok(a.body.accessCode, 'access code for the in-page payment window');
  assert.equal(a.body.order.recipientNumber, '233241234567');
  assert.equal(a.body.order.orderStatus, 'pending_payment');
  assert.ok(a.body.checkoutUrl.endsWith(a.body.order.id));
  const b = await call('POST', '/customer/data/orders', { token: esi, headers: { 'Idempotency-Key': key }, body });
  assert.equal(b.body.order.id, a.body.order.id);
  assert.equal(b.body.checkoutUrl, a.body.checkoutUrl);
  const c = await call('POST', '/customer/data/orders', { token: esi, headers: { 'Idempotency-Key': key }, body: { ...body, bundleId: 'mtn_5gb' } });
  assert.equal(c.status, 409, 'same key, different purchase');
});

await step('hidden bundles, bad numbers and missing keys are refused', async () => {
  const hidden = await call('POST', '/customer/data/orders', { token: esi, headers: { 'Idempotency-Key': ikey() }, body: { bundleId: 'at_3gb', recipientNumber: '0271234567' } });
  assert.equal(hidden.status, 409);
  const bad = await call('POST', '/customer/data/orders', { token: esi, headers: { 'Idempotency-Key': ikey() }, body: { bundleId: 'mtn_1gb', recipientNumber: '+44 20 7946 0958' } });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error.message, /Ghana mobile number/);
  const nokey = await call('POST', '/customer/data/orders', { token: esi, body: { bundleId: 'mtn_1gb', recipientNumber: '0241234567' } });
  assert.equal(nokey.status, 400);
});

await step('nothing is bought before payment; refresh on an unpaid order leaves it pending', async () => {
  const { order } = await buy(esi);
  const r = await call('POST', `/customer/data/orders/${order.id}/refresh`, { token: esi });
  assert.equal(r.body.order.orderStatus, 'pending_payment');
  assert.equal(cloud.dataProvider.purchases.length, 0);
});

// =====================================================================
section('Payment → delivery');
// =====================================================================

await step('payment webhook delivers the bundle once, even when the webhook repeats', async () => {
  cloud.dataProvider.mode = 'delivered';
  const { order } = await buy(esi, 'mtn_1gb', '0551234567');
  const before = cloud.dataProvider.purchases.length;
  const w1 = await paidWebhook(order.id);
  assert.equal(w1.body.orderStatus, 'delivered', JSON.stringify(w1.body));
  await paidWebhook(order.id);
  await call('POST', `/customer/data/orders/${order.id}/refresh`, { token: esi });
  assert.equal(cloud.dataProvider.purchases.length, before + 1, 'bought exactly once');
  const p = cloud.dataProvider.purchases.at(-1)!;
  assert.equal(p.recipientNumber, '0551234567');
  assert.equal(p.clientReference, order.id);
  const got = await call('GET', `/customer/data/orders/${order.id}`, { token: esi });
  assert.equal(got.body.order.orderStatus, 'delivered');
  assert.ok(got.body.order.paidAt && got.body.order.completedAt);
  const notes = cloud.list('notifications').filter((n) => n.id.endsWith(`data_delivered__${order.id}`));
  assert.equal(notes.length, 1);
});

await step('the return page confirms payment itself when the webhook is late', async () => {
  cloud.dataProvider.mode = 'processing';
  const { order } = await buy(esi);
  cloud.gatewayStatus.set(order.id, 'success');
  const r = await call('POST', `/customer/data/orders/${order.id}/refresh`, { token: esi });
  assert.equal(r.body.order.orderStatus, 'processing');
  assert.equal(r.body.order.paymentStatus, 'paid');
  // Provider finishes later; the 15-minute job picks it up.
  const prov = [...cloud.dataProvider.orders.entries()].find(([, o]) => o.clientReference === order.id)!;
  prov[1].status = 'Completed';
  cloud.put(`dataOrders/${order.id}`, { ...cloud.get(`dataOrders/${order.id}`)!, updatedAt: new Date(Date.now() - 10 * 60_000).toISOString() });
  const rec = await reconcileDataOrders(h.env);
  assert.ok(rec.delivered >= 1, JSON.stringify(rec));
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'delivered');
});

await step('a wrong amount is never delivered — it is held for review', async () => {
  const { order } = await buy(esi);
  const before = cloud.dataProvider.purchases.length;
  await paidWebhook(order.id, 100);
  const o = cloud.get(`dataOrders/${order.id}`)!;
  assert.equal(o.needsReview, true);
  assert.notEqual(o.orderStatus, 'delivered');
  assert.equal(cloud.dataProvider.purchases.length, before);
});

await step('a failed charge marks the order unpaid with a clear message', async () => {
  const { order } = await buy(esi);
  await paidWebhook(order.id, undefined, 'charge.failed');
  const got = await call('GET', `/customer/data/orders/${order.id}`, { token: esi });
  assert.equal(got.body.order.paymentStatus, 'failed');
  assert.match(got.body.order.message, /Nothing was charged/);
});

// =====================================================================
section('Failures and refunds');
// =====================================================================

await step('provider rejects the order → full automatic refund, customer told', async () => {
  cloud.dataProvider.mode = 'reject';
  const { order } = await buy(esi);
  const refundsBefore = cloud.refunds.length;
  await paidWebhook(order.id);
  const got = await call('GET', `/customer/data/orders/${order.id}`, { token: esi });
  assert.equal(got.body.order.orderStatus, 'refunded');
  assert.ok(got.body.order.refundedAt);
  assert.match(got.body.order.message, /refunded in full/);
  assert.ok(!/insufficient|wallet balance|elitedata/i.test(JSON.stringify(got.body)), 'provider wording stays internal');
  assert.deepEqual(cloud.refunds.slice(refundsBefore), [order.id]);
});

// New buyers: each account may start 10 checkouts a minute.
const ama = await h.signUp('ama', 'ama@example.com', 'Ama Foods');
const yaw = await h.signUp('yaw', 'yaw@example.com', 'Yaw Electricals');

await step('provider answer lost (503 / network) → held for review, never refunded or re-bought blindly', async () => {
  for (const mode of ['http503', 'network'] as const) {
    cloud.dataProvider.mode = mode;
    const { order } = await buy(ama);
    const refundsBefore = cloud.refunds.length;
    await paidWebhook(order.id);
    const o = cloud.get(`dataOrders/${order.id}`)!;
    assert.equal(o.orderStatus, 'processing', mode);
    assert.equal(o.needsReview, true, mode);
    assert.equal(cloud.refunds.length, refundsBefore, `${mode}: no refund`);
    // A second webhook / refresh must not re-submit.
    cloud.dataProvider.mode = 'delivered';
    const purchases = cloud.dataProvider.purchases.length;
    await paidWebhook(order.id);
    await call('POST', `/customer/data/orders/${order.id}/refresh`, { token: ama });
    assert.equal(cloud.dataProvider.purchases.length, purchases, `${mode}: not re-bought`);
  }
});

await step('admins see orders needing review in the bell and can retry, mark delivered or refund', async () => {
  const alerts = await call('GET', '/admin/alerts', { token: root });
  const a = alerts.body.alerts.find((x: { type: string }) => x.type === 'data_orders_review');
  assert.ok(a, JSON.stringify(alerts.body.alerts.map((x: { type: string }) => x.type)));
  const list = await call('GET', '/admin/providers/data/orders?review=1', { token: root });
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.ok(list.body.orders.length >= 2);
  const [first, second, third] = list.body.orders as Array<{ id: string; projectName: string; marginGhs: number; providerError: string }>;
  assert.ok(['Esi Ventures', 'Ama Foods'].includes(first.projectName), first.projectName);
  assert.ok(first.providerError);

  cloud.dataProvider.mode = 'delivered';
  const retried = await call('POST', `/admin/providers/data/orders/${first.id}/retry`, { token: root, body: {} });
  assert.equal(retried.body.order.orderStatus, 'delivered', JSON.stringify(retried.body));
  const marked = await call('POST', `/admin/providers/data/orders/${second.id}/mark-delivered`, { token: root, body: {} });
  assert.equal(marked.body.order.orderStatus, 'delivered');
  if (third) {
    const refunded = await call('POST', `/admin/providers/data/orders/${third.id}/refund`, { token: root, body: {} });
    assert.equal(refunded.body.order.orderStatus, 'refunded');
  }
  const again = await call('POST', `/admin/providers/data/orders/${first.id}/refund`, { token: root, body: {} });
  assert.equal(again.status, 409, 'a delivered order is not refunded from here');
});

await step('a refund the gateway refuses stays visible for review', async () => {
  cloud.dataProvider.mode = 'reject';
  cloud.refundMode = 'error';
  const { order } = await buy(yaw);
  await paidWebhook(order.id);
  const o = cloud.get(`dataOrders/${order.id}`)!;
  assert.equal(o.orderStatus, 'failed');
  assert.equal(o.needsReview, true);
  const got = await call('GET', `/customer/data/orders/${order.id}`, { token: yaw });
  assert.match(got.body.order.message, /refund is being processed/);
  cloud.refundMode = 'ok';
  const r = await call('POST', `/admin/providers/data/orders/${order.id}/refund`, { token: root, body: {} });
  assert.equal(r.body.order.orderStatus, 'refunded');
});

// =====================================================================
section('Live provider replies and automatic status');
// =====================================================================

const efua = await h.signUp('efua', 'efua@example.com', 'Efua Fashion');
const providerWebhook = (body: unknown, token: string | null = WEBHOOK_SECRET) =>
  call('POST', `/webhooks/elitedata${token === null ? '' : `?token=${encodeURIComponent(token)}`}`, { raw: JSON.stringify(body) });

await step('the live reply (numeric id, missing fields) is accepted: the order is pending, not "outcome unknown"', async () => {
  cloud.dataProvider.mode = 'live';
  const { order } = await buy(efua, 'mtn_1gb', '0241112222');
  await paidWebhook(order.id);
  const o = cloud.get(`dataOrders/${order.id}`)!;
  assert.equal(o.orderStatus, 'processing');
  assert.equal(o.needsReview, false, String(o.providerError));
  assert.equal(o.providerError, null);
  assert.match(String(o.providerOrderId), /^\d+$/, 'numeric id stored as text');
  const got = await call('GET', `/customer/data/orders/${order.id}`, { token: efua });
  assert.equal(got.body.order.paymentStatus, 'paid');
  assert.equal(got.body.order.message, null, 'no alarming message while pending');
});

await step('provider webhook: a delivered event is confirmed with the provider and applied', async () => {
  const { order } = await buy(efua, 'mtn_1gb', '0241113333');
  await paidWebhook(order.id);
  const pid = String(cloud.get(`dataOrders/${order.id}`)!.providerOrderId);
  cloud.dataProvider.orders.get(pid)!.status = 'DELIVERED';
  const w = await providerWebhook({ orderId: Number(pid), apiReference: 'API-XYZ', phone: '0241113333', network: 'MTN', size: '1GB', status: 'DELIVERED', price: 4.1, date: new Date().toISOString() });
  assert.equal(w.status, 200, JSON.stringify(w.body));
  assert.equal(w.body.orderStatus, 'delivered');
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'delivered');
});

await step('provider webhook: forged or unconfirmed failures never trigger a refund', async () => {
  const { order } = await buy(efua, 'mtn_1gb', '0241114444');
  await paidWebhook(order.id);
  const pid = String(cloud.get(`dataOrders/${order.id}`)!.providerOrderId);
  const refundsBefore = cloud.refunds.length;
  assert.equal((await providerWebhook({ orderId: Number(pid), status: 'REJECTED' }, null)).status, 401, 'no token');
  assert.equal((await providerWebhook({ orderId: Number(pid), status: 'REJECTED' }, 'wrong')).status, 401, 'wrong token');
  // Valid token, but the provider's own API still says PROCESSING.
  const w = await providerWebhook({ orderId: Number(pid), status: 'REJECTED' });
  assert.equal(w.status, 200);
  assert.equal(cloud.refunds.length, refundsBefore, 'not refunded on the webhook alone');
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'processing');
  // When the provider confirms, it is refunded automatically.
  cloud.dataProvider.orders.get(pid)!.status = 'REJECTED';
  await providerWebhook({ orderId: Number(pid), status: 'REJECTED' });
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'refunded');
  assert.equal(cloud.refunds.length, refundsBefore + 1);
  const unknown = await providerWebhook({ orderId: 1, status: 'DELIVERED' });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.body.matched, false);
  assert.equal((await call('POST', '/webhooks/elitedata?token=' + WEBHOOK_SECRET, { raw: 'not json' })).status, 400);
});

await step('a lost reply is found on the provider by our reference and cleared automatically (no double purchase)', async () => {
  cloud.dataProvider.mode = 'lostReply';
  const { order } = await buy(efua, 'mtn_1gb', '0241115555');
  await paidWebhook(order.id);
  let o = cloud.get(`dataOrders/${order.id}`)!;
  assert.equal(o.needsReview, true);
  assert.equal(o.providerOrderId, null);
  const purchases = cloud.dataProvider.purchases.length;
  // Retry from admin must not buy again: the provider already has it.
  cloud.dataProvider.mode = 'live';
  const retry = await call('POST', `/admin/providers/data/orders/${order.id}/retry`, { token: root, body: {} });
  assert.equal(retry.status, 409, JSON.stringify(retry.body));
  assert.equal(cloud.dataProvider.purchases.length, purchases, 'not bought twice');
  o = cloud.get(`dataOrders/${order.id}`)!;
  assert.equal(o.needsReview, false, 'cleared once the provider confirmed it has the order');
  assert.ok(o.providerOrderId);
  // The 15-minute job then follows it to delivery.
  cloud.dataProvider.orders.get(String(o.providerOrderId))!.status = 'Delivered';
  cloud.put(`dataOrders/${order.id}`, { ...o, updatedAt: new Date(Date.now() - 10 * 60_000).toISOString() });
  await reconcileDataOrders(h.env);
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'delivered');
});

await step('provider wallet empty (402) → refunded in full and the order says so to admins in plain words', async () => {
  cloud.dataProvider.mode = 'noFunds';
  const { order } = await buy(efua, 'mtn_1gb', '0241116666');
  await paidWebhook(order.id);
  assert.equal(cloud.get(`dataOrders/${order.id}`)!.orderStatus, 'refunded');
  const list = await call('GET', '/admin/providers/data/orders?status=refunded', { token: root });
  const row = list.body.orders.find((x: { id: string }) => x.id === order.id);
  assert.match(row.issue, /wallet too low/i);
  assert.ok(row.issue.length < 100, 'short, readable status');
  cloud.dataProvider.mode = 'processing';
});

// =====================================================================
section('Real profit');
// =====================================================================

await step('profit = price + 2% − 1.98% gateway fee − (API price + 3% top-up fee)', async () => {
  assert.equal(gatewayAmountPesewas(460, 2), 469);
  const p = dataProfit({ priceGhs: 4.6, providerCostGhs: 4.1 });
  assert.equal(p.chargedGhs, 4.69);
  assert.equal(p.gatewayFeeGhs, 0.09);
  assert.equal(p.totalCostGhs, 4.22);
  assert.equal(p.profitGhs, 0.37);
  const list = await call('GET', '/admin/providers/data/bundles', { token: root });
  const b = list.body.bundles.find((x: { id: string }) => x.id === 'mtn_1gb');
  assert.equal(b.profitGhs, 0.37);
  assert.equal(list.body.fees.gatewayFeePercent, 1.98);
  const orders = await call('GET', '/admin/providers/data/orders?status=delivered', { token: root });
  const d = orders.body.orders.find((x: { amountGhs: number; chargedGhs: number }) => x.chargedGhs === 4.69);
  assert.ok(d, 'delivered order with the service charge');
  assert.equal(d.profitGhs, 0.37);
  const cat = await call('GET', '/public/data/bundles', {});
  assert.ok(!/profit|fee|charge|cost/i.test(JSON.stringify(cat.body.bundles)), 'customers never see fees or costs');
});

// =====================================================================
section('Buying without an account');
// =====================================================================

const guestBuy = (body: Record<string, unknown>, key = ikey(), ip = '10.9.0.1') =>
  call('POST', '/public/data/orders', { headers: { 'Idempotency-Key': key, 'CF-Connecting-IP': ip }, body });

await step('a guest can see bundles and buy without signing in; email is optional', async () => {
  cloud.dataProvider.mode = 'live';
  const cat = await call('GET', '/public/data/bundles', {});
  assert.equal(cat.status, 200);
  assert.ok(cat.body.bundles.length >= 3);
  const a = await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0249990001' });
  assert.equal(a.status, 201, JSON.stringify(a.body));
  assert.equal(a.body.order.amountGhs, 4.6);
  assert.equal(cloud.gatewayAmounts.get(a.body.order.id), 469);
  const stored = cloud.get(`dataOrders/${a.body.order.id}`)!;
  assert.equal(stored.guest, true);
  assert.equal(stored.projectId, 'guest');
  assert.equal(stored.customerEmail, null);
  await paidWebhook(a.body.order.id);
  const got = await call('GET', `/public/data/orders/${a.body.order.id}`, {});
  assert.equal(got.status, 200);
  assert.equal(got.body.order.orderStatus, 'processing');
  // With an email, the delivery email goes to it.
  const b = await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0249990002', email: 'Kwame@Example.com' });
  assert.equal(b.status, 201, JSON.stringify(b.body));
  assert.equal(cloud.get(`dataOrders/${b.body.order.id}`)!.customerEmail, 'kwame@example.com');
  await paidWebhook(b.body.order.id);
  const pid = String(cloud.get(`dataOrders/${b.body.order.id}`)!.providerOrderId);
  cloud.dataProvider.orders.get(pid)!.status = 'DELIVERED';
  const r = await call('POST', `/public/data/orders/${b.body.order.id}/refresh`, {});
  assert.equal(r.body.order.orderStatus, 'delivered');
  assert.ok(cloud.emails.some((e) => (Array.isArray(e.to) ? e.to : [e.to]).includes('kwame@example.com') && /delivered/i.test(e.subject)));
  const bad = await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0249990003', email: 'not-an-email' });
  assert.equal(bad.status, 400);
});

await step('guests track orders by order ID or phone number — paid orders only, nothing private', async () => {
  const byPhone = await call('GET', '/public/data/track?q=024%20999%200002', { headers: { 'CF-Connecting-IP': '10.9.0.2' } });
  assert.equal(byPhone.status, 200, JSON.stringify(byPhone.body));
  assert.equal(byPhone.body.orders.length, 1);
  assert.equal(byPhone.body.orders[0].orderStatus, 'delivered');
  const raw = JSON.stringify(byPhone.body);
  assert.ok(!/email|kwame|provider|cost|charge|checkout|accessCode/i.test(raw), raw);
  const id = byPhone.body.orders[0].id;
  const byId = await call('GET', `/public/data/track?q=${id.toUpperCase()}`, { headers: { 'CF-Connecting-IP': '10.9.0.2' } });
  assert.equal(byId.body.orders[0].id, id);
  // An unpaid checkout to a number isn't listed.
  await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0249990004' });
  assert.equal((await call('GET', '/public/data/track?q=0249990004', {})).body.orders.length, 0);
  assert.equal((await call('GET', '/public/data/track?q=hello', {})).status, 400);
  assert.equal((await call('GET', '/public/data/orders/pjd_nothere', {})).status, 404);
  assert.equal((await call('GET', '/public/data/orders/..%2Fcustomers%2Fx', {})).status, 404);
});

await step('guest orders stay out of signed-in accounts; admins see them as Guest', async () => {
  const mine = await call('GET', '/customer/data/orders', { token: efua });
  assert.ok(mine.body.orders.every((o: { recipientNumber: string }) => !o.recipientNumber.startsWith('23324999')));
  const all = await call('GET', '/admin/providers/data/orders', { token: root });
  const g = all.body.orders.find((o: { recipientNumber: string }) => o.recipientNumber === '233249990002');
  assert.equal(g.projectName, 'Guest');
  assert.equal(g.accessCode, undefined, 'checkout secrets are not sent to the admin UI');
});

await step('guest checkouts are rate-limited per device and need an Idempotency-Key', async () => {
  assert.equal((await call('POST', '/public/data/orders', { body: { bundleId: 'mtn_1gb', recipientNumber: '0241234567' } })).status, 400);
  const statuses: number[] = [];
  for (let i = 0; i < 10; i++) statuses.push((await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: `02470000${10 + i}` }, ikey(), '10.9.9.9')).status);
  assert.ok(statuses.includes(429), statuses.join(','));
  // The same key is a replay, not a new checkout.
  const key = ikey();
  const a = await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0247000099' }, key, '10.9.9.10');
  const b = await guestBuy({ bundleId: 'mtn_1gb', recipientNumber: '0247000099' }, key, '10.9.9.10');
  assert.equal(a.body.order.id, b.body.order.id);
  cloud.dataProvider.mode = 'processing';
});

// =====================================================================
section('Access control');
// =====================================================================

await step('customers only see their own orders; viewers cannot act', async () => {
  const mine = await call('GET', '/customer/data/orders', { token: esi });
  assert.ok(mine.body.orders.length > 5);
  const id = mine.body.orders[0].id;
  assert.equal((await call('GET', `/customer/data/orders/${id}`, { token: kojo })).status, 404);
  assert.equal((await call('POST', `/customer/data/orders/${id}/refresh`, { token: kojo })).status, 404);
  assert.equal((await call('GET', '/customer/data/orders', { token: kojo })).body.orders.length, 0);
  assert.equal((await call('GET', '/customer/data/orders/..%2Fwallets%2Fx', { token: esi })).status, 404);
  assert.equal((await call('GET', '/admin/providers/data/orders', { token: viewer })).status, 200);
  assert.equal((await call('POST', `/admin/providers/data/orders/${id}/refund`, { token: viewer, body: {} })).status, 403);
  assert.equal((await call('GET', '/customer/data/orders', {})).status, 401);
});

await step('paused checkout blocks new orders with the operator message', async () => {
  await call('PUT', '/admin/settings/payments', { token: root, body: { customerTopupsEnabled: false, topupsDisabledMessage: 'Back at 6pm.' } });
  const r = await call('POST', '/customer/data/orders', { token: kojo, headers: { 'Idempotency-Key': ikey() }, body: { bundleId: 'mtn_1gb', recipientNumber: '0241234567' } });
  assert.equal(r.status, 503);
  assert.match(r.body.error.message, /Back at 6pm/);
  const cat = await call('GET', '/customer/data/bundles', { token: esi });
  assert.equal(cat.body.checkoutEnabled, false);
  await call('PUT', '/admin/settings/payments', { token: root, body: { customerTopupsEnabled: true, topupsDisabledMessage: null } });
});

await step('the dashboard overview covers every service in one request', async () => {
  const o = await call('GET', '/customer/overview?days=30', { token: esi });
  assert.equal(o.status, 200, JSON.stringify(o.body));
  assert.equal(o.body.series.length, 30);
  assert.ok(o.body.services.data.delivered >= 2);
  assert.ok(o.body.services.data.spentGhs > 0);
  assert.equal(o.body.services.data.spentGhs, o.body.totals.spentGhs, 'no SMS top-ups for this customer');
  assert.ok(o.body.activity.some((a: { service: string }) => a.service === 'data'));
  assert.ok(o.body.series.reduce((s: number, d: { dataGhs: number }) => s + d.dataGhs, 0) > 0);
  assert.ok(!/providerCost|elitedata/i.test(JSON.stringify(o.body)));
  const empty = await call('GET', '/customer/overview?days=7', { token: kojo });
  assert.equal(empty.body.totals.spentGhs, 0);
  assert.equal(empty.body.series.length, 7);
  assert.ok(empty.body.attention.some((a: { id: string }) => a.id === 'no_sender'));
});

finish('Data bundles suite');
