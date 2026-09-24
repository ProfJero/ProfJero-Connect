import { normalizePhone } from '../lib/phone';
import { DomainError } from '../lib/domainError';
import type { Env } from '../types/env';
import type { ApiKey, RecipientMode } from '@profjero/shared';

// ---------- Expiry ----------

export function assertNotExpired(key: ApiKey): void {
  if (!key.expiresAt) return;
  if (new Date(key.expiresAt).getTime() < Date.now()) {
    throw new DomainError('API key has expired.', 401);
  }
}

// ---------- Recipients ----------

/**
 * Check every recipient against the key's restriction.
 * Returns the normalized list on success; throws DomainError on rejection.
 */
export function assertRecipientsAllowed(
  key: ApiKey,
  recipients: string[],
): void {
  if (key.kind !== 'publishable') return;
  const mode = key.recipientMode as RecipientMode | null;
  if (!mode) {
    throw new DomainError('API key is misconfigured (no recipient mode).', 500);
  }
  if (mode === 'any') return;

  const normalizedList = key.recipientList.map(normalizePhone);
  if (normalizedList.length === 0) {
    throw new DomainError(
      'This API key has no allowed recipients configured.',
      403,
    );
  }

  const rejected: string[] = [];
  for (const raw of recipients) {
    const norm = normalizePhone(raw);
    const pass =
      mode === 'allowlist'
        ? normalizedList.includes(norm)
        : normalizedList.some((p) => norm.startsWith(p));
    if (!pass) rejected.push(raw);
  }

  if (rejected.length > 0) {
    const sample = rejected.slice(0, 3).join(', ');
    const more = rejected.length > 3 ? ` (+${rejected.length - 3} more)` : '';
    throw new DomainError(
      `Recipient not permitted by this API key's allow list: ${sample}${more}`,
      403,
    );
  }
}

// ---------- Rate limits ----------

/**
 * Increment all three rate-limit buckets atomically-ish and reject if any
 * exceeds its limit. Increments happen even on subsequent rejection so the
 * caller can't hammer past the window.
 *
 * `amount` is the number of "events" this request consumes. For SMS sends,
 * amount = number of recipients. This means a 100-recipient batch consumes
 * 100 slots from the minute/hour/day quotas.
 */
/**
 * Fixed-window rate limits, tracked on the key doc itself.
 *
 * This is not strictly atomic: two truly concurrent requests could each
 * read the same count and both write count+1, losing one increment. That
 * window is milliseconds wide and can't be reliably exploited at scale.
 * If stricter guarantees are ever needed, switch to a Firestore
 * `updateTransforms` increment followed by a re-read.
 */
export async function enforceRateLimits(
  env: Env,
  key: ApiKey,
  amount: number,
): Promise<void> {
  if (key.kind !== 'publishable') return;

  if (
    key.rateLimitPerMinute <= 0 ||
    key.rateLimitPerHour <= 0 ||
    key.rateLimitPerDay <= 0
  ) {
    throw new DomainError('API key is misconfigured (no rate limits).', 500);
  }

  const now = new Date();
  const minuteBucket = bucketKey('minute', now);
  const hourBucket = bucketKey('hour', now);
  const dayBucket = bucketKey('day', now);

  // Compute new counts, resetting windows that have rolled over.
  const minuteCount =
    key.rateMinuteBucket === minuteBucket ? key.rateMinuteCount + amount : amount;
  const hourCount =
    key.rateHourBucket === hourBucket ? key.rateHourCount + amount : amount;
  const dayCount =
    key.rateDayBucket === dayBucket ? key.rateDayCount + amount : amount;

  if (minuteCount > key.rateLimitPerMinute) {
    throw new DomainError(
      `Rate limit exceeded (${key.rateLimitPerMinute}/minute). Try again shortly.`,
      429,
    );
  }
  if (hourCount > key.rateLimitPerHour) {
    throw new DomainError(
      `Hourly rate limit exceeded (${key.rateLimitPerHour}/hour). Try again later.`,
      429,
    );
  }
  if (dayCount > key.rateLimitPerDay) {
    throw new DomainError(
      `Daily rate limit exceeded (${key.rateLimitPerDay}/day). Try again tomorrow.`,
      429,
    );
  }

  // Persist the new state. Uses the same primitive that powers spend-cap
  // increments — a plain partial update, no transaction needed.
  const { firestoreUpdateDoc } = await import('../lib/firestore');
  await firestoreUpdateDoc(env, 'apiKeys', key.id, {
    rateMinuteBucket: minuteBucket,
    rateMinuteCount: minuteCount,
    rateHourBucket: hourBucket,
    rateHourCount: hourCount,
    rateDayBucket: dayBucket,
    rateDayCount: dayCount,
  });
}

/**
 * Bucket key for a window at a given time.
 *   minute → "2026-09-21T14-23"  (colon replaced with hyphen for doc safety)
 *   hour   → "2026-09-21T14"
 *   day    → "2026-09-21"
 */
function bucketKey(window: 'minute' | 'hour' | 'day', now: Date): string {
  const iso = now.toISOString();
  if (window === 'minute') return iso.slice(0, 16).replace(':', '-');
  if (window === 'hour') return iso.slice(0, 13);
  return iso.slice(0, 10);
}

// ---------- Spend cap ----------

/**
 * Check that this request stays within the key's lifetime spend cap.
 * `requestedUnits` = recipients × segments.
 */
export function assertWithinSpendCap(key: ApiKey, requestedUnits: number): void {
  if (key.kind !== 'publishable') return;
  if (key.lifetimeUnitCap <= 0) {
    throw new DomainError('API key is misconfigured (no spend cap).', 500);
  }
  const remaining = key.lifetimeUnitCap - key.lifetimeUnitsSpent;
  if (requestedUnits > remaining) {
    throw new DomainError(
      `Request would exceed this key's lifetime spend cap. Remaining: ${remaining} units, requested: ${requestedUnits}.`,
      403,
    );
  }
}