import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CustomerRequestSenderIdSchema,
  checkSenderId,
  type SenderId,
  type SenderIdAssignment,
} from '@profjero/shared';
import { firestoreUpdateDoc } from '../../lib/firestore';
import {
  assignmentId,
  getAssignment as getAssignmentForProject,
  getSenderId,
  listAssignmentsForProject,
} from '../../repositories/senderIds';
import { autoDecideSenderId, requestSenderId } from '../../services/senderIds';
import { notifyProject } from '../../services/notifications';
import { parseBody } from './helpers';
import { getSettings } from '../../services/settings';
import { notifyAdmins } from '../../services/adminNotify';
import { durableLimit } from '../../lib/rateLimit';
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
    /** Automatic screen findings shown to the customer (review / reject reasons). */
    checks: a.autoCheck?.messages ?? [],
    providerStatus: a.status === 'approved' ? (a.providerStatus ?? 'not_sent') : null,
    providerFirstSentAt: a.providerFirstSentAt ?? null,
    providerVerifiedAt: a.providerVerifiedAt ?? null,
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
 * Screened instantly by the automatic checker (shared with the request
 * form, so the customer sees the same verdict while typing):
 *  - reject  → 400 with the reasons, nothing is stored;
 *  - approve → approved on the spot (when auto-approval is on and nobody
 *              else uses the name);
 *  - review  → pending for an admin, who is emailed.
 * Our SMS provider then verifies the name with the networks on the first
 * message sent from it.
 */
router.post('/sender-ids', async (c) => {
  const projectId = c.get('projectId')!;
  const customer = c.get('customer')!;
  const input = await parseBody(c, CustomerRequestSenderIdSchema);
  const value = input.value.toUpperCase();

  const check = checkSenderId(value, { organisationName: customer.organisationName, description: input.description });
  if (check.verdict === 'reject') {
    throw new HTTPException(400, { message: check.findings.filter((f) => f.verdict === 'reject').map((f) => f.message).join(' ') });
  }
  await durableLimit(c.env, `senderid:${projectId}`, 10, 86400, 'Sender ID requests today');

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

  const autoCheck = {
    verdict: check.verdict,
    codes: check.findings.map((f) => f.code),
    messages: check.findings.map((f) => f.message),
    matchesOrganisation: check.matchesOrganisation,
    checkedAt: new Date().toISOString(),
  };
  await firestoreUpdateDoc(c.env, 'senderIdAssignments', assignmentId(projectId, value), {
    purpose: input.purpose,
    description: input.description,
    autoCheck,
    providerStatus: 'not_sent',
  });

  const settings = await getSettings(c.env);
  const decision = await autoDecideSenderId(c.env, projectId, value, check.verdict, settings.sms.senderIdAutoApproval);

  if (decision === 'review') {
    const why = autoCheck.messages.length
      ? autoCheck.messages.join(' ')
      : result.valueIsNew
        ? 'Automatic approval is switched off.'
        : 'Another account already uses or requested this name.';
    await notifyProject(c.env, {
      projectId,
      id: `sender_id_request__${projectId}__${value}`,
      type: 'sender_id',
      severity: 'info',
      title: `Sender ID "${value}" is being reviewed`,
      body: `"${value}" needs a quick check by our team before it can be used (usually ${settings.sms.senderIdReviewSla}). We'll notify you as soon as it's decided.`,
      link: '/messaging/sender-ids',
    });
    await notifyAdmins(
      c.env,
      'emailOnSenderIdRequest',
      `Sender ID needs review: ${value}`,
      `${customer.organisationName ?? customer.email} requested Sender ID "${value}" (${input.purpose}).\n\nWhy it needs review: ${why}\n\nDescription:\n${input.description}\n\nApprove or reject it in Sender IDs.`,
    );
  }

  const fresh = await getAssignmentForProject(c.env, projectId, value);
  return c.json(
    {
      senderId: toCustomerSenderId(fresh ?? { ...result.assignment, purpose: input.purpose, description: input.description, autoCheck }, await getSenderId(c.env, value)),
      decision,
    },
    201,
  );
});

export { router as customerSenderIdsRouter };
