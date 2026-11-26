import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { DomainError } from '../lib/domainError';
import { recordServerError } from '../lib/monitor';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') ?? crypto.randomUUID();

  // Explicit HTTP errors (thrown by routers with HTTPException) — pass through.
  if (err instanceof HTTPException) {
    // Rate limits attach Retry-After on err.res; keep it.
    if (err.status >= 500) recordServerError(c, err);
    const retryAfter = err.res?.headers.get('Retry-After');
    if (retryAfter) c.header('Retry-After', retryAfter);
    return c.json<ApiErrorBody>(
      {
        error: {
          code: `http_${err.status}`,
          message: err.message,
          requestId,
        },
      },
      err.status,
    );
  }

  // Domain errors carry their own intended HTTP status. Used by services so
  // they don't have to import HTTP-specific types.
  if (err instanceof DomainError) {
    return c.json<ApiErrorBody>(
      {
        error: {
          code: `http_${err.status}`,
          message: err.message,
          requestId,
        },
      },
      err.status as 400 | 401 | 402 | 403 | 404 | 409 | 429 | 500,
    );
  }

  console.error(`[${requestId}]`, err);
  recordServerError(c, err);
  return c.json<ApiErrorBody>(
    {
      error: {
        code: 'internal_error',
        message: 'Something went wrong.',
        requestId,
      },
    },
    500,
  );
}