import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ZodTypeAny, z } from 'zod';

/**
 * Small shared helpers for /customer/* routers. Kept local to the customer
 * surface so the admin and /v1 routers stay untouched.
 */

/** Parse and validate a JSON body, or throw a 400 with the first issue. */
export async function parseBody<S extends ZodTypeAny>(
  c: Context,
  schema: S,
): Promise<z.infer<S>> {
  const body = await c.req.json().catch(() => null);
  if (body === null) {
    throw new HTTPException(400, { message: 'Body must be valid JSON.' });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
    throw new HTTPException(400, {
      message: `Validation failed — ${where}${issue?.message ?? 'invalid body'}`,
    });
  }
  return parsed.data;
}

export function parseLimit(
  raw: string | undefined,
  fallback = 20,
  max = 100,
): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

/**
 * Idempotency-Key header, required on state-changing customer calls that
 * cost money or units. Same 8-120 char contract as /v1 (api.md §7).
 */
export function requireIdempotencyKey(c: Context): string {
  const key = c.req.header('Idempotency-Key');
  if (!key) {
    throw new HTTPException(400, {
      message: 'Idempotency-Key header is required.',
    });
  }
  if (key.length < 8 || key.length > 120 || !/^[A-Za-z0-9_\-:.]+$/.test(key)) {
    throw new HTTPException(400, {
      message:
        'Idempotency-Key must be 8-120 characters (letters, digits, - _ : .).',
    });
  }
  return key;
}

/**
 * Deterministic, project-scoped ID from a client idempotency key. Scoping
 * by project means two customers can never collide on the same key, and
 * hashing keeps the result a fixed, Firestore-safe length.
 */
export async function scopedId(
  prefix: string,
  projectId: string,
  key: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${projectId}:${key}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${hex.slice(0, 24)}`;
}

/** Generic cursor pagination over an already newest-first array. */
export function paginateByCreatedAt<T extends { createdAt: string }>(
  items: T[],
  limit: number,
  before: string | undefined,
): { page: T[]; nextCursor: string | null } {
  const filtered = before ? items.filter((i) => i.createdAt < before) : items;
  const page = filtered.slice(0, limit);
  const nextCursor =
    filtered.length > limit && page.length > 0
      ? page[page.length - 1].createdAt
      : null;
  return { page, nextCursor };
}
