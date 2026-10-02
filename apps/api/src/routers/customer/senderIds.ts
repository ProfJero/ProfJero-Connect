import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CustomerRequestSenderIdSchema,
  type SenderId,
  type SenderIdAssignment,
} from '@profjero/shared';
import { firestoreUpdateDoc } from '../../lib/firestore';
import {
  assignmentId,
  getSenderId,
  listAssignmentsForProject,
} from '../../repositories/senderIds';
import { requestSenderId } from '../../services/senderIds';
import { notifyProject } from '../../services/notifications';
import { parseBody } from './helpers';
import type { AuthVariables, Env } from '../../types/env';

const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

/**
 * The customer sees one status per Sender ID, folded from the two layers
 * (global value + their assignment). A pending value with a pending
 * assignment is simply "pending"; a rejected value explains itself via
 * `reason`.
 */
function toCustomerSenderId(a: SenderIdAssignment, value: SenderId | null) {
  let reason: string | null = null;
  if (a.status === 'rejected' || a.status === 'revoked') {
    reason =
      a.notes?.replace(/^Value rejected:\s*/, '') ??
      value?.rejectionReason ??
      null;
  }
  return {
    value: a.senderId,
    status: a.status,
    purpose: a.purpose ?? null,
    description: a.description ?? null,
    reason,
    requestedAt: a.requestedAt,
    decidedAt: a.decidedAt,
  };
}

/** GET /customer/sender-ids — the caller's Sender IDs, newest first. */
router.get('/sender-ids', async (c) => {
  const projectId = c.get('projectId')!;
  const assignments = await listAssignmentsForProject(c.env, projectId);
  const values = await Promise.all(
    assignments.map((a) => getSenderId(c.env, a.senderId)),
  );
  const senderIds = assignments.map((a, i) => toCustomerSenderId(a, values[i]));
  return c.json({ senderIds, count: senderIds.length });
});

/**
 * POST /customer/sender-ids — request a Sender ID.
 *
 * Lands in the admin's existing /sender-ids queue. Approval is manual
 * (the operator registers it with the SMS provider first), so this never
 * returns an approved Sender ID — see customer-platform.md §6.
 */
router.post('/sender-ids', async (c) => {
  const projectId = c.get('projectId')!;
  const input = await parseBody(c, CustomerRequestSenderIdSchema);
  const value = input.value.toUpperCase();

  let result;
  try {
    result = await requestSenderId(c.env, projectId, value);
  } catch (err) {
    // requestSenderId throws user-safe messages (already requested /
    // previously rejected).
    throw new HTTPException(409, {
      message: err instanceof Error ? err.message : 'Request failed.',
    });
  }

  await firestoreUpdateDoc(
    c.env,
    'senderIdAssignments',
    assignmentId(projectId, value),
    { purpose: input.purpose, description: input.description },
  );

  await notifyProject(c.env, {
    projectId,
    id: `sender_id_request__${projectId}__${value}`,
    type: 'sender_id',
    severity: 'info',
    title: `Sender ID "${value}" submitted for review`,
    body: `We've received your request for "${value}". Our team registers each Sender ID with the network before activation, which usually takes up to 1 business day. We'll notify you as soon as it's ready.`,
    link: '/messaging/sender-ids',
  });

  return c.json(
    {
      senderId: toCustomerSenderId(
        { ...result.assignment, purpose: input.purpose, description: input.description },
        result.senderId,
      ),
    },
    201,
  );
});

export { router as customerSenderIdsRouter };
