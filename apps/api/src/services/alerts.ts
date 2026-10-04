import { detectIncidents } from './monitoring';
import type { AdminAlert } from '@profjero/shared';
import { firestoreQuery } from '../lib/firestore';
import { listPendingAssignments, listSenderIds } from '../repositories/senderIds';
import { listAllWallets } from '../repositories/wallets';
import { listProjects } from '../repositories/projects';
import { listProviderRecords } from '../repositories/providers';
import { getSettings } from './settings';
import { getJobRuns } from './systemStatus';
import type { Env } from '../types/env';

/**
 * The admin bell. Alerts are computed from live data on each request
 * rather than stored, so they can't go stale or disagree with the pages
 * they link to: an alert disappears as soon as its cause is fixed.
 * "Unread" compares the newest underlying event with the admin's
 * alertsSeenAt.
 */
export async function computeAlerts(env: Env, seenAt: string | null): Promise<AdminAlert[]> {
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [settings, pendingAssign, pendingValues, wallets, projects, providers, failedPayments, unknownRecords, newCustomers, jobs] =
    await Promise.all([
      getSettings(env),
      listPendingAssignments(env),
      listSenderIds(env, 'pending'),
      listAllWallets(env),
      listProjects(env, {}),
      listProviderRecords(env),
      firestoreQuery(env, 'payments', [{ field: 'status', op: 'EQUAL', value: 'failed' }]),
      firestoreQuery(env, 'smsRecords', [{ field: 'status', op: 'EQUAL', value: 'unknown' }]),
      firestoreQuery(env, 'customers', [{ field: 'createdAt', op: 'GREATER_THAN_OR_EQUAL', value: weekAgo }]),
      getJobRuns(env),
    ]);

  const names = new Map(projects.map((p) => [p.id, p.name]));
  const alerts: Array<Omit<AdminAlert, 'unread'>> = [];
  const newest = (dates: string[]) => dates.reduce((a, b) => (b > a ? b : a), '');
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // Sender ID requests awaiting a decision (value-level or assignment-level).
  const requests = new Map<string, string>();
  for (const a of pendingAssign) requests.set(`${a.projectId}:${a.senderId}`, a.requestedAt);
  for (const v of pendingValues) {
    if (v.requestedByProjectId) requests.set(`${v.requestedByProjectId}:${v.value}`, v.requestedAt);
  }
  if (requests.size > 0) {
    const sample = [...requests.keys()].slice(0, 3).map((k) => {
      const [pid, value] = k.split(':');
      return `${value} (${names.get(pid) ?? 'unknown'})`;
    });
    alerts.push({
      id: 'sender_id_requests',
      type: 'sender_id_requests',
      severity: 'warning',
      title: `${plural(requests.size, 'Sender ID request')} awaiting review`,
      body: `${sample.join(', ')}${requests.size > 3 ? '…' : ''}. Register with the provider, then approve.`,
      link: '/sender-ids',
      count: requests.size,
      latestAt: newest([...requests.values()]),
    });
  }

  const low = wallets.filter((w) => w.lowBalanceThreshold !== null && w.availableUnits < w.lowBalanceThreshold);
  if (low.length > 0) {
    alerts.push({
      id: 'low_balance_wallets',
      type: 'low_balance_wallets',
      severity: 'warning',
      title: `${plural(low.length, 'project')} below low-balance threshold`,
      body: low.slice(0, 3).map((w) => `${names.get(w.projectId) ?? w.projectId}: ${w.availableUnits.toLocaleString('en-US')} units`).join(', '),
      link: '/wallets',
      count: low.length,
      latestAt: newest(low.map((w) => w.updatedAt)),
    });
  }

  for (const p of providers) {
    if (p.status === 'error') {
      alerts.push({
        id: `provider_error_${p.id}`,
        type: 'provider_error',
        severity: 'error',
        title: `Provider ${p.id} is in an error state`,
        body: 'Check its recent requests and credentials.',
        link: `/providers/${p.id}`,
        count: 1,
        latestAt: p.updatedAt,
      });
    }
    const limit = settings.notifications.providerLowBalanceCredits;
    if (limit !== null && p.credits !== null && p.credits < limit) {
      alerts.push({
        id: `provider_balance_${p.id}`,
        type: 'provider_balance',
        severity: 'error',
        title: `Provider ${p.id} credits are low`,
        body: `${p.credits.toLocaleString('en-US')} credits left (alert level ${limit.toLocaleString('en-US')}). Top up with the provider to avoid failed sends.`,
        link: `/providers/${p.id}`,
        count: 1,
        latestAt: p.balanceCheckedAt ?? p.updatedAt,
      });
    }
  }

  const recentFailed = failedPayments.filter((d) => String(d.data.createdAt) >= weekAgo);
  if (recentFailed.length > 0) {
    alerts.push({
      id: 'failed_payments',
      type: 'failed_payments',
      severity: 'warning',
      title: `${plural(recentFailed.length, 'failed payment')} in the last 7 days`,
      body: 'Review whether customers need help completing payment.',
      link: '/payments',
      count: recentFailed.length,
      latestAt: newest(recentFailed.map((d) => String(d.data.createdAt))),
    });
  }

  const stuckCutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  const stuck = unknownRecords.filter((d) => String(d.data.updatedAt) < stuckCutoff);
  if (stuck.length > 0) {
    alerts.push({
      id: 'stuck_messages',
      type: 'stuck_messages',
      severity: 'error',
      title: `${plural(stuck.length, 'message')} stuck in "unknown" for over an hour`,
      body: 'Units stay reserved until these resolve. Run reconciliation from Settings → System.',
      link: '/settings?tab=system',
      count: stuck.length,
      latestAt: newest(stuck.map((d) => String(d.data.updatedAt))),
    });
  }

  if (newCustomers.length > 0) {
    alerts.push({
      id: 'new_customers',
      type: 'new_customers',
      severity: 'info',
      title: `${plural(newCustomers.length, 'new customer')} this week`,
      body: newCustomers.slice(0, 3).map((d) => String(d.data.organisationName ?? d.data.email)).join(', '),
      link: '/projects',
      count: newCustomers.length,
      latestAt: newest(newCustomers.map((d) => String(d.data.createdAt))),
    });
  }

  // Production runs reconciliation every 15 minutes.
  if (env.ENVIRONMENT === 'production') {
    const last = jobs.reconciliation?.lastRunAt ?? null;
    if (!last || Date.now() - new Date(last).getTime() > 45 * 60_000) {
      alerts.push({
        id: 'cron_stale',
        type: 'cron_stale',
        severity: 'error',
        title: 'Background reconciliation has not run recently',
        body: last ? `Last run ${last}. Check the Worker's cron triggers.` : 'No run recorded yet.',
        link: '/settings?tab=system',
        count: 1,
        latestAt: last ?? new Date().toISOString(),
      });
    }
    // The per-minute dispatcher sends scheduled campaigns and resumes deliveries.
    const lastDispatch = jobs.dispatcher?.lastRunAt ?? null;
    if (!lastDispatch || Date.now() - new Date(lastDispatch).getTime() > 5 * 60_000) {
      alerts.push({
        id: 'cron_stale_dispatcher',
        type: 'cron_stale',
        severity: 'error',
        title: 'Scheduled sending has stopped',
        body: lastDispatch
          ? `The per-minute dispatcher last ran ${lastDispatch}. Scheduled campaigns and large sends are waiting. Check the Worker's "* * * * *" cron trigger.`
          : 'The per-minute dispatcher has not run yet. Add the "* * * * *" cron trigger and redeploy.',
        link: '/monitoring',
        count: 1,
        latestAt: lastDispatch ?? new Date().toISOString(),
      });
    }
  }

  // Live incidents from Monitoring (last 15 minutes).
  for (const i of await detectIncidents(env).catch(() => [])) {
    alerts.push({
      id: i.type,
      type: i.type,
      severity: i.severity,
      title: i.title,
      body: i.body,
      link: '/monitoring',
      count: 1,
      latestAt: i.latestAt,
    });
  }

  const rank = { error: 0, warning: 1, info: 2 } as const;
  return alerts
    .map((a) => ({ ...a, unread: !seenAt || a.latestAt > seenAt }))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.latestAt.localeCompare(a.latestAt));
}
