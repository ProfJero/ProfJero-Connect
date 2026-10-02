import { Hono } from 'hono';
import { z } from 'zod';
import {
  ContactGroupInputSchema,
  ContactInputSchema,
  GroupMembershipSchema,
  ImportContactsSchema,
  UpdateContactGroupSchema,
  UpdateContactSchema,
} from '@profjero/shared';
import {
  createContact,
  createGroup,
  deleteContacts,
  deleteGroup,
  importContacts,
  listContacts,
  listGroups,
  setGroupMembership,
  updateContact,
  updateGroup,
} from '../../services/contacts';
import { parseBody, parseLimit } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ─────────────────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────────────────

/**
 * GET /customer/contacts?q=&groupId=&limit=&offset=
 *
 * Offset pagination (the list is sorted by name, not time). `total` is
 * the filtered count; `stats` summarises the whole address book.
 */
router.get('/contacts', async (c) => {
  const projectId = c.get('projectId')!;
  const q = (c.req.query('q') ?? '').trim().toLowerCase();
  const groupId = c.req.query('groupId');
  const limit = parseLimit(c.req.query('limit'), 25, 500);
  const offset = Math.max(0, parseInt(c.req.query('offset') ?? '0', 10) || 0);

  const all = await listContacts(c.env, projectId);
  const qDigits = q.replace(/\D/g, '');
  const filtered = all.filter((ct) => {
    if (groupId && !ct.groupIds.includes(groupId)) return false;
    if (!q) return true;
    return (
      ct.name.toLowerCase().includes(q) ||
      (ct.email ?? '').toLowerCase().includes(q) ||
      (qDigits.length > 0 && ct.phone.includes(qDigits))
    );
  });

  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
  return c.json({
    contacts: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    stats: {
      total: all.length,
      inGroups: all.filter((ct) => ct.groupIds.length > 0).length,
      withEmail: all.filter((ct) => !!ct.email).length,
      addedLast30Days: all.filter((ct) => ct.createdAt >= monthAgo).length,
    },
  });
});

router.post('/contacts', async (c) => {
  const input = await parseBody(c, ContactInputSchema);
  const contact = await createContact(c.env, c.get('projectId')!, input);
  return c.json({ contact }, 201);
});

/** POST /customer/contacts/import — bulk upsert from a parsed CSV. */
router.post('/contacts/import', async (c) => {
  const input = await parseBody(c, ImportContactsSchema);
  const result = await importContacts(c.env, c.get('projectId')!, input);
  return c.json(result);
});

/** POST /customer/contacts/delete — bulk delete { ids }. */
router.post('/contacts/delete', async (c) => {
  const { ids } = await parseBody(
    c,
    z.object({ ids: z.array(z.string().min(1)).min(1).max(500) }),
  );
  const deleted = await deleteContacts(c.env, c.get('projectId')!, ids);
  return c.json({ deleted });
});

router.put('/contacts/:id', async (c) => {
  const input = await parseBody(c, UpdateContactSchema);
  const contact = await updateContact(
    c.env,
    c.get('projectId')!,
    c.req.param('id'),
    input,
  );
  return c.json({ contact });
});

router.delete('/contacts/:id', async (c) => {
  await deleteContacts(c.env, c.get('projectId')!, [c.req.param('id')]);
  return c.json({ deleted: 1 });
});

// ─────────────────────────────────────────────────────────────────────
// Groups
// ─────────────────────────────────────────────────────────────────────

router.get('/contact-groups', async (c) => {
  const groups = await listGroups(c.env, c.get('projectId')!);
  return c.json({ groups, count: groups.length });
});

router.post('/contact-groups', async (c) => {
  const input = await parseBody(c, ContactGroupInputSchema);
  const group = await createGroup(c.env, c.get('projectId')!, input);
  return c.json({ group }, 201);
});

router.put('/contact-groups/:id', async (c) => {
  const input = await parseBody(c, UpdateContactGroupSchema);
  const group = await updateGroup(
    c.env,
    c.get('projectId')!,
    c.req.param('id'),
    input,
  );
  return c.json({ group });
});

router.delete('/contact-groups/:id', async (c) => {
  await deleteGroup(c.env, c.get('projectId')!, c.req.param('id'));
  return c.json({ deleted: true });
});

router.post('/contact-groups/:id/members', async (c) => {
  const { contactIds } = await parseBody(c, GroupMembershipSchema);
  const changed = await setGroupMembership(
    c.env,
    c.get('projectId')!,
    c.req.param('id'),
    contactIds,
    'add',
  );
  return c.json({ changed });
});

router.post('/contact-groups/:id/members/remove', async (c) => {
  const { contactIds } = await parseBody(c, GroupMembershipSchema);
  const changed = await setGroupMembership(
    c.env,
    c.get('projectId')!,
    c.req.param('id'),
    contactIds,
    'remove',
  );
  return c.json({ changed });
});

export { router as customerContactsRouter };
