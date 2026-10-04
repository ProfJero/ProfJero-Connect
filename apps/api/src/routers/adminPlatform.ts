import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  AdminSchema,
  CreateAdminInputSchema,
  SETTINGS_SECTIONS,
  SettingsSchemas,
  UpdateAdminInputSchema,
  UpdateMeInputSchema,
  type Admin,
  type AdminRole,
  type SettingsSection,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreQuery,
  firestoreUpdateDoc,
} from '../lib/firestore';
import {
  createAuthUser,
  generatePasswordSetupLink,
  lookupAuthUserByEmail,
  setAuthUserDisabled,
} from '../lib/firebase';
import { getSettings, getSettingsWithMeta, writeSettingsSection } from '../services/settings';
import { listAuditLogs } from '../services/audit';
import { computeAlerts } from '../services/alerts';
import { getJobRuns } from '../services/systemStatus';
import { getMonitoringReport } from '../services/monitoring';
import { parseBody, parseLimit } from './customer/helpers';
import type { AuthVariables, Env } from '../types/env';

/**
 * Admin platform management: Settings tabs, Team, Audit log, the alert
 * bell and System status. Mounted at /admin (behind requireAuth + audit).
 */
export const adminPlatformRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/** Who may edit each settings section. Everyone signed in may read. */
const SECTION_WRITERS: Record<SettingsSection, AdminRole[]> = {
  general: ['super_admin', 'admin'],
  sms: ['super_admin', 'admin'],
  payments: ['super_admin', 'admin', 'finance'],
  notifications: ['super_admin', 'admin'],
  security: ['super_admin'],
};

// ─────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────

adminPlatformRouter.get('/settings', async (c) => {
  const { settings, meta } = await getSettingsWithMeta(c.env, { fresh: true });
  const role = c.get('admin').role;
  const canEdit = Object.fromEntries(
    SETTINGS_SECTIONS.map((s) => [s, SECTION_WRITERS[s].includes(role)]),
  );
  return c.json({ settings, meta, canEdit });
});

adminPlatformRouter.put('/settings/:section', async (c) => {
  const section = c.req.param('section') as SettingsSection;
  if (!SETTINGS_SECTIONS.includes(section)) {
    throw new HTTPException(404, { message: 'Unknown settings section.' });
  }
  const admin = c.get('admin');
  if (!SECTION_WRITERS[section].includes(admin.role)) {
    throw new HTTPException(403, { message: `Requires one of: ${SECTION_WRITERS[section].join(', ')}` });
  }
  const values = await parseBody(c, SettingsSchemas[section]);
  if (section === 'notifications') {
    const n = values as { adminAlertEmails: string[] };
    n.adminAlertEmails = [...new Set(n.adminAlertEmails.map((e) => e.toLowerCase()))];
  }
  await writeSettingsSection(c.env, section, values as never, `admin:${admin.uid}`);
  const { settings, meta } = await getSettingsWithMeta(c.env, { fresh: true });
  return c.json({ section, values: settings[section], meta: meta[section] });
});

// ─────────────────────────────────────────────────────────────────────
// Own profile
// ─────────────────────────────────────────────────────────────────────

adminPlatformRouter.patch('/me', async (c) => {
  const admin = c.get('admin');
  const { displayName } = await parseBody(c, UpdateMeInputSchema);
  await firestoreUpdateDoc(c.env, 'admins', admin.uid, {
    displayName,
    updatedAt: new Date().toISOString(),
  });
  return c.json(AdminSchema.parse({ ...admin, displayName }));
});

// ─────────────────────────────────────────────────────────────────────
// Team / admin users
// ─────────────────────────────────────────────────────────────────────

interface AdminRow extends Admin {
  lastSeenAt: string | null;
  createdBy: string | null;
}

async function listAdmins(env: Env): Promise<AdminRow[]> {
  const { docs } = await firestoreListDocs(env, 'admins', { pageSize: 300 });
  const rows: AdminRow[] = [];
  for (const d of docs) {
    const parsed = AdminSchema.safeParse({
      uid: d.id,
      email: d.data.email,
      displayName: d.data.displayName ?? null,
      role: d.data.role,
      status: d.data.status,
      createdAt: d.data.createdAt,
    });
    if (!parsed.success) {
      console.error(`[team] skipping malformed admin ${d.id}`);
      continue;
    }
    rows.push({
      ...parsed.data,
      lastSeenAt: (d.data.lastSeenAt as string | null) ?? null,
      createdBy: (d.data.createdBy as string | null) ?? null,
    });
  }
  return rows.sort((a, b) => a.email.localeCompare(b.email));
}

