import { Hono } from 'hono';
import { listBatchesSince } from '../../repositories/sms';
import { listOrdersSince } from '../../repositories/dataOrders';
import { listAssignmentsForProject } from '../../repositories/senderIds';
import { getWalletForProject } from '../../repositories/wallets';
import { listProjectPayments } from '../../services/topups';
import type { AuthVariables, Env } from '../../types/env';

/**
 * GET /customer/overview?days=30
 *
 * Everything happening on the account, across services, in one request
 * for the dashboard: money spent per service, usage, a per-day series,
 * a mixed activity feed and things that need the customer's attention.
 *
 * Read cost is bounded by the window: batches and data orders since the
 * start date (indexed), the project's payments, its Sender IDs and the
 * wallet. New services add a block here and to `series`.
 */
const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const round2 = (n: number) => Math.round(n * 100) / 100;

router.get('/overview', async (c) => {
  const projectId = c.get('projectId')!;
  const days = [7, 30, 90].includes(Number(c.req.query('days'))) ? Number(c.req.query('days')) : 30;
  const start = new Date(Date.now() - (days - 1) * 86400_000);
  start.setUTCHours(0, 0, 0, 0);
  const since = start.toISOString();

  const [batchesAll, orders, payments, assignments, wallet] = await Promise.all([
    listBatchesSince(c.env, projectId, since),
    listOrdersSince(c.env, projectId, since),
    listProjectPayments(c.env, projectId),
    listAssignmentsForProject(c.env, projectId),
    getWalletForProject(c.env, projectId),
  ]);
  const batches = batchesAll.filter((b) => b.status !== 'queued');

  // Per-day buckets.
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400_000).toISOString().slice(0, 10);
    return { date: d, smsGhs: 0, dataGhs: 0, messages: 0, dataOrders: 0 };
  });
  const bucket = (iso: string | null | undefined) => (iso ? series.find((s) => s.date === iso.slice(0, 10)) : undefined);

  // SMS: usage from batches, money from paid top-ups in the window.
  let messages = 0;
  let unitsUsed = 0;
  let delivered = 0;
  for (const b of batches) {
    messages += b.totalRecipients;
    unitsUsed += b.totalUnitsCharged;
    delivered += b.deliveredCount;
    const s = bucket(b.createdAt);
    if (s) s.messages += b.totalRecipients;
  }
  const topups = payments.payments.filter((p) => p.status === 'success' && (p.paidAt ?? p.createdAt) >= since);
  let smsSpent = 0;
  for (const p of topups) {
    smsSpent += p.amountGhs;
    const s = bucket(p.paidAt ?? p.createdAt);
    if (s) s.smsGhs += p.amountGhs;
  }

  // Data: paid orders that weren't refunded count as spend.
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' && o.orderStatus !== 'refunded');
  let dataSpent = 0;
  for (const o of paidOrders) {
    const amount = (o.amountPesewas ?? Math.round(o.sellPriceGhs * 100)) / 100;
    dataSpent += amount;
    const s = bucket(o.paymentConfirmedAt ?? o.createdAt);
    if (s) {
      s.dataGhs += amount;
      s.dataOrders += 1;
    }
  }
  const dataDelivered = orders.filter((o) => o.orderStatus === 'delivered');
  const inProgress = orders.filter((o) => o.paymentStatus === 'paid' && (o.orderStatus === 'payment_confirmed' || o.orderStatus === 'processing'));
  const dataGb = dataDelivered.reduce((sum, o) => {
    const m = o.size.replace(/\s/g, '').match(/^([\d.]+)(GB|MB)$/i);
    return sum + (m ? (m[2].toUpperCase() === 'MB' ? parseFloat(m[1]) / 1000 : parseFloat(m[1])) : 0);
  }, 0);

  // Mixed activity feed (newest first).
  type Activity = { id: string; service: 'sms' | 'data' | 'billing'; title: string; detail: string; amountGhs: number | null; status: 'success' | 'warning' | 'error' | 'info'; at: string; link: string };
  const activity: Activity[] = [
    ...batches.slice(0, 10).map<Activity>((b) => ({
      id: `sms_${b.id}`,
      service: 'sms',
      title: `SMS to ${b.totalRecipients.toLocaleString('en-US')} recipient${b.totalRecipients === 1 ? '' : 's'}`,
      detail: `${b.senderId ?? ''}${b.senderId ? ' · ' : ''}${b.message.length > 60 ? `${b.message.slice(0, 57)}…` : b.message}`,
      amountGhs: null,
      status: b.status === 'failed' ? 'error' : b.status === 'partial' ? 'warning' : b.status === 'submitting' ? 'info' : 'success',
      at: b.createdAt,
      link: `/messaging/history/${b.id}`,
    })),
    ...orders.filter((o) => o.paymentStatus === 'paid').slice(0, 10).map<Activity>((o) => ({
      id: `data_${o.id}`,
      service: 'data',
      title: `${o.network} ${o.size} data`,
      detail: `to 0${o.recipientNumber.slice(3)}`,
      amountGhs: (o.amountPesewas ?? Math.round(o.sellPriceGhs * 100)) / 100,
      status: o.orderStatus === 'delivered' ? 'success' : o.orderStatus === 'refunded' || o.orderStatus === 'failed' ? 'error' : 'info',
      at: o.paymentConfirmedAt ?? o.createdAt,
      link: `/services/data/orders/${o.id}`,
    })),
    ...topups.slice(0, 10).map<Activity>((p) => ({
      id: `pay_${p.reference}`,
      service: 'billing',
      title: `${p.units.toLocaleString('en-US')} SMS units bought`,
      detail: 'Wallet top-up',
      amountGhs: p.amountGhs,
      status: 'success',
      at: p.paidAt ?? p.createdAt,
      link: '/transactions',
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  // Things to act on.
  const attention: Array<{ id: string; tone: 'warning' | 'info' | 'error'; text: string; link: string; action: string }> = [];
  const available = wallet?.availableUnits ?? 0;
  if (wallet && wallet.lowBalanceThreshold !== null && available < wallet.lowBalanceThreshold) {
    attention.push({ id: 'low_sms', tone: 'warning', text: `Your SMS balance is low (${available.toLocaleString('en-US')} units).`, link: '/wallet/add-funds', action: 'Top up' });
  }
  const approved = assignments.filter((a) => a.status === 'approved');
  const inReview = assignments.filter((a) => a.status === 'pending');
  if (approved.length === 0 && inReview.length === 0) {
    attention.push({ id: 'no_sender', tone: 'info', text: 'Request a Sender ID so your messages show your business name.', link: '/messaging/sender-ids/request', action: 'Request' });
  }
  if (inReview.length > 0) {
    attention.push({ id: 'sender_review', tone: 'info', text: `${inReview.length} Sender ID${inReview.length === 1 ? ' is' : 's are'} being reviewed by our team.`, link: '/messaging/sender-ids', action: 'View' });
  }
  const notSent = approved.filter((a) => (a.providerStatus ?? 'not_sent') === 'not_sent');
  if (notSent.length > 0) {
    attention.push({ id: 'sender_first_send', tone: 'info', text: `Send a first message from ${notSent.map((a) => `"${a.senderId}"`).slice(0, 2).join(', ')} so our provider can verify it.`, link: '/messaging/sms', action: 'Send' });
  }
  if (inProgress.length > 0) {
    attention.push({ id: 'data_sending', tone: 'info', text: `${inProgress.length} data order${inProgress.length === 1 ? ' is' : 's are'} on the way.`, link: '/services/data/orders', action: 'Track' });
  }

  return c.json({
    days,
    since,
    totals: {
      spentGhs: round2(smsSpent + dataSpent),
      activeServices: (messages > 0 ? 1 : 0) + (paidOrders.length > 0 ? 1 : 0),
    },
    services: {
      sms: { spentGhs: round2(smsSpent), messages, unitsUsed, delivered, batches: batches.length, balanceUnits: available },
      data: {
        spentGhs: round2(dataSpent),
        orders: paidOrders.length,
        delivered: dataDelivered.length,
        inProgress: inProgress.length,
        gbDelivered: round2(dataGb),
        numbers: new Set(dataDelivered.map((o) => o.recipientNumber)).size,
      },
    },
    series: series.map((s) => ({ ...s, smsGhs: round2(s.smsGhs), dataGhs: round2(s.dataGhs) })),
    activity,
    attention,
  });
});

export { router as customerOverviewRouter };
