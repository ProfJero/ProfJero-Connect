import { firestoreBatchGet, firestoreGetDoc, firestoreQuery, firestoreUpdateDoc, type FirestoreDoc } from '../lib/firestore';
import { flushMetrics, hourKey, LATENCY_FIELDS, minuteKey } from '../lib/monitor';
import { getJobRuns } from './systemStatus';
import { notifyAdmins } from './adminNotify';
import type { Env } from '../types/env';

/**
 * Reads the counters written by lib/monitor.ts and turns them into the
 * admin Monitoring page: traffic and error series, latency percentiles,
 * busiest/failing routes, security events and offending IPs, SMS delivery
 * and provider health, plus recent error/security/browser events.
 */

export type MonitoringRange = '1h' | '24h' | '7d';

const SECURITY_TYPES = ['auth_failed', 'bad_api_key', 'forbidden', 'rate_limited', 'webhook_rejected'] as const;

function bucketIds(range: MonitoringRange, now = new Date()): { collection: string; ids: string[]; stepMs: number } {
  if (range === '1h') {
    const ids = Array.from({ length: 60 }, (_, i) => minuteKey(new Date(now.getTime() - (59 - i) * 60_000)));
    return { collection: 'metricsMinute', ids, stepMs: 60_000 };
  }
  const hours = range === '24h' ? 24 : 168;
  const ids = Array.from({ length: hours }, (_, i) => hourKey(new Date(now.getTime() - (hours - 1 - i) * 3_600_000)));
  return { collection: 'metricsHour', ids, stepMs: 3_600_000 };
}

const keyToIso = (k: string) =>
  new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8), +k.slice(8, 10), k.length > 10 ? +k.slice(10, 12) : 0)).toISOString();

const num = (d: Record<string, unknown> | undefined, k: string) => Number(d?.[k] ?? 0);

/** Upper bound (ms) of the bucket holding the given percentile. */
function percentile(hist: number[], p: number): number | null {
  const total = hist.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const bounds = [50, 100, 250, 500, 1000, 2500, 5000];
  let acc = 0;
  for (let i = 0; i < hist.length; i++) {
    acc += hist[i];
    if (acc / total >= p) return bounds[i];
  }
  return bounds[bounds.length - 1];
}

