import { Hono } from 'hono';
import { AdminHealthResponseSchema, AdminMeResponseSchema } from '@profjero/shared';
import { requireAuth } from '../middleware/auth';
import { adminProjectsRouter } from './adminProjects';
import type { AuthVariables, Env } from '../types/env';

export const adminRouter = new Hono<{
  Bindings: Env;
  Variables: AuthVariables;
}>();

adminRouter.use('*', requireAuth);

adminRouter.get('/me', (c) => {
  const admin = c.get('admin');
  return c.json(AdminMeResponseSchema.parse(admin));
});

adminRouter.get('/health', (c) => {
  const admin = c.get('admin');
  return c.json(
    AdminHealthResponseSchema.parse({
      ok: true,
      adminUid: admin.uid,
      adminRole: admin.role,
      time: new Date().toISOString(),
    }),
  );
});

adminRouter.route('/projects', adminProjectsRouter);