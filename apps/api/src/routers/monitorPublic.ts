import { Hono } from 'hono';
import { z } from 'zod';
import { count, clientIp, recordEvent } from '../lib/monitor';
import { memoryLimit } from '../lib/rateLimit';
import type { Env } from '../types/env';

/**
 * POST /monitor/client-error — the admin and customer apps report crashes
 * and failed screens here so they show up in Monitoring → Errors. No auth
 * (a crash can happen before sign-in); small, rate-limited per IP, sampled.
 */
export const monitorPublicRouter = new Hono<{ Bindings: Env }>();

const ClientErrorSchema = z.object({
  app: z.enum(['admin', 'customer']),
  message: z.string().max(500),
  stack: z.string().max(2000).optional(),
  url: z.string().max(300).optional(),
  release: z.string().max(40).optional(),
});

monitorPublicRouter.post('/client-error', async (c) => {
  memoryLimit(`clienterr:${clientIp(c)}`, 30, 60, 'error reports');
  const raw = await c.req.text();
  if (raw.length > 8_000) return c.json({ ok: false }, 413);
  let parsed;
  try {
    parsed = ClientErrorSchema.safeParse(JSON.parse(raw));
  } catch {
    return c.json({ ok: false }, 400);
  }
  if (!parsed.success) return c.json({ ok: false }, 400);
  const e = parsed.data;
  count({ client_err: 1, [`client_err_${e.app}`]: 1 });
  recordEvent(c.env, c, {
    kind: 'client_error',
    type: e.app,
    message: e.message,
    detail: { stack: e.stack?.split('\n').slice(0, 8).join('\n') ?? null, url: e.url ?? null, release: e.release ?? null },
  });
  return c.json({ ok: true }, 202);
});
