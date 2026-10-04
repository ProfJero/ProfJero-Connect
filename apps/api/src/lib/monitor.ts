import type { Context } from 'hono';
import { firestoreCreateDoc, firestoreIncrement } from './firestore';
import type { Env } from '../types/env';

/**
 * Real-time monitoring, cheap enough to run on every request.
 *
 * Counters (requests, errors, latency histogram, per-route, security
 * events, offending IPs, SMS delivery, provider calls) accumulate in this
 * Worker isolate and are flushed about every 10 s as server-side
 * increments into two documents: metricsMinute/{YYYYMMDDHHmm} (kept 2 days)
 * and metricsHour/{YYYYMMDDHH} (kept 90 days). One small commit per flush,
 * however many requests — no write per request, no lost counts.
 *
 * Notable events (server errors, security events, browser errors) are
 * stored individually in monitorEvents, sampled per isolate so an attack
 * can't flood the database.
 *
 * Set a Firestore TTL policy on `expiresAt` for metricsMinute, metricsHour
 * and monitorEvents to have old data deleted automatically.
 */

const FLUSH_MS = 10_000;
const FLUSH_COUNT = 300;
const MAX_IPS = 40;
const EVENTS_PER_TYPE_PER_MIN = 20;

type Counters = Map<string, number>;

interface Buffer {
  minute: Map<string, Counters>; // minute key → counters
  pending: number;
  lastFlush: number;
}

const buffer: Buffer = { minute: new Map(), pending: 0, lastFlush: Date.now() };
const eventBudget = new Map<string, { minute: number; used: number }>();

const pad = (n: number) => String(n).padStart(2, '0');
export const minuteKey = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
export const hourKey = (d: Date) => minuteKey(d).slice(0, 10);

/** Field-name-safe token. */
const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'root';

/** Add to counters for the current minute. */
export function count(increments: Record<string, number>, at = new Date()): void {
  const key = minuteKey(at);
  let c = buffer.minute.get(key);
  if (!c) buffer.minute.set(key, (c = new Map()));
  for (const [k, v] of Object.entries(increments)) {
    if (!v) continue;
    if (k.startsWith('ip_') && !c.has(k) && [...c.keys()].filter((x) => x.startsWith('ip_')).length >= MAX_IPS) continue;
    c.set(k, (c.get(k) ?? 0) + v);
  }
  buffer.pending += 1;
}

const LATENCY_BUCKETS = [50, 100, 250, 500, 1000, 2500];
export const LATENCY_FIELDS = [...LATENCY_BUCKETS.map((b) => `lat_${b}`), 'lat_inf'];

/** Route group for metrics: first two path segments, ids dropped. */
export function routeGroup(path: string): string {
  const parts = path.split('/').filter(Boolean).slice(0, 2);
  return parts.length ? parts.map(safe).join('__') : 'root';
}

export type SecurityType = 'auth_failed' | 'bad_api_key' | 'forbidden' | 'rate_limited' | 'webhook_rejected';

function securityTypeFor(status: number, path: string): SecurityType | null {
  if (status === 429) return 'rate_limited';
  if (status === 403) return 'forbidden';
  if (status === 401) {
    if (path.startsWith('/v1')) return 'bad_api_key';
    if (path.startsWith('/webhooks')) return 'webhook_rejected';
    return 'auth_failed';
  }
  return null;
}

export const clientIp = (c: Context) =>
  c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'unknown';