function sumDocs(docs: Array<Record<string, unknown>>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of docs) {
    for (const [k, v] of Object.entries(d)) if (typeof v === 'number') out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export async function getMonitoringReport(env: Env, range: MonitoringRange) {
  // Include this isolate's not-yet-flushed counts.
  await flushMetrics(env);
  const { collection, ids, stepMs } = bucketIds(range);
  const pingStart = Date.now();
  const docs = await firestoreBatchGet(env, collection, ids);
  const dbLatencyMs = Date.now() - pingStart;
  const byId = new Map<string, Record<string, unknown>>(docs.map((d) => [d.id, d.data]));

  const series = ids.map((id) => {
    const d = byId.get(id);
    const req = num(d, 'req');
    const hist = LATENCY_FIELDS.map((f) => num(d, f));
    return {
      t: keyToIso(id),
      requests: req,
      errors5xx: num(d, 'e5'),
      errors4xx: num(d, 'e4'),
      avgMs: req ? Math.round(num(d, 'ms') / req) : null,
      p95Ms: percentile(hist, 0.95),
      security: SECURITY_TYPES.reduce((s, t) => s + num(d, `sec_${t}`), 0),
      smsSent: num(d, 'sms_submitted'),
      smsFailed: num(d, 'sms_failed'),
      clientErrors: num(d, 'client_err'),
    };
  });

  const totals = sumDocs([...byId.values()]);
  const hist = LATENCY_FIELDS.map((f) => totals[f] ?? 0);
  const requests = totals.req ?? 0;

  // Routes: r_<group>_req / _e5 / _ms
  const routeMap = new Map<string, { route: string; requests: number; errors: number; ms: number }>();
  for (const [k, v] of Object.entries(totals)) {
    const m = k.match(/^r_(.+)_(req|e5|ms)$/);
    if (!m) continue;
    const r = routeMap.get(m[1]) ?? { route: m[1], requests: 0, errors: 0, ms: 0 };
    if (m[2] === 'req') r.requests += v;
    else if (m[2] === 'e5') r.errors += v;
    else r.ms += v;
    routeMap.set(m[1], r);
  }
  const routes = [...routeMap.values()]
    .map((r) => ({ route: r.route.replace(/__/g, '/'), requests: r.requests, errors: r.errors, avgMs: r.requests ? Math.round(r.ms / r.requests) : 0 }))
    .sort((a, b) => b.requests - a.requests);

  const topIps = Object.entries(totals)
    .filter(([k]) => k.startsWith('ip_'))
    .map(([k, v]) => ({ ip: k.slice(3).replace(/_/g, '.'), events: v }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);

  const smsSent = totals.sms_submitted ?? 0;
  const smsFailed = totals.sms_failed ?? 0;
  const smsUnknown = totals.sms_unknown ?? 0;
  const provCalls = totals.prov_calls ?? 0;

  // Recent events (newest first), split by kind.
  const events = (await firestoreQuery(env, 'monitorEvents', [], { orderBy: { field: 'createdAt', direction: 'DESCENDING' }, limit: 150 })).map(
    (d: FirestoreDoc) => ({ id: d.id, ...(d.data as Record<string, unknown>) }) as Record<string, unknown> & { id: string; kind: string },
  );
  const since = new Date(Date.now() - ids.length * stepMs).toISOString();
  const inRange = events.filter((e) => String(e.createdAt) >= since);

  const [jobs, submitting, unknownRecs] = await Promise.all([
    getJobRuns(env),
    firestoreQuery(env, 'smsBatches', [{ field: 'status', op: 'EQUAL', value: 'submitting' }]),
    firestoreQuery(env, 'smsRecords', [{ field: 'status', op: 'EQUAL', value: 'unknown' }]),
  ]);
  const oldestSending = submitting.map((d) => String(d.data.createdAt)).sort()[0] ?? null;

  return {
    range,
    generatedAt: new Date().toISOString(),
    health: {
      dbLatencyMs,
      jobs,
      sendingBatches: submitting.length,
      oldestSendingAt: oldestSending,
      unknownMessages: unknownRecs.length,
    },
    totals: {
      requests,
      errors5xx: totals.e5 ?? 0,
      errors4xx: totals.e4 ?? 0,
      errorRate: requests ? (totals.e5 ?? 0) / requests : 0,
      avgMs: requests ? Math.round((totals.ms ?? 0) / requests) : null,
      p50Ms: percentile(hist, 0.5),
      p95Ms: percentile(hist, 0.95),
      p99Ms: percentile(hist, 0.99),
      slowRequests: (totals.lat_2500 ?? 0) + (totals.lat_inf ?? 0),
      clientErrors: totals.client_err ?? 0,
    },
    latencyHistogram: LATENCY_FIELDS.map((f, i) => ({ le: ['50ms', '100ms', '250ms', '500ms', '1s', '2.5s', '>2.5s'][i], count: totals[f] ?? 0 })),
    // Busiest routes, plus every route with errors.
    routes: [...routes.slice(0, 40), ...routes.slice(40).filter((r) => r.errors > 0)],
    security: {
      byType: Object.fromEntries(SECURITY_TYPES.map((t) => [t, totals[`sec_${t}`] ?? 0])),
      topIps,
    },
    sms: {
      sent: smsSent,
      failed: smsFailed,
      unknown: smsUnknown,
      successRate: smsSent + smsFailed + smsUnknown ? smsSent / (smsSent + smsFailed + smsUnknown) : null,
      providerCalls: provCalls,
      providerErrors: totals.prov_err ?? 0,
      providerAvgMs: provCalls ? Math.round((totals.prov_ms ?? 0) / provCalls) : null,
    },
    series,
    events: {
      errors: inRange.filter((e) => e.kind === 'error').slice(0, 50),
      security: inRange.filter((e) => e.kind === 'security').slice(0, 50),
      client: inRange.filter((e) => e.kind === 'client_error').slice(0, 50),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Incidents (bell alerts + email)
// ─────────────────────────────────────────────────────────────────────

export interface Incident {
  type: 'error_spike' | 'security_spike' | 'client_errors';
  severity: 'warning' | 'error';
  title: string;
  body: string;
  /** Most recent minute with matching activity. */
  latestAt: string;
}

/** Problems in the last 15 minutes worth interrupting someone for. */
export async function detectIncidents(env: Env): Promise<Incident[]> {
  await flushMetrics(env);
  const now = Date.now();
  const ids = Array.from({ length: 15 }, (_, i) => minuteKey(new Date(now - i * 60_000)));
  const minuteDocs = await firestoreBatchGet(env, 'metricsMinute', ids);
  const t = sumDocs(minuteDocs.map((d) => d.data));
  const lastWith = (fields: string[]) =>
    keyToIso(
      minuteDocs
        .filter((d) => fields.some((f) => num(d.data, f) > 0))
        .map((d) => d.id)
        .sort()
        .pop() ?? minuteKey(new Date(now)),
    );
  const out: Incident[] = [];
  const req = t.req ?? 0;
  const e5 = t.e5 ?? 0;
  if (e5 >= 10 && e5 / Math.max(req, 1) >= 0.05) {
    out.push({
      type: 'error_spike',
      severity: 'error',
      title: `Server errors: ${e5} in the last 15 minutes`,
      body: `${((e5 / Math.max(req, 1)) * 100).toFixed(1)}% of ${req} requests failed with a server error. See Monitoring → Errors.`,
      latestAt: lastWith(['e5']),
    });
  }
  const sec = SECURITY_TYPES.reduce((s, x) => s + (t[`sec_${x}`] ?? 0), 0);
  if (sec >= 100) {
    out.push({
      type: 'security_spike',
      severity: 'warning',
      title: `Possible abuse: ${sec} blocked requests in 15 minutes`,
      body: `Failed sign-ins, bad API keys or rate-limited requests are unusually high (${t.sec_bad_api_key ?? 0} bad API keys, ${t.sec_rate_limited ?? 0} rate-limited, ${t.sec_auth_failed ?? 0} failed sign-ins). See Monitoring → Security.`,
      latestAt: lastWith(SECURITY_TYPES.map((x) => `sec_${x}`)),
    });
  }
  if ((t.client_err ?? 0) >= 20) {
    out.push({
      type: 'client_errors',
      severity: 'warning',
      title: `${t.client_err} app crashes reported in 15 minutes`,
      body: 'Users are hitting errors in the admin or customer app. See Monitoring → Errors.',
      latestAt: lastWith(['client_err']),
    });
  }
  return out;
}

/** Every 15 minutes: email operators about new incidents (once per hour each). */
export async function checkIncidents(env: Env): Promise<void> {
  try {
    const incidents = await detectIncidents(env);
    if (incidents.length === 0) return;
    const state = (await firestoreGetDoc(env, 'systemStatus', 'incidents'))?.data ?? {};
    const updates: Record<string, string> = {};
    for (const i of incidents) {
      const last = state[i.type] as string | undefined;
      if (last && Date.now() - new Date(last).getTime() < 3_600_000) continue;
      await notifyAdmins(env, 'emailOnIncidents', i.title, `${i.body}\n\nOpen the admin dashboard → Monitoring for details.`);
      updates[i.type] = new Date().toISOString();
    }
    if (Object.keys(updates).length) await firestoreUpdateDoc(env, 'systemStatus', 'incidents', updates);
  } catch (err) {
    console.error('[monitoring] incident check failed:', err);
  }
}