adminPlatformRouter.get('/admins', async (c) => {
  const admins = await listAdmins(c.env);
  return c.json({ admins, count: admins.length });
});

async function sendInviteEmail(env: Env, email: string, name: string, link: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const { general } = await getSettings(env);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email],
        subject: `You've been added to ${general.platformName} admin`,
        text: `Hi ${name},\n\nYou've been given access to the ${general.platformName} admin dashboard. Set your password here:\n\n${link}\n\nThen sign in with ${email}.`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /admin/admins — invite an operator. Creates (or reuses) the
 * Firebase Auth user, writes admins/{uid}, and returns a one-time
 * password-setup link (also emailed when email is configured).
 * Customer accounts can't be promoted: the two surfaces stay separate.
 */
adminPlatformRouter.post('/admins', requireRole('super_admin'), async (c) => {
  const actor = c.get('admin');
  const input = await parseBody(c, CreateAdminInputSchema);

  let authUser = await lookupAuthUserByEmail(c.env, input.email);
  if (authUser) {
    if (await firestoreGetDoc(c.env, 'admins', authUser.uid)) {
      throw new HTTPException(409, { message: 'That person is already an admin.' });
    }
    if (await firestoreGetDoc(c.env, 'customers', authUser.uid)) {
      throw new HTTPException(409, {
        message: 'That email belongs to a customer account. Use a different email for admin access.',
      });
    }
  } else {
    authUser = await createAuthUser(c.env, { email: input.email, displayName: input.displayName });
  }

  const now = new Date().toISOString();
  await firestoreCreateDoc(
    c.env,
    'admins',
    {
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
    },
    { docId: authUser.uid },
  );
  if (authUser.disabled) await setAuthUserDisabled(c.env, authUser.uid, false);

  const setupLink = await generatePasswordSetupLink(c.env, input.email);
  const emailed = await sendInviteEmail(c.env, input.email, input.displayName, setupLink);

  return c.json(
    {
      admin: { uid: authUser.uid, email: input.email, displayName: input.displayName, role: input.role, status: 'active', createdAt: now, lastSeenAt: null, createdBy: actor.uid },
      setupLink,
      emailed,
    },
    201,
  );
});

/**
 * PATCH /admin/admins/:uid — role, status or name. Guards:
 * you can't change your own role/status, and the platform always keeps
 * at least one active super_admin.
 */
adminPlatformRouter.patch('/admins/:uid', requireRole('super_admin'), async (c) => {
  const actor = c.get('admin');
  const uid = c.req.param('uid');
  const input = await parseBody(c, UpdateAdminInputSchema);

  const admins = await listAdmins(c.env);
  const target = admins.find((a) => a.uid === uid);
  if (!target) throw new HTTPException(404, { message: 'Admin not found.' });

  if (uid === actor.uid && (input.role !== undefined || input.status !== undefined)) {
    throw new HTTPException(400, { message: "You can't change your own role or status. Ask another super admin." });
  }

  const nextRole = input.role ?? target.role;
  const nextStatus = input.status ?? target.status;
  const activeSupers = admins.filter(
    (a) => a.status === 'active' && a.role === 'super_admin' && a.uid !== uid,
  ).length;
  if (target.role === 'super_admin' && target.status === 'active' && (nextRole !== 'super_admin' || nextStatus !== 'active') && activeSupers === 0) {
    throw new HTTPException(400, { message: 'At least one active super admin is required.' });
  }

  const fields: Record<string, unknown> = { updatedAt: new Date().toISOString(), updatedBy: actor.uid };
  if (input.displayName !== undefined) fields.displayName = input.displayName;
  if (input.role !== undefined) fields.role = input.role;
  if (input.status !== undefined) fields.status = input.status;
  await firestoreUpdateDoc(c.env, 'admins', uid, fields);

  if (input.status !== undefined && input.status !== target.status) {
    // Block sign-in at the identity layer too, and revoke sessions.
    await setAuthUserDisabled(c.env, uid, input.status === 'disabled');
  }

  return c.json({ admin: { ...target, displayName: input.displayName ?? target.displayName, role: nextRole, status: nextStatus } });
});

adminPlatformRouter.post('/admins/:uid/reset-link', requireRole('super_admin'), async (c) => {
  const doc = await firestoreGetDoc(c.env, 'admins', c.req.param('uid'));
  if (!doc) throw new HTTPException(404, { message: 'Admin not found.' });
  const email = String(doc.data.email);
  const link = await generatePasswordSetupLink(c.env, email);
  const emailed = await sendInviteEmail(c.env, email, String(doc.data.displayName ?? ''), link);
  return c.json({ setupLink: link, emailed });
});

