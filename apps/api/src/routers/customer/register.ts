import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { RegisterCustomerRequestSchema } from '@profjero/shared';
import { verifyFirebaseIdToken } from '../../lib/firebase';
import { setCustomerClaim } from '../../lib/firebase';
import { createCustomerAndProject } from '../../services/customerService';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/**
 * POST /customer/register
 *
 * Called immediately after Firebase client-side signup. Cannot use
 * customerAuth (the doc doesn't exist yet); verifies the ID token directly.
 *
 * Ordering (important — prevents the deadlock where the claim exists but
 * the doc doesn't):
 *   1. Verify ID token → uid, email
 *   2. Create project + wallet + ledger + customer doc (idempotent)
 *   3. Set custom claim customer: true
 *   4. Return { customer, project, wallet, starterUnitsGranted, isNew }
 *
 * Client behavior after a 2xx:
 *   - Call user.getIdToken(true) to force-refresh the token with the
 *     new claim. Without this, the very next request will 403 with
 *     not_a_customer because the token in memory predates the claim.
 *   - Redirect to /dashboard.
 */
router.post('/register', async (c) => {
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

  const body = await c.req.json().catch(() => null);
  const parsed = RegisterCustomerRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Validation failed — ${parsed.error.issues[0]?.message ?? 'invalid body'}`,
    });
  }

  const result = await createCustomerAndProject(c.env, {
    uid: verified.uid,
    email: verified.email ?? '',
    displayName: parsed.data.displayName,
    organisationName: parsed.data.organisationName,
    phone: parsed.data.phone,
  });

  // Set the claim AFTER the doc exists. Self-healing: if this call fails,
  // the next call to /customer/register will see the existing doc and
  // re-attempt the claim without touching the ledger.
  if (result.isNew || !verified.customer) {
    try {
      await setCustomerClaim(c.env, verified.uid);
    } catch (err) {
      console.error('setCustomUserClaims failed:', err);
      // Do not throw — the doc is created; the client will get a working
      // session on the next register call or /customer/me refresh.
    }
  }

  const status = result.isNew ? 201 : 200;
  return c.json(
    {
      customer: result.customer,
      project: {
        id: result.projectId,
        name: result.projectName,
        origin: 'customer' as const,
      },
      wallet: result.wallet,
      starterUnitsGranted: result.starterUnitsGranted,
      isNew: result.isNew,
    },
    status,
  );
});

export { router as customerRegisterRouter };