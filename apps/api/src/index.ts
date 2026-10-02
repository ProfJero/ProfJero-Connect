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

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ---- CORS ----
const allowedOrigins = [
  // Admin dashboard
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://profjeroconnect.pages.dev',
  // Customer platform
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://profjeroconnect-customer.pages.dev', // ← confirm/adjust
];

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      return allowedOrigins.includes(origin) ? origin : null;
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