// ─────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────

adminPlatformRouter.get('/audit-logs', requireRole('super_admin', 'admin'), async (c) => {
  const result = await listAuditLogs(c.env, {
    category: c.req.query('category') || undefined,
    actorUid: c.req.query('actorUid') || undefined,
    before: c.req.query('before') || undefined,
    limit: parseLimit(c.req.query('limit'), 30, 100),
  });
  return c.json({ ...result, count: result.logs.length });
});

// ─────────────────────────────────────────────────────────────────────
// Alerts (topbar bell)
// ─────────────────────────────────────────────────────────────────────

adminPlatformRouter.get('/alerts', async (c) => {
  const admin = c.get('admin');
  const doc = await firestoreGetDoc(c.env, 'admins', admin.uid);
  const seenAt = (doc?.data.alertsSeenAt as string | undefined) ?? null;
  const alerts = await computeAlerts(c.env, seenAt);
  // Cheap "last seen" signal for the Team tab.
  firestoreUpdateDoc(c.env, 'admins', admin.uid, { lastSeenAt: new Date().toISOString() }).catch(() => {});
  return c.json({ alerts, unreadCount: alerts.filter((a) => a.unread).length, seenAt });
});

adminPlatformRouter.post('/alerts/seen', async (c) => {
  const admin = c.get('admin');
  const now = new Date().toISOString();
  await firestoreUpdateDoc(c.env, 'admins', admin.uid, { alertsSeenAt: now });
  return c.json({ seenAt: now });
});

// ─────────────────────────────────────────────────────────────────────
// System status (monitoring / recovery)
// ─────────────────────────────────────────────────────────────────────

adminPlatformRouter.get('/system', async (c) => {
  const started = Date.now();
  const [jobs, unknown, queued, pendingPayments] = await Promise.all([
    getJobRuns(c.env),
    firestoreQuery(c.env, 'smsRecords', [{ field: 'status', op: 'EQUAL', value: 'unknown' }]),
    firestoreQuery(c.env, 'smsBatches', [{ field: 'status', op: 'EQUAL', value: 'queued' }]),
    firestoreQuery(c.env, 'payments', [{ field: 'status', op: 'EQUAL', value: 'pending' }]),
  ]);
  const firestoreMs = Date.now() - started;
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const tenMinAgo = new Date(Date.now() - 600_000).toISOString();

  return c.json({
    environment: c.env.ENVIRONMENT,
    time: new Date().toISOString(),
    firestoreMs,
    config: {
      smsMode: c.env.SMS_PROVIDER === 'arkesel' ? (c.env.ARKESEL_SANDBOX === 'true' ? 'sandbox' : 'live') : 'mock',
      deliveryWebhookConfigured: !!c.env.ARKESEL_WEBHOOK_URL,
      deliveryWebhookAuthenticated: !!c.env.ARKESEL_WEBHOOK_URL && !!c.env.ARKESEL_WEBHOOK_SECRET,
      paymentsConfigured: !!c.env.PAYSTACK_SECRET_KEY,
      paymentsMode: c.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'live' : c.env.PAYSTACK_SECRET_KEY ? 'test' : 'off',
      emailConfigured: !!(c.env.RESEND_API_KEY && c.env.EMAIL_FROM),
      customerAppUrl: c.env.CUSTOMER_APP_URL ?? null,
    },
    jobs,
    queues: {
      unknownRecords: unknown.length,
      unknownOlderThanHour: unknown.filter((d) => String(d.data.updatedAt) < hourAgo).length,
      unitsHeldByUnknown: unknown.reduce((s, d) => s + Number(d.data.unitsReserved ?? 0), 0),
      strandedQueuedBatches: queued.filter((d) => String(d.data.createdAt) < tenMinAgo).length,
      pendingPayments: pendingPayments.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────
// Monitoring
// ─────────────────────────────────────────────────────────────────────

/** GET /admin/monitoring?range=1h|24h|7d — live health, performance, errors, security. */
adminPlatformRouter.get('/monitoring', requireRole('super_admin', 'admin'), async (c) => {
  const raw = c.req.query('range') ?? '1h';
  const range = (['1h', '24h', '7d'] as const).find((r) => r === raw) ?? '1h';
  return c.json(await getMonitoringReport(c.env, range));
});
