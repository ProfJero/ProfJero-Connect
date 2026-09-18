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