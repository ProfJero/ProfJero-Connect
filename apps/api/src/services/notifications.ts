import {
  firestoreCreateDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  type FirestoreDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';
import type {
  CustomerNotification,
  NotificationSeverity,
  NotificationType,
} from '@profjero/shared';

/**
 * Customer notifications (CP7).
 *
 * In-app: one doc per event in `notifications`, scoped by projectId — the
 * same tenant key every other customer collection uses.
 *
 * Email: optional, via Resend, for the events a customer must not miss
 * (payment receipt, Sender ID decision, low balance). Skipped silently
 * when RESEND_API_KEY is unset or the customer turned email off.
 *
 * Every notify call is best-effort: callers are money/SMS flows that must
 * never fail because a notification couldn't be written. Errors are
 * logged and swallowed here, not at each call site.
 */

const COLLECTION = 'notifications';

export interface NotifyArgs {
  projectId: string;
  /**
   * Deterministic ID for event-driven notifications (e.g.
   * "payment__pj_abc"). A second notify with the same ID is a no-op and
   * sends no second email — that's what makes webhook replays safe.
   * Omit for notifications that may legitimately repeat.
   */
  id?: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  link?: string | null;
  /** Also email the account owner (subject = title). */
  email?: boolean;
}

export function parseNotification(doc: FirestoreDoc): CustomerNotification {
  const d = doc.data;
  return {
    id: doc.id,
    projectId: String(d.projectId),
    type: d.type as NotificationType,
    severity: (d.severity as NotificationSeverity) ?? 'info',
    title: String(d.title ?? ''),
    body: String(d.body ?? ''),
    link: (d.link as string | null) ?? null,
    readAt: (d.readAt as string | null) ?? null,
    createdAt: String(d.createdAt),
  };
}

export async function notifyProject(env: Env, args: NotifyArgs): Promise<void> {
  try {
    const now = new Date().toISOString();
    const data = {
      projectId: args.projectId,
      type: args.type,
      severity: args.severity,
      title: args.title,
      body: args.body,
      link: args.link ?? null,
      readAt: null,
      createdAt: now,
    };

    try {
      await firestoreCreateDoc(
        env,
        COLLECTION,
        data,
        args.id ? { docId: args.id } : {},
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (args.id && (msg.includes('409') || msg.includes('ALREADY_EXISTS'))) {
        return; // Already notified for this event.
      }
      throw err;
    }

    if (args.email) {
      await emailProjectOwner(env, args);
    }
  } catch (err) {
    console.error('[notifications] notifyProject failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Queries used by /customer/notifications
// ─────────────────────────────────────────────────────────────────────

/** Newest first. Single-field filter → no composite index needed. */
export async function listNotificationsForProject(
  env: Env,
  projectId: string,
): Promise<CustomerNotification[]> {
  const docs = await firestoreQuery(env, COLLECTION, [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  return docs
    .map(parseNotification)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(
  env: Env,
  id: string,
): Promise<void> {
  await firestoreUpdateDoc(env, COLLECTION, id, {
    readAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────────────────────────────

async function emailProjectOwner(env: Env, args: NotifyArgs): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;

  const owners = await firestoreQuery(env, 'customers', [
    { field: 'projectId', op: 'EQUAL', value: args.projectId },
  ]);
  const owner = owners[0];
  if (!owner) return; // Admin-managed project: no customer to email.
  if (owner.data.emailNotifications === false) return;
  const to = owner.data.email;
  if (typeof to !== 'string' || !to.includes('@')) return;

  const appUrl = env.CUSTOMER_APP_URL?.replace(/\/+$/, '') ?? null;
  const href = appUrl && args.link ? `${appUrl}${args.link}` : appUrl;
  const name =
    typeof owner.data.displayName === 'string' ? owner.data.displayName : '';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: args.title,
      html: renderEmail({ name, title: args.title, body: args.body, href }),
      text: `${args.title}\n\n${args.body}${href ? `\n\n${href}` : ''}`,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[notifications] Resend failed (${res.status}): ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderEmail(p: {
  name: string;
  title: string;
  body: string;
  href: string | null;
}): string {
  const greeting = p.name ? `Hi ${escapeHtml(p.name)},` : 'Hi,';
  const button = p.href
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(p.href)}" style="background:#1a6cf0;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">Open ProfJero Connect</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f5f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px">
<tr><td>
<p style="margin:0 0 20px;font-weight:700;color:#0c192c">ProfJero Connect</p>
<p style="margin:0 0 8px">${greeting}</p>
<h1 style="margin:0 0 12px;font-size:18px;color:#0f172a">${escapeHtml(p.title)}</h1>
<p style="margin:0;line-height:1.6;color:#475569">${escapeHtml(p.body)}</p>
${button}
</td></tr></table>
<p style="font-size:12px;color:#94a3b8;margin-top:16px">You can turn off email notifications in Settings → Notifications.</p>
</td></tr></table></body></html>`;
}
