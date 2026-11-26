import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AdminRole } from '@profjero/shared';
import type { AuthVariables, Env } from '../types/env';

export function requireRole(
  ...allowed: AdminRole[]
): MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> {
  return async (c, next) => {
    const admin = c.get('admin');
    if (!admin) {
      throw new HTTPException(401, { message: 'Not authenticated.' });
    }
    if (!allowed.includes(admin.role)) {
      throw new HTTPException(403, {
        message: `Requires one of: ${allowed.join(', ')}`,
      });
    }
    await next();
  };
}