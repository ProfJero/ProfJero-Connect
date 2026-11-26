import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { firestoreBatchWrite, firestoreGetDoc } from '../../lib/firestore';
import {
  listNotificationsForProject,
  markNotificationRead,
} from '../../services/notifications';
import { paginateByCreatedAt, parseLimit } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/**
 * GET /customer/notifications?limit=&before=&type=&unread=true
 *
 * `unreadCount` and `counts` always describe the whole inbox (not the
 * filtered page) so the bell badge and filter chips stay correct.
 */
router.get('/notifications', async (c) => {
  const projectId = c.get('projectId')!;
  const limit = parseLimit(c.req.query('limit'), 20, 100);
  const type = c.req.query('type');
  const unreadOnly = c.req.query('unread') === 'true';

  const all = await listNotificationsForProject(c.env, projectId);
  const counts: Record<string, number> = {};
  for (const n of all) counts[n.type] = (counts[n.type] ?? 0) + 1;

  const filtered = all.filter(
    (n) => (!type || n.type === type) && (!unreadOnly || n.readAt === null),
  );
  const { page, nextCursor } = paginateByCreatedAt(filtered, limit, c.req.query('before'));

  return c.json({
    notifications: page,
    count: page.length,
    nextCursor,
    total: all.length,
    unreadCount: all.filter((n) => n.readAt === null).length,
    counts,
  });
});

/** POST /customer/notifications/:id/read */
router.post('/notifications/:id/read', async (c) => {
  const id = c.req.param('id');
  const doc = await firestoreGetDoc(c.env, 'notifications', id);
  if (!doc || doc.data.projectId !== c.get('projectId')) {
    throw new HTTPException(404, { message: 'Notification not found.' });
  }
  if (!doc.data.readAt) await markNotificationRead(c.env, id);
  return c.json({ ok: true });
});

/** POST /customer/notifications/read-all */
router.post('/notifications/read-all', async (c) => {
  const all = await listNotificationsForProject(c.env, c.get('projectId')!);
  const now = new Date().toISOString();
  const unread = all.filter((n) => n.readAt === null);
  await firestoreBatchWrite(
    c.env,
    unread.map((n) => ({
      path: `notifications/${n.id}`,
      fields: { readAt: now },
      updateFieldPaths: ['readAt'],
    })),
  );
  return c.json({ ok: true, marked: unread.length });
});

export { router as customerNotificationsRouter };
