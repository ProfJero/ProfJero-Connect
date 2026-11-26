import { Hono } from 'hono';
import { HealthResponseSchema, type HealthResponse } from '@profjero/shared';
import type { Env } from '../types/env';

export const healthRouter = new Hono<{ Bindings: Env }>();

healthRouter.get('/health', (c) => {
  const body: HealthResponse = {
    ok: true,
    service: 'profjero-sms-api',
    environment: c.env.ENVIRONMENT,
    version: '0.0.1',
    time: new Date().toISOString(),
  };

  // Parse before sending — if we ever break the shape, we find out here,
  // not in the web app's fetch handler.
  return c.json(HealthResponseSchema.parse(body));
});
/**
 * GET /health/ready — readiness for uptime monitors. Checks the database
 * round-trip (and that credentials work). Returns 503 when it can't, so a
 * monitor can page someone. Deliberately reveals nothing sensitive.
 */
healthRouter.get('/health/ready', async (c) => {
  const started = Date.now();
  try {
    const { firestoreGetDoc } = await import('../lib/firestore');
    await firestoreGetDoc(c.env, 'systemStatus', 'cron');
    return c.json({ ok: true, database: 'ok', latencyMs: Date.now() - started, time: new Date().toISOString() });
  } catch (err) {
    console.error('[health/ready] database check failed:', err);
    return c.json({ ok: false, database: 'unreachable', latencyMs: Date.now() - started, time: new Date().toISOString() }, 503);
  }
});
