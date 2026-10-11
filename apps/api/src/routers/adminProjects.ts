import {
  AdminCreateSenderIdInputSchema,
  ProjectSenderIdListResponseSchema,
  RequestSenderIdInputSchema,
} from '@profjero/shared';
import {
  adminCreateSenderId,
  requestSenderId,
} from '../services/senderIds';
import { listAssignmentsForProject } from '../repositories/senderIds';

import { sendSmsBatch } from '../services/sms';
import {
  SendSmsInputSchema,
  SendSmsResponseSchema,
} from '@profjero/shared';

import {
  ApiKeyCreateResponseSchema,
  ApiKeyListResponseSchema,
  ApiKeyResponseSchema,
  CreateApiKeyInputSchema,
  CreatePublishableApiKeyInputSchema,
} from '@profjero/shared';
import {
  createApiKey,
  createPublishableApiKey,
  getApiKeyById,
  listApiKeysForProject,
  revokeApiKey,
} from '../repositories/apiKeys';

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CreateProjectInputSchema,
  ProjectListResponseSchema,
  ProjectResponseSchema,
  ProjectStatusSchema,
  UpdateProjectInputSchema,
} from '@profjero/shared';
import { requireRole } from '../middleware/roles';
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '../repositories/projects';
import type { AuthVariables, Env } from '../types/env';

import { DomainError } from '../lib/domainError';

export const adminProjectsRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

function validationError(issues: { path: PropertyKey[]; message: string }[]): never {
  const detail = issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
  throw new HTTPException(400, { message: `Validation failed — ${detail}` });
}

adminProjectsRouter.get('/', async (c) => {
  const statusParam = c.req.query('status');
  const search = c.req.query('search');

  let status;
  if (statusParam) {
    const parsed = ProjectStatusSchema.safeParse(statusParam);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: `Invalid status: "${statusParam}"`,
      });
    }
    status = parsed.data;
  }

  const projects = await listProjects(c.env, { status, search });
  return c.json(
    ProjectListResponseSchema.parse({ projects, count: projects.length }),
  );
});

adminProjectsRouter.get('/:id', async (c) => {
  const project = await getProject(c.env, c.req.param('id'));
  if (!project) throw new HTTPException(404, { message: 'Project not found.' });
  return c.json(ProjectResponseSchema.parse({ project }));
});

adminProjectsRouter.post(
  '/',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }

    const parsed = CreateProjectInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const project = await createProject(c.env, parsed.data, admin.uid);
    return c.json(ProjectResponseSchema.parse({ project }), 201);
  },
);

adminProjectsRouter.patch(
  '/:id',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }

    const parsed = UpdateProjectInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const project = await updateProject(
      c.env,
      c.req.param('id'),
      parsed.data,
      admin.uid,
    );
    if (!project) throw new HTTPException(404, { message: 'Project not found.' });
    return c.json(ProjectResponseSchema.parse({ project }));
  },
);

adminProjectsRouter.delete(
  '/:id',
  requireRole('super_admin'),
  async (c) => {
    const admin = c.get('admin');
    const project = await archiveProject(c.env, c.req.param('id'), admin.uid);
    if (!project) throw new HTTPException(404, { message: 'Project not found.' });
    return c.json(ProjectResponseSchema.parse({ project }));
  },
);

// ---------- API keys (sub-resource of a project) ----------

adminProjectsRouter.get('/:projectId/api-keys', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await getProject(c.env, projectId);
  if (!project) throw new HTTPException(404, { message: 'Project not found.' });

  const apiKeys = await listApiKeysForProject(c.env, projectId);
  return c.json(
    ApiKeyListResponseSchema.parse({ apiKeys, count: apiKeys.length }),
  );
});

adminProjectsRouter.post(
  '/:projectId/api-keys',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const project = await getProject(c.env, projectId);
    if (!project) throw new HTTPException(404, { message: 'Project not found.' });

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = CreateApiKeyInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const apiKey = await createApiKey(
      c.env,
      projectId,
      parsed.data.name,
      admin.uid,
    );

    return c.json(
      ApiKeyCreateResponseSchema.parse({ apiKey, warning: null }),
      201,
    );
  },
);

adminProjectsRouter.delete(
  '/:projectId/api-keys/:keyId',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const keyId = c.req.param('keyId');

    const existing = await getApiKeyById(c.env, keyId);
    if (!existing || existing.projectId !== projectId) {
      throw new HTTPException(404, { message: 'API key not found.' });
    }

    const admin = c.get('admin');
    const revoked = await revokeApiKey(c.env, keyId, admin.uid);
    if (!revoked) throw new HTTPException(404, { message: 'API key not found.' });

    return c.json(ApiKeyResponseSchema.parse({ apiKey: revoked }));
  },
);

// ---------- Send SMS on behalf of a project ----------

