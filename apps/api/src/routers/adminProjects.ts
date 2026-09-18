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