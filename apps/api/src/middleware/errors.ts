import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { DomainError } from '../lib/domainError';

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