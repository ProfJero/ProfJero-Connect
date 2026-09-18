import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') ?? crypto.randomUUID();

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