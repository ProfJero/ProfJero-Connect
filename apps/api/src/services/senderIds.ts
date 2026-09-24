import {
  createAssignment,
  createSenderId,
  getAssignment,
  getSenderId,
  listAssignmentsForValue,
  listPendingAssignments,
  listSenderIds,
  updateAssignmentStatus,
  updateSenderIdStatus,
} from '../repositories/senderIds';
import type { Env } from '../types/env';
import type {
  SenderId,
  SenderIdAssignment,
  SenderIdWithAssignments,
} from '@profjero/shared';

// ---------- Client-facing: request a Sender ID for a project ----------

export interface RequestResult {
  senderId: SenderId;
  assignment: SenderIdAssignment;
  /** True when the value already existed and was already approved. The
   *  caller's request is pending on the assignment only. */
  valueAlreadyApproved: boolean;
  /** True when the value is newly created (never seen before). */
  valueIsNew: boolean;
}

export async function requestSenderId(
  env: Env,
  projectId: string,
  value: string,
): Promise<RequestResult> {
  // 1. Assignment already exists?
  const existingAssignment = await getAssignment(env, projectId, value);
  if (existingAssignment) {
    throw new Error(
      `This project has already requested "${value}" (status: ${existingAssignment.status}).`,
    );
  }

  // 2. Value exists?
  const existingValue = await getSenderId(env, value);

  if (existingValue) {
    if (existingValue.status === 'rejected') {
      throw new Error(
        `Sender ID "${value}" was previously rejected: ${existingValue.rejectionReason ?? 'no reason given'}.`,
      );
    }

    // Value is pending or approved. Create the assignment as pending.
    // If the value is pending, the admin will approve both at once.
    // If it's approved, they'll approve just the assignment.
    const assignment = await createAssignment(
      env,
      projectId,
      value,
      'pending',
      null,
    );

    return {
      senderId: existingValue,
      assignment,
      valueAlreadyApproved: existingValue.status === 'approved',
      valueIsNew: false,
    };
  }

  // 3. Brand new value. Create as pending, and the first assignment pending.
  const senderId = await createSenderId(env, value, {
    status: 'pending',
    requestedByProjectId: projectId,
    adminUid: null,
  });
  const assignment = await createAssignment(
    env,
    projectId,
    value,
    'pending',
    null,
  );

  return {
    senderId,
    assignment,
    valueAlreadyApproved: false,
    valueIsNew: true,
  };
}

// ---------- Admin: approve / reject a value ----------

export async function approveSenderIdValue(
  env: Env,
  value: string,
  adminUid: string,
): Promise<SenderIdWithAssignments> {
  const existing = await getSenderId(env, value);
  if (!existing) throw new Error(`Sender ID "${value}" not found.`);
  if (existing.status === 'approved') {
    // Idempotent — return current state.
    return getSenderIdWithAssignments(env, value);
  }
  if (existing.status === 'rejected') {
    throw new Error(
      `Sender ID "${value}" was previously rejected and cannot be re-approved directly.`,
    );
  }

  // Approve the value.
  await updateSenderIdStatus(env, value, 'approved', adminUid, null);

  // Auto-approve the first-requester's assignment if it's still pending.
  if (existing.requestedByProjectId) {
    const firstAssignment = await getAssignment(
      env,
      existing.requestedByProjectId,
      value,
    );
    if (firstAssignment && firstAssignment.status === 'pending') {
      await updateAssignmentStatus(
        env,
        existing.requestedByProjectId,
        value,
        'approved',
        adminUid,
        'Auto-approved with value',
      );
    }
  }

  return getSenderIdWithAssignments(env, value);
}

export async function rejectSenderIdValue(
  env: Env,
  value: string,
  adminUid: string,
  reason: string,
): Promise<SenderIdWithAssignments> {
  const existing = await getSenderId(env, value);
  if (!existing) throw new Error(`Sender ID "${value}" not found.`);

  // Reject the value.
  await updateSenderIdStatus(env, value, 'rejected', adminUid, reason);

  // Cascade: reject every pending assignment for this value.
  const assignments = await listAssignmentsForValue(env, value);
  for (const a of assignments) {
    if (a.status === 'pending') {
      await updateAssignmentStatus(
        env,
        a.projectId,
        value,
        'rejected',
        adminUid,
        `Value rejected: ${reason}`,
      );
    }
  }

  return getSenderIdWithAssignments(env, value);
}

// ---------- Admin: approve / reject / revoke an assignment ----------

export async function approveAssignment(
  env: Env,
  projectId: string,
  value: string,
  adminUid: string,
): Promise<SenderIdAssignment> {
  const senderId = await getSenderId(env, value);
  if (!senderId) throw new Error(`Sender ID "${value}" not found.`);
  if (senderId.status !== 'approved') {
    throw new Error(
      `Cannot approve assignment: value "${value}" is currently ${senderId.status}.`,
    );
  }

  const assignment = await getAssignment(env, projectId, value);
  if (!assignment) {
    throw new Error(
      `No assignment for project "${projectId}" and Sender ID "${value}".`,
    );
  }
  if (assignment.status === 'approved') return assignment;

  return updateAssignmentStatus(env, projectId, value, 'approved', adminUid);
}

