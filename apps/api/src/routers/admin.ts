import { Hono } from 'hono';
import { AdminHealthResponseSchema, AdminMeResponseSchema } from '@profjero/shared';
import { requireAuth } from '../middleware/auth';
import { adminProjectsRouter } from './adminProjects';
import { adminWalletsRouter } from './adminWallets';
import type { AuthVariables, Env } from '../types/env';
import { adminSmsLogsRouter } from './adminSmsLogs';
import { adminDashboardRouter } from './adminDashboard';
import { adminSenderIdsRouter } from './adminSenderIds';
import { adminPricingRouter } from './adminPricing';
import { adminPaymentsRouter } from './adminPayments';
import { adminProvidersRouter } from './adminProviders';

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
adminRouter.route('/wallets', adminWalletsRouter);
adminRouter.route('/sms', adminSmsLogsRouter);
adminRouter.route('/dashboard', adminDashboardRouter);
adminRouter.route('/sender-ids', adminSenderIdsRouter);
adminRouter.route('/pricing', adminPricingRouter);
adminRouter.route('/payments', adminPaymentsRouter);
adminRouter.route('/providers', adminProvidersRouter);