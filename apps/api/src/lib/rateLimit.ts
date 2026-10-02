import { HTTPException } from 'hono/http-exception';
import { runTransaction } from './firestore';
import type { Env } from '../types/env';

/**
 * Two rate-limit tiers:
 *
 * 1. `memoryLimit` — per-isolate sliding window, zero I/O. Used for broad
 *    "requests per minute" protection on every customer call. Cloudflare
 *    runs many isolates, so this caps abuse per isolate rather than
 *    globally; it exists to stop runaway loops cheaply.
 *
 * 2. `durableLimit` — fixed-window counter in Firestore (rateLimits/*),
 *    globally consistent via a transaction. Used where an action costs
 *    money or units: SMS sends, payment initiation, signups, key creation.
 *
 * Both throw HTTP 429 with Retry-After.
 */

const windows = new Map<string, number[]>();

function tooMany(retryAfterSec: number, what: string): never {
  throw new HTTPException(429, {
    message: `Too many ${what}. Try again in ${retryAfterSec}s.`,
    res: new Response(null, { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }),
  });
}

export function memoryLimit(key: string, limit: number, windowSec = 60, what = 'requests'): void {
  const now = Date.now();
  const cutoff = now - windowSec * 1000;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    const retry = Math.max(1, Math.ceil((hits[0] + windowSec * 1000 - now) / 1000));
    windows.set(key, hits);
    tooMany(retry, what);
  }
  hits.push(now);
  windows.set(key, hits);
  // Keep the map from growing without bound in long-lived isolates.
  if (windows.size > 10_000) {
    for (const [k, v] of windows) if (v[v.length - 1] <= cutoff) windows.delete(k);
  }
}

async function hashKey(key: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(d)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function durableLimit(
  env: Env,
  key: string,
  limit: number,
  windowSec = 60,
  what = 'requests',
): Promise<void> {
  const windowStart = Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000;
  const docId = await hashKey(key);
  const blocked = await runTransaction(env, async (txn) => {
    const doc = await txn.get('rateLimits', docId);
    const sameWindow = doc && Number(doc.data.windowStart) === windowStart;
    const count = sameWindow ? Number(doc.data.count ?? 0) : 0;
    if (count >= limit) return true;
    txn.write({
      path: `rateLimits/${docId}`,
      fields: {
        key,
        windowStart,
        count: count + 1,
        expiresAt: new Date(windowStart + windowSec * 2000).toISOString(),
      },
      precondition: doc?.updateTime ? { updateTime: doc.updateTime } : { exists: false },
    });
    return false;
  });
  if (blocked) {
    const retry = Math.max(1, Math.ceil((windowStart + windowSec * 1000 - Date.now()) / 1000));
    tooMany(retry, what);
  }
}

/** For tests. */
export function resetMemoryLimits(): void {
  windows.clear();
}
