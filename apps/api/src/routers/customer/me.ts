import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { UpdateCustomerProfileRequestSchema } from '@profjero/shared';
import { customerAuth } from '../../middleware/customerAuth';
import { firestoreGetDoc, runTransaction } from '../../lib/firestore';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Every route in this file requires a verified customer.
router.use('*', customerAuth);

/**
 * GET /customer/me
 *
 * Returns the caller's customer profile + a small project summary.
 * The frontend uses this after every sign-in to populate AuthContext.
 */
router.get('/me', async (c) => {
  const customer = c.get('customer')!;
  const project = await firestoreGetDoc(c.env, 'projects', customer.projectId);

  if (!project) {
    // Customer doc exists but project doesn't — a broken state that only
    // happens if a doc was deleted by hand. Log and 500, don't route.
    console.error(
      `Customer ${customer.uid} references missing project ${customer.projectId}`,
    );
    throw new HTTPException(500, {
      message: 'Account data is inconsistent. Contact support.',
    });
  }

  return c.json({
    customer: {
      uid: customer.uid,
      email: customer.email,
      displayName: customer.displayName,
      organisationName: customer.organisationName,
      projectId: customer.projectId,
      status: customer.status,
    },
    project: {
      id: customer.projectId,
      name: (project.data.name as string) ?? '',
      origin: ((project.data.origin as string) ?? 'customer') as
        | 'admin'
        | 'customer',
    },
  });
});

/**
 * PUT /customer/me
 *
 * Partial update. Any subset of { displayName, organisationName, phone }.
 * When organisationName changes, we also rename the project doc — the
 * project name is the tenant's display name and the two must stay in sync.
 *
 * Returns the same shape as GET /customer/me so the frontend can update
 * its cache directly without a follow-up fetch.
 */
router.put('/me', async (c) => {
  const customer = c.get('customer')!;

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateCustomerProfileRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: `Validation failed — ${
        parsed.error.issues[0]?.message ?? 'invalid body'
      }`,
    });
  }
  const updates = parsed.data;

  const now = new Date().toISOString();
  const projectId = customer.projectId;

  // Build the field masks for each doc.
  const customerFields: Record<string, unknown> = { updatedAt: now };
  const customerFieldPaths: string[] = ['updatedAt'];
  const projectFields: Record<string, unknown> = {};
  const projectFieldPaths: string[] = [];

  if (updates.displayName !== undefined) {
    customerFields.displayName = updates.displayName;
    customerFieldPaths.push('displayName');
  }
  if (updates.phone !== undefined) {
    customerFields.phone = updates.phone;
    customerFieldPaths.push('phone');
  }
  if (updates.organisationName !== undefined) {
    customerFields.organisationName = updates.organisationName;
    customerFieldPaths.push('organisationName');
    projectFields.name = updates.organisationName;
    projectFields.updatedAt = now;
    projectFieldPaths.push('name', 'updatedAt');
  }

  await runTransaction(c.env, async (txn) => {
    txn.write({
      path: `customers/${customer.uid}`,
      fields: customerFields,
      updateFieldPaths: customerFieldPaths,
    });
    if (projectFieldPaths.length > 0) {
      txn.write({
        path: `projects/${projectId}`,
        fields: projectFields,
        updateFieldPaths: projectFieldPaths,
      });
    }
  });

  // Re-read so the response reflects what's actually stored.
  const [customerDoc, projectDoc] = await Promise.all([
    firestoreGetDoc(c.env, 'customers', customer.uid),
    firestoreGetDoc(c.env, 'projects', projectId),
  ]);

  if (!customerDoc || !projectDoc) {
    throw new HTTPException(500, {
      message: 'Update succeeded but re-read failed. Refresh and try again.',
    });
  }

  return c.json({
    customer: {
      uid: customerDoc.data.uid,
      email: customerDoc.data.email,
      displayName: customerDoc.data.displayName,
      organisationName: customerDoc.data.organisationName ?? null,
      projectId: customerDoc.data.projectId,
      status: customerDoc.data.status,
    },
    project: {
      id: projectId,
      name: (projectDoc.data.name as string) ?? '',
      origin: ((projectDoc.data.origin as string) ?? 'customer') as
        | 'admin'
        | 'customer',
    },
  });
});

export { router as customerMeRouter };