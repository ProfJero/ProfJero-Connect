import type { MiddlewareHandler } from 'hono';
import { firestoreCreateDoc, firestoreQuery } from '../lib/firestore';
import type { AuthVariables, Env } from '../types/env';
import type { AuditLog } from '@profjero/shared';

/**
 * Audit trail for every state-changing admin request (state.md §8
 * "auditLogs — every sensitive admin/system action").
 *
 * Implemented as one middleware on the admin router rather than calls
 * sprinkled through handlers, so a new admin endpoint is audited by
 * default. Only successful (2xx) mutations are recorded; refused requests
 * are visible in Worker logs.
 */

const COLLECTION = 'auditLogs';

/** Body fields never copied into the log. */
const REDACT = /pass|secret|token|key|authorization|plaintext/i;

interface ActionRule {
  method: string;
  pattern: RegExp;
  action: string;
  category: string;
}

// Most specific first. `target` is the first capture group, if any.
const RULES: ActionRule[] = [
  { method: 'PUT', pattern: /^\/admin\/settings\/(\w+)$/, action: 'Updated settings', category: 'settings' },
  { method: 'POST', pattern: /^\/admin\/admins\/([^/]+)\/reset-link$/, action: 'Issued password reset link', category: 'team' },
  { method: 'POST', pattern: /^\/admin\/admins$/, action: 'Invited admin user', category: 'team' },
  { method: 'PATCH', pattern: /^\/admin\/admins\/([^/]+)$/, action: 'Updated admin user', category: 'team' },
  { method: 'PATCH', pattern: /^\/admin\/me$/, action: 'Updated own profile', category: 'team' },
  { method: 'POST', pattern: /^\/admin\/projects$/, action: 'Created project', category: 'projects' },
  { method: 'PATCH', pattern: /^\/admin\/projects\/([^/]+)$/, action: 'Updated project', category: 'projects' },
  { method: 'DELETE', pattern: /^\/admin\/projects\/([^/]+)$/, action: 'Archived project', category: 'projects' },
  { method: 'POST', pattern: /^\/admin\/projects\/([^/]+)\/api-keys\/publishable$/, action: 'Created publishable API key', category: 'api_keys' },
  { method: 'POST', pattern: /^\/admin\/projects\/([^/]+)\/api-keys$/, action: 'Created secret API key', category: 'api_keys' },
  { method: 'DELETE', pattern: /^\/admin\/projects\/([^/]+)\/api-keys\/[^/]+$/, action: 'Revoked API key', category: 'api_keys' },
  { method: 'POST', pattern: /^\/admin\/projects\/([^/]+)\/sms\/send$/, action: 'Sent SMS as project', category: 'sms' },
  { method: 'POST', pattern: /^\/admin\/projects\/([^/]+)\/sender-ids$/, action: 'Added Sender ID to project', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/sender-ids\/([^/]+)\/approve$/, action: 'Approved Sender ID', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/sender-ids\/([^/]+)\/reject$/, action: 'Rejected Sender ID', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/sender-ids\/([^/]+)\/assignments\/[^/]+\/approve$/, action: 'Approved Sender ID assignment', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/sender-ids\/([^/]+)\/assignments\/[^/]+\/reject$/, action: 'Rejected Sender ID assignment', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/sender-ids\/([^/]+)\/assignments\/[^/]+\/revoke$/, action: 'Revoked Sender ID assignment', category: 'sender_ids' },
  { method: 'POST', pattern: /^\/admin\/wallets\/([^/]+)\/credit$/, action: 'Credited wallet', category: 'wallets' },
  { method: 'POST', pattern: /^\/admin\/wallets\/([^/]+)\/debit$/, action: 'Debited wallet', category: 'wallets' },
  { method: 'POST', pattern: /^\/admin\/wallets\/([^/]+)\/threshold$/, action: 'Set low-balance threshold', category: 'wallets' },
  { method: 'POST', pattern: /^\/admin\/wallets\/([^/]+)\/(?:reserve|confirm|release)$/, action: 'Manual ledger operation', category: 'wallets' },
  { method: 'POST', pattern: /^\/admin\/payments\/initiate$/, action: 'Initiated payment', category: 'payments' },
  { method: 'POST', pattern: /^\/admin\/payments\/([^/]+)\/verify$/, action: 'Verified payment', category: 'payments' },
  { method: 'PUT', pattern: /^\/admin\/pricing\/(\w+)$/, action: 'Updated pricing', category: 'pricing' },
  { method: 'POST', pattern: /^\/admin\/pricing\/(\w+)\/packages$/, action: 'Created package', category: 'pricing' },
  { method: 'PATCH', pattern: /^\/admin\/pricing\/packages\/([^/]+)$/, action: 'Updated package', category: 'pricing' },
  { method: 'POST', pattern: /^\/admin\/pricing\/bootstrap\/(\w+)$/, action: 'Bootstrapped pricing', category: 'pricing' },
  { method: 'POST', pattern: /^\/admin\/providers\/bootstrap$/, action: 'Bootstrapped provider', category: 'providers' },
  { method: 'PUT', pattern: /^\/admin\/providers\/([^/]+)$/, action: 'Updated provider', category: 'providers' },
  { method: 'POST', pattern: /^\/admin\/providers\/([^/]+)\/refresh-balance$/, action: 'Refreshed provider balance', category: 'providers' },
  { method: 'POST', pattern: /^\/admin\/sms\/reconcile$/, action: 'Ran reconciliation', category: 'system' },
  { method: 'POST', pattern: /^\/admin\/sms\/cleanup-orphans$/, action: 'Cleaned up orphan batches', category: 'system' },
  { method: 'POST', pattern: /^\/admin\/sms\/poll-status$/, action: 'Polled delivery status', category: 'system' },
];

