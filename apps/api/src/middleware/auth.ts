import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AdminSchema } from '@profjero/shared';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { firestoreGetDoc } from '../lib/firestore';
import type { AuthVariables, Env } from '../types/env';

export const requireAuth: MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthVariables;
}> = async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing bearer token.' });
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new HTTPException(401, { message: 'Empty bearer token.' });
  }

  let verified;
  try {
    verified = await verifyFirebaseIdToken(token, c.env);
  } catch (err) {
    console.error('ID token verification failed:', err);
    throw new HTTPException(401, { message: 'Invalid or expired token.' });
  }

  const doc = await firestoreGetDoc(c.env, 'admins', verified.uid);
  if (!doc) {
    throw new HTTPException(403, { message: 'Admin record not found.' });
  }

  const parsed = AdminSchema.safeParse({
    uid: verified.uid,
    email: doc.data.email ?? verified.email ?? '',
    displayName: doc.data.displayName ?? null,
    role: doc.data.role,
    status: doc.data.status,
    createdAt: doc.data.createdAt,
  });

  if (!parsed.success) {
    console.error('Admin record failed schema validation:', parsed.error.flatten());
    throw new HTTPException(500, { message: 'Admin record is malformed.' });
  }

  if (parsed.data.status !== 'active') {
    throw new HTTPException(403, { message: 'Admin account is disabled.' });
  }

  c.set('admin', parsed.data);
  await next();
};