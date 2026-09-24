import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  PendingQueueSchema,
  RejectSenderIdInputSchema,
  SenderIdListResponseSchema,
  SenderIdValueSchema,
  SenderIdWithAssignmentsResponseSchema,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  approveAssignment,
  approveSenderIdValue,
  getSenderIdWithAssignments,
  listAllSenderIds,
  rejectAssignment,
  rejectSenderIdValue,
  revokeAssignment,
} from '../services/senderIds';
import {
  listPendingAssignments,
  listSenderIds,
  projectNameMap,
} from '../repositories/senderIds';
import { listProjects } from '../repositories/projects';
import type { AuthVariables, Env } from '../types/env';

export const adminSenderIdsRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function parseValue(raw: string): string {
  const parsed = SenderIdValueSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: parsed.error.issues[0]?.message ?? 'Invalid Sender ID.',
    });
  }
  return parsed.data;
}

// --- GET /admin/sender-ids ---
adminSenderIdsRouter.get('/', async (c) => {
  const senderIds = await listAllSenderIds(c.env);
  return c.json(
    SenderIdListResponseSchema.parse({
      senderIds,
      count: senderIds.length,
    }),
  );
});

// --- GET /admin/sender-ids/queue ---
adminSenderIdsRouter.get('/queue', async (c) => {
  const [pendingValues, pendingAssignments, projects] = await Promise.all([
    listSenderIds(c.env, 'pending'),
    listPendingAssignments(c.env),
    listProjects(c.env, {}),
  ]);

  const names = new Map(projects.map((p) => [p.id, p.name]));

  const enrichedValues = pendingValues.map((s) => ({
    ...s,
    requestedByProjectName: s.requestedByProjectId
      ? names.get(s.requestedByProjectId) ?? '(unknown project)'
      : '(unknown project)',
  }));

  const enrichedAssignments = pendingAssignments
    .filter((a) => names.has(a.projectId))
    .map((a) => ({
      ...a,
      projectName: names.get(a.projectId) ?? '(unknown project)',
    }));

  return c.json(
    PendingQueueSchema.parse({
      pendingValues: enrichedValues,
      pendingAssignments: enrichedAssignments,
      total: enrichedValues.length + enrichedAssignments.length,
    }),
  );
});

// --- GET /admin/sender-ids/:value ---
adminSenderIdsRouter.get('/:value', async (c) => {
  const value = parseValue(c.req.param('value'));
  try {
    const senderId = await getSenderIdWithAssignments(c.env, value);
    return c.json(
      SenderIdWithAssignmentsResponseSchema.parse({ senderId }),
    );
  } catch {
    throw new HTTPException(404, {
      message: `Sender ID "${value}" not found.`,
    });
  }
});

// --- POST /admin/sender-ids/:value/approve ---
adminSenderIdsRouter.post(
  '/:value/approve',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const value = parseValue(c.req.param('value'));
    try {
      const admin = c.get('admin');
      const senderId = await approveSenderIdValue(c.env, value, admin.uid);
      return c.json(
        SenderIdWithAssignmentsResponseSchema.parse({ senderId }),
      );
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'Approval failed.',
      });
    }
  },
);

// --- POST /admin/sender-ids/:value/reject ---
adminSenderIdsRouter.post(
  '/:value/reject',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const value = parseValue(c.req.param('value'));
    const body = await c.req.json().catch(() => null);
    const parsed = RejectSenderIdInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: 'Rejection reason is required (1-300 chars).',
      });
    }
    try {
      const admin = c.get('admin');
      const senderId = await rejectSenderIdValue(
        c.env,
        value,
        admin.uid,
        parsed.data.reason,
      );
      return c.json(
        SenderIdWithAssignmentsResponseSchema.parse({ senderId }),
      );
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'Rejection failed.',
      });
    }
  },
);

// --- Assignment decisions ---

adminSenderIdsRouter.post(
  '/:value/assignments/:projectId/approve',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const value = parseValue(c.req.param('value'));
    const projectId = c.req.param('projectId');
    try {
      const admin = c.get('admin');
      const assignment = await approveAssignment(c.env, projectId, value, admin.uid);
      return c.json({ assignment });
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'Approval failed.',
      });
    }
  },
);

adminSenderIdsRouter.post(
  '/:value/assignments/:projectId/reject',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const value = parseValue(c.req.param('value'));
    const projectId = c.req.param('projectId');
    const body = await c.req.json().catch(() => ({}));
    const notes =
      typeof body?.notes === 'string' && body.notes.length > 0
        ? body.notes
        : null;
    try {
      const admin = c.get('admin');
      const assignment = await rejectAssignment(
        c.env,
        projectId,
        value,
        admin.uid,
        notes,
      );
      return c.json({ assignment });
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'Rejection failed.',
      });
    }
  },
);

adminSenderIdsRouter.post(
  '/:value/assignments/:projectId/revoke',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const value = parseValue(c.req.param('value'));
    const projectId = c.req.param('projectId');
    const body = await c.req.json().catch(() => ({}));
    const notes =
      typeof body?.notes === 'string' && body.notes.length > 0
        ? body.notes
        : null;
    try {
      const admin = c.get('admin');
      const assignment = await revokeAssignment(
        c.env,
        projectId,
        value,
        admin.uid,
        notes,
      );
      return c.json({ assignment });
    } catch (err) {
      throw new HTTPException(400, {
        message: err instanceof Error ? err.message : 'Revoke failed.',
      });
    }
  },
);