/** Requests that change nothing worth auditing. */
const SKIP = [/^\/admin\/alerts\/seen$/];

function describe(method: string, path: string) {
  for (const r of RULES) {
    if (r.method !== method) continue;
    const m = path.match(r.pattern);
    if (m) return { action: r.action, category: r.category, targetId: m[1] ? decodeURIComponent(m[1]) : null };
  }
  return { action: `${method} ${path}`, category: 'other', targetId: null };
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 3) return '[…]';
  if (Array.isArray(value)) {
    return value.length > 20 ? [...value.slice(0, 20).map((v) => sanitize(v, depth + 1)), `(+${value.length - 20} more)`] : value.map((v) => sanitize(v, depth + 1));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT.test(k) ? '[redacted]' : sanitize(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 300) return `${value.slice(0, 300)}…`;
  return value;
}

export const auditMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> = async (c, next) => {
  const method = c.req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const path = c.req.path;
  if (SKIP.some((re) => re.test(path))) return next();

  // Read the body before the handler; Hono caches the parsed JSON so the
  // handler's own c.req.json() still works.
  let body: unknown = null;
  if ((c.req.header('Content-Type') ?? '').includes('application/json')) {
    body = await c.req.json().catch(() => null);
  }

  await next();

  const status = c.res.status;
  if (status < 200 || status >= 300) return;
  const admin = c.get('admin');
  if (!admin) return;

  const { action, category, targetId } = describe(method, path);
  const details = body === null ? null : (sanitize(body) as Record<string, unknown>);
  const summary = `${action}${targetId ? ` · ${targetId}` : ''}`;

  try {
    await firestoreCreateDoc(c.env, COLLECTION, {
      actorUid: admin.uid,
      actorEmail: admin.email,
      actorRole: admin.role,
      action,
      category,
      targetId,
      method,
      path,
      status,
      summary,
      details,
      requestId: c.get('requestId') ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Never fail the admin's action because the audit write failed — but
    // make it loud in the logs.
    console.error('[audit] failed to write audit log:', err, { action, path });
  }
};

/** Newest first, optional filters. */
export async function listAuditLogs(
  env: Env,
  opts: { category?: string; actorUid?: string; before?: string; limit: number },
): Promise<{ logs: AuditLog[]; nextCursor: string | null }> {
  // Unfiltered (the common case): ordered + limited server-side on the
  // single-field createdAt index. Filtered views read the category /
  // all docs and filter in memory to avoid composite indexes.
  const unfiltered = !opts.category && !opts.actorUid;
  const docs = unfiltered
    ? await firestoreQuery(
        env,
        COLLECTION,
        opts.before ? [{ field: 'createdAt', op: 'LESS_THAN', value: opts.before }] : [],
        { orderBy: { field: 'createdAt', direction: 'DESCENDING' }, limit: opts.limit + 1 },
      )
    : await firestoreQuery(
        env,
        COLLECTION,
        opts.category ? [{ field: 'category', op: 'EQUAL', value: opts.category }] : [],
      );
  let logs = docs
    .map((d) => ({
      id: d.id,
      actorUid: String(d.data.actorUid ?? ''),
      actorEmail: (d.data.actorEmail as string | null) ?? null,
      actorRole: (d.data.actorRole as string | null) ?? null,
      action: String(d.data.action ?? ''),
      category: String(d.data.category ?? 'other'),
      targetId: (d.data.targetId as string | null) ?? null,
      method: String(d.data.method ?? ''),
      path: String(d.data.path ?? ''),
      status: Number(d.data.status ?? 0),
      summary: String(d.data.summary ?? ''),
      details: (d.data.details as Record<string, unknown> | null) ?? null,
      requestId: (d.data.requestId as string | null) ?? null,
      createdAt: String(d.data.createdAt ?? ''),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts.actorUid) logs = logs.filter((l) => l.actorUid === opts.actorUid);
  if (opts.before) logs = logs.filter((l) => l.createdAt < opts.before!);
  const page = logs.slice(0, opts.limit);
  return { logs: page, nextCursor: logs.length > opts.limit ? page[page.length - 1].createdAt : null };
}