export async function rejectAssignment(
  env: Env,
  projectId: string,
  value: string,
  adminUid: string,
  notes: string | null,
): Promise<SenderIdAssignment> {
  const assignment = await getAssignment(env, projectId, value);
  if (!assignment) {
    throw new Error(
      `No assignment for project "${projectId}" and Sender ID "${value}".`,
    );
  }
  return updateAssignmentStatus(
    env,
    projectId,
    value,
    'rejected',
    adminUid,
    notes,
  );
}

export async function revokeAssignment(
  env: Env,
  projectId: string,
  value: string,
  adminUid: string,
  notes: string | null,
): Promise<SenderIdAssignment> {
  const assignment = await getAssignment(env, projectId, value);
  if (!assignment) {
    throw new Error(
      `No assignment for project "${projectId}" and Sender ID "${value}".`,
    );
  }
  return updateAssignmentStatus(
    env,
    projectId,
    value,
    'revoked',
    adminUid,
    notes,
  );
}

// ---------- Admin: fast-path direct creation ----------

export async function adminCreateSenderId(
  env: Env,
  value: string,
  projectId: string,
  adminUid: string,
  autoApprove: boolean,
  notes: string | null,
): Promise<{ senderId: SenderId; assignment: SenderIdAssignment }> {
  let senderId = await getSenderId(env, value);

  if (!senderId) {
    senderId = await createSenderId(env, value, {
      status: autoApprove ? 'approved' : 'pending',
      requestedByProjectId: projectId,
      adminUid,
    });
  } else if (autoApprove && senderId.status !== 'approved') {
    if (senderId.status === 'rejected') {
      throw new Error(
        `Sender ID "${value}" was previously rejected. Remove the rejection first.`,
      );
    }
    senderId = await updateSenderIdStatus(env, value, 'approved', adminUid, null);
  }

  const existingAssignment = await getAssignment(env, projectId, value);
  if (existingAssignment) {
    throw new Error(
      `Project already has an assignment for "${value}" (status: ${existingAssignment.status}).`,
    );
  }

  const assignment = await createAssignment(
    env,
    projectId,
    value,
    autoApprove ? 'approved' : 'pending',
    adminUid,
    notes,
  );

  return { senderId, assignment };
}

// ---------- Read helpers ----------

export async function getSenderIdWithAssignments(
  env: Env,
  value: string,
): Promise<SenderIdWithAssignments> {
  const senderId = await getSenderId(env, value);
  if (!senderId) throw new Error(`Sender ID "${value}" not found.`);

  const assignments = await listAssignmentsForValue(env, value);
  const { projectNameMap } = await import('../repositories/senderIds');
  const names = await projectNameMap(env);

  return {
    ...senderId,
    assignments: assignments.map((a) => ({
      ...a,
      projectName: names.get(a.projectId) ?? '(unknown project)',
    })),
  };
}

export async function listAllSenderIds(
  env: Env,
): Promise<SenderIdWithAssignments[]> {
  const senderIds = await listSenderIds(env);
  const { projectNameMap } = await import('../repositories/senderIds');
  const names = await projectNameMap(env);

  const out: SenderIdWithAssignments[] = [];
  for (const s of senderIds) {
    const assignments = await listAssignmentsForValue(env, s.value);
    out.push({
      ...s,
      assignments: assignments.map((a) => ({
        ...a,
        projectName: names.get(a.projectId) ?? '(unknown project)',
      })),
    });
  }
  return out;
}

// ---------- Enforcement hook (called by sms service) ----------

/**
 * Throw if the project cannot send using this Sender ID. Called before any
 * wallet reservation happens. Errors are user-safe messages.
 */
export async function assertSenderIdAllowed(
  env: Env,
  projectId: string,
  value: string,
): Promise<void> {
  const senderId = await getSenderId(env, value);
  if (!senderId) {
    throw new Error(
      `Sender ID "${value}" is not registered in ProfJero SMS. Request it from your dashboard.`,
    );
  }
  if (senderId.status === 'pending') {
    throw new Error(
      `Sender ID "${value}" is awaiting approval. You'll be notified once it's ready.`,
    );
  }
  if (senderId.status === 'rejected') {
    throw new Error(
      `Sender ID "${value}" was rejected: ${senderId.rejectionReason ?? 'no reason given'}.`,
    );
  }

  const assignment = await getAssignment(env, projectId, value);
  if (!assignment) {
    throw new Error(
      `Sender ID "${value}" is not assigned to this project. Request it from your dashboard.`,
    );
  }
  if (assignment.status === 'pending') {
    throw new Error(
      `Your request for Sender ID "${value}" is awaiting approval.`,
    );
  }
  if (assignment.status === 'rejected') {
    throw new Error(`Sender ID "${value}" was rejected for this project.`);
  }
  if (assignment.status === 'revoked') {
    throw new Error(`Sender ID "${value}" access has been revoked.`);
  }
}