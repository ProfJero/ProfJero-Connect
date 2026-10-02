import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { CustomerSchema } from '@profjero/shared';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { firestoreGetDoc } from '../lib/firestore';
import type { AuthVariables, Env } from '../types/env';

/**
 * Customer authentication middleware.
 *
 * Two-layer check:
 *   1. ID token must carry the `customer: true` custom claim.
 *   2. customers/{uid} doc must exist, be schema-valid, and be active.
 *
 * Distinct 403 codes let the client route correctly:
 *   not_a_customer            → log out, you're not a customer account
 *   incomplete_registration   → go to /complete-setup
 *   account_suspended         → contact support
 *
 * Standard 401 paths use HTTPException (consistent with requireAuth).
 * Distinct-code paths return JSON directly so errorHandler stays unchanged.
 */
export const customerAuth: MiddlewareHandler<{
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
    console.warn('ID token verification failed:', err instanceof Error ? `${err.name}: ${err.message}` : String(err));
    throw new HTTPException(401, { message: 'Invalid or expired token.' });
  }

  const requestId = c.get('requestId');

  // Layer 1: custom claim.
  // NOTE: assumes verifyFirebaseIdToken exposes decoded claims on `verified`.
  // If it currently returns only { uid, email }, extend it to return the
  // full decoded token (jose's jwtVerify payload). Then `verified.customer`
  // is available here. See adjustment note below.
  if (verified.customer !== true) {
    return c.json(
      {
        error: {
          code: 'not_a_customer',
          message:
            'This account is not a customer account. Sign up to continue.',
          requestId,
        },
      },
      403,
    );
  }

  // Layer 2: Firestore doc — source of truth for projectId + profile.
  const doc = await firestoreGetDoc(c.env, 'customers', verified.uid);
  if (!doc) {
    return c.json(
      {
        error: {
          code: 'incomplete_registration',
          message:
            'Your account setup is incomplete. Please finish setting up.',
          requestId,
        },
      },
      403,
    );
  }

  const parsed = CustomerSchema.safeParse({
    uid: verified.uid,
    email: doc.data.email ?? verified.email ?? '',
    displayName: doc.data.displayName ?? null,
    phone: doc.data.phone ?? null,
    organisationName: doc.data.organisationName ?? null,
    organizationId: doc.data.organizationId ?? null,
    projectId: doc.data.projectId,
    status: doc.data.status,
    emailVerified: doc.data.emailVerified ?? false,
    termsAcceptedAt: doc.data.termsAcceptedAt ?? null,
    onboardingCompletedAt: doc.data.onboardingCompletedAt ?? null,
    createdAt: doc.data.createdAt,
    updatedAt: doc.data.updatedAt,
  });

  if (!parsed.success) {
    console.error(
      'Customer record failed schema validation:',
      parsed.error.flatten(),
    );
    throw new HTTPException(500, { message: 'Customer record is malformed.' });
  }

  if (parsed.data.status !== 'active') {
    return c.json(
      {
        error: {
          code: 'account_suspended',
          message: 'Your account is suspended. Contact support.',
          requestId,
        },
      },
      403,
    );
  }

  c.set('customer', parsed.data);
  c.set('projectId', parsed.data.projectId);
  await next();
};