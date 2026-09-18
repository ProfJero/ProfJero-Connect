import { Hono } from 'hono';
import type { AuthVariables, Env } from './types/env';
import { errorHandler } from './middleware/errors';
import { healthRouter } from './routers/health';
import { adminRouter } from './routers/admin';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

app.onError(errorHandler);

app.route('/', healthRouter);
app.route('/admin', adminRouter);

export default app;