/** Record one finished API request (called by the middleware). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recordRequest(c: Context<any>, ms: number): void {
  const path = c.req.path;
  const status = c.res.status;
  const group = routeGroup(path);
  const inc: Record<string, number> = {
    req: 1,
    ms: Math.round(ms),
    [`r_${group}_req`]: 1,
    [`r_${group}_ms`]: Math.round(ms),
  };
  if (status >= 500) {
    inc.e5 = 1;
    inc[`r_${group}_e5`] = 1;
  } else if (status >= 400) inc.e4 = 1;
  const bucket = LATENCY_BUCKETS.find((b) => ms <= b);
  inc[bucket ? `lat_${bucket}` : 'lat_inf'] = 1;

  const sec = securityTypeFor(status, path);
  if (sec) {
    const ip = clientIp(c);
    inc[`sec_${sec}`] = 1;
    inc[`ip_${safe(ip)}`] = 1;
    recordEvent(c.env, c, {
      kind: 'security',
      type: sec,
      message: `${status} ${c.req.method} ${path}`,
      status,
      ip,
    });
  }
  count(inc);
  maybeFlush(c);
}

export interface MonitorEvent {
  kind: 'error' | 'security' | 'client_error';
  type: string;
  message: string;
  status?: number;
  ip?: string;
  detail?: Record<string, unknown> | null;
}

/** Store one event (sampled: ≤20 per type per minute per isolate). */
export function recordEvent(env: Env, c: Context | null, e: MonitorEvent): void {
  const minute = Math.floor(Date.now() / 60_000);
  const key = `${e.kind}:${e.type}`;
  const b = eventBudget.get(key);
  if (!b || b.minute !== minute) eventBudget.set(key, { minute, used: 0 });
  const budget = eventBudget.get(key)!;
  if (budget.used >= EVENTS_PER_TYPE_PER_MIN) return;
  budget.used += 1;

  const now = new Date();
  const doc = {
    kind: e.kind,
    type: e.type,
    message: e.message.slice(0, 500),
    status: e.status ?? null,
    ip: e.ip ?? (c ? clientIp(c) : null),
    method: c?.req.method ?? null,
    path: c?.req.path ?? null,
    requestId: (c?.get('requestId') as string | undefined) ?? null,
    userAgent: c?.req.header('User-Agent')?.slice(0, 200) ?? null,
    detail: e.detail ?? null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
  };
  const work = firestoreCreateDoc(env, 'monitorEvents', doc).catch((err) =>
    console.error('[monitor] could not store event:', err),
  );
  background(c, work);
}

/** A 5xx: count it and keep the details for the Errors tab. */
export function recordServerError(c: Context, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  recordEvent(c.env as Env, c, {
    kind: 'error',
    type: e.name || 'Error',
    message: e.message || 'Unknown error',
    status: 500,
    detail: { stack: (e.stack ?? '').split('\n').slice(0, 6).join('\n') },
  });
}

function background(c: Context | null, work: Promise<unknown>) {
  try {
    if (c) c.executionCtx.waitUntil(work);
  } catch {
    /* no execution context (cron/tests): the promise still runs */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maybeFlush(c: Context<any>) {
  if (buffer.pending >= FLUSH_COUNT || Date.now() - buffer.lastFlush >= FLUSH_MS) {
    background(c, flushMetrics(c.env));
  }
}

/** Write buffered counters. Safe to call any time (no-op when empty). */
export async function flushMetrics(env: Env): Promise<void> {
  if (buffer.minute.size === 0) return;
  const minutes = buffer.minute;
  buffer.minute = new Map();
  buffer.pending = 0;
  buffer.lastFlush = Date.now();

  const docs: Array<{ path: string; increments: Record<string, number>; set: Record<string, unknown> }> = [];
  const hours = new Map<string, Counters>();
  for (const [mk, counters] of minutes) {
    const t = new Date(Date.UTC(+mk.slice(0, 4), +mk.slice(4, 6) - 1, +mk.slice(6, 8), +mk.slice(8, 10), +mk.slice(10, 12)));
    docs.push({
      path: `metricsMinute/${mk}`,
      increments: Object.fromEntries(counters),
      set: { t: t.toISOString(), expiresAt: new Date(t.getTime() + 2 * 86_400_000).toISOString() },
    });
    const hk = mk.slice(0, 10);
    let h = hours.get(hk);
    if (!h) hours.set(hk, (h = new Map()));
    for (const [k, v] of counters) h.set(k, (h.get(k) ?? 0) + v);
  }
  for (const [hk, counters] of hours) {
    const t = new Date(Date.UTC(+hk.slice(0, 4), +hk.slice(4, 6) - 1, +hk.slice(6, 8), +hk.slice(8, 10)));
    docs.push({
      path: `metricsHour/${hk}`,
      increments: Object.fromEntries(counters),
      set: { t: t.toISOString(), expiresAt: new Date(t.getTime() + 90 * 86_400_000).toISOString() },
    });
  }
  try {
    await firestoreIncrement(env, docs);
  } catch (err) {
    // Monitoring must never break the API. Put the counts back for the next flush.
    console.error('[monitor] flush failed:', err);
    for (const [mk, counters] of minutes) {
      const cur = buffer.minute.get(mk) ?? new Map();
      for (const [k, v] of counters) cur.set(k, (cur.get(k) ?? 0) + v);
      buffer.minute.set(mk, cur);
    }
  }
}

/** Tests only. */
export function resetMonitor(): void {
  buffer.minute = new Map();
  buffer.pending = 0;
  eventBudget.clear();
}