adminProjectsRouter.post(
  '/:projectId/sms/send',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const projectId = c.req.param('projectId');

    const project = await getProject(c.env, projectId);
    if (!project) {
      throw new HTTPException(404, { message: 'Project not found.' });
    }
    if (project.status === 'archived') {
      throw new HTTPException(409, {
        message: 'Cannot send SMS from an archived project.',
      });
    }

    const idempotencyKey = c.req.header('Idempotency-Key');
    if (!idempotencyKey) {
      throw new HTTPException(400, {
        message: 'Idempotency-Key header is required.',
      });
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 120) {
      throw new HTTPException(400, {
        message: 'Idempotency-Key must be 8-120 characters.',
      });
    }

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = SendSmsInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');

    try {
      const result = await sendSmsBatch(c.env, {
        projectId,
        apiKeyId: null,
        senderId: parsed.data.senderId ?? null,
        message: parsed.data.message,
        recipients: parsed.data.recipients,
        idempotencyKey,
        actor: `admin:${admin.uid}`,
      }, { background: (work) => c.executionCtx.waitUntil(work) });

      return c.json(
        SendSmsResponseSchema.parse({
          batch: result.batch,
          records: result.records,
        }),
        result.replayed ? 200 : 201,
      );
    } catch (err) {
      if (err instanceof DomainError) {
        throw new HTTPException(err.status as 400 | 401 | 402 | 403 | 404 | 409, {
          message: err.message,
        });
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Insufficient available units')) {
        throw new HTTPException(402, { message: msg });
      }
      throw err;
    }
  },
);

// ---------- Publishable API keys ----------

adminProjectsRouter.post(
  '/:projectId/api-keys/publishable',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const project = await getProject(c.env, projectId);
    if (!project) throw new HTTPException(404, { message: 'Project not found.' });

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }
    const parsed = CreatePublishableApiKeyInputSchema.safeParse(body);
    if (!parsed.success) validationError(parsed.error.issues);

    const admin = c.get('admin');
    const apiKey = await createPublishableApiKey(
      c.env,
      projectId,
      {
        name: parsed.data.name,
        recipientMode: parsed.data.recipientMode,
        recipientList: parsed.data.recipientList ?? [],
        rateLimitPerMinute: parsed.data.rateLimitPerMinute,
        rateLimitPerHour: parsed.data.rateLimitPerHour,
        rateLimitPerDay: parsed.data.rateLimitPerDay,
        lifetimeUnitCap: parsed.data.lifetimeUnitCap,
        expiresAt: parsed.data.expiresAt ?? null,
      },
      admin.uid,
    );

    const warning =
      parsed.data.recipientMode === 'any'
        ? 'This key has no recipient restriction — it can send to any phone number until revoked or until its spend cap is reached.'
        : null;

    return c.json(
      ApiKeyCreateResponseSchema.parse({ apiKey, warning }),
      201,
    );
  },
);

// ---------- Sender ID assignments for a project ----------

adminProjectsRouter.get('/:projectId/sender-ids', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await getProject(c.env, projectId);
  if (!project) throw new HTTPException(404, { message: 'Project not found.' });

  const senderIds = await listAssignmentsForProject(c.env, projectId);
  return c.json(
    ProjectSenderIdListResponseSchema.parse({
      senderIds,
      count: senderIds.length,
    }),
  );
});

// Client-side request — a project asks for a new Sender ID.
// Any authenticated admin can act on behalf of a project during the
// transition; when real client auth lands, this gets its own gate.
adminProjectsRouter.post(
  '/:projectId/sender-ids',
  requireRole('super_admin', 'admin'),
  async (c) => {
    const projectId = c.req.param('projectId');
    const project = await getProject(c.env, projectId);
    if (!project) throw new HTTPException(404, { message: 'Project not found.' });

    const body = await c.req.json().catch(() => null);
    if (body === null) {
      throw new HTTPException(400, { message: 'Body must be valid JSON.' });
    }

    // Two modes are supported by this endpoint, distinguished by the
    // presence of `autoApprove` (admin) vs. just `value` (client request).
    const adminParsed = AdminCreateSenderIdInputSchema.safeParse(body);

    if (adminParsed.success) {
      // Admin fast-path: create value + assignment together.
      try {
        const admin = c.get('admin');
        const { senderId, assignment } = await adminCreateSenderId(
          c.env,
          adminParsed.data.value,
          projectId,
          admin.uid,
          adminParsed.data.autoApprove ?? false,
          adminParsed.data.notes ?? null,
        );
        return c.json({ senderId, assignment }, 201);
      } catch (err) {
        throw new HTTPException(400, {
          message: err instanceof Error ? err.message : 'Request failed.',
        });
      }
    }

    // Client-style request: just `{ value }`.
    const clientParsed = RequestSenderIdInputSchema.safeParse(body);
    if (!clientParsed.success) {
      throw new HTTPException(400, {
        message:
          clientParsed.error.issues[0]?.message ?? 'Invalid request body.',
      });
    }

    try {
      const result = await requestSenderId(
        c.env,
        projectId,
        clientParsed.data.value,
      );
      return c.json(result, 201);
    } catch (err) {
      throw new HTTPException(409, {
        message: err instanceof Error ? err.message : 'Request failed.',
      });
    }
  },
);