import { v1Router, v1PublicRouter } from './routers/v1';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AuthVariables, Env } from './types/env';
import { errorHandler } from './middleware/errors';
import { healthRouter } from './routers/health';
import { adminRouter } from './routers/admin';
import { webhooksRouter } from './routers/webhooks';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// --- CORS ---
// Explicit allowlist. Do NOT use `origin: '*'` — with Authorization headers,
// wildcard origins are rejected by the browser, AND we don't want any random
// site hitting our admin API.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://profjeroconnect.pages.dev',
];

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null; // same-origin or non-browser (curl)
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
  }),
);

// --- Request ID ---
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

app.onError(errorHandler);

app.route('/', healthRouter);
app.route('/admin', adminRouter);

// Public routes first so they bypass v1Router's requireApiKey middleware.
app.route('/v1', v1PublicRouter);
app.route('/v1', v1Router);

app.route('/webhooks', webhooksRouter);

export default app;