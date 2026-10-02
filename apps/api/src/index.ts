import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AuthVariables, Env } from './types/env';
import { errorHandler } from './middleware/errors';
import { healthRouter } from './routers/health';
import { adminRouter } from './routers/admin';
import { v1Router, v1PublicRouter } from './routers/v1';
import { webhooksRouter } from './routers/webhooks';
import { handleScheduled } from './services/cron';
import { customerRouter } from './routers/customer';
import { isAllowedOrigin } from './lib/origins';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---- CORS ----
// Origins live in lib/origins.ts (shared with the customer payment flow).

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (!origin) return null;
      return isAllowedOrigin(origin, (c.env as Env | undefined)?.ENVIRONMENT) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    credentials: false,
    maxAge: 86400,
  }),
);

// ---- Request ID ----
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

app.onError(errorHandler);

// Public v1 routes first (they skip requireApiKey).
app.route('/v1', v1PublicRouter);
app.route('/v1', v1Router);
app.route('/admin', adminRouter);
app.route('/customer', customerRouter);
app.route('/webhooks', webhooksRouter);
app.route('/', healthRouter);

// ---- Default export ----
// The Worker serves HTTP via `fetch` and runs scheduled jobs via `scheduled`.
export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
} satisfies ExportedHandler<Env>;