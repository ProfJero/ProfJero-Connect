import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreQuery,
  firestoreUpdateDoc,
} from '../lib/firestore';
import { listProjects } from './projects';
import type { Env } from '../types/env';
import type {
  SenderId,
  SenderIdAssignment,
  SenderIdValueStatus,
  SenderIdAssignmentStatus,
} from '@profjero/shared';

const VALUES = 'senderIds';
const ASSIGNMENTS = 'senderIdAssignments';

// ----- Parsers -----

function parseSenderId(value: string, data: Record<string, unknown>): SenderId {
  return {
    value,
    status: data.status as SenderIdValueStatus,
    requestedByProjectId: (data.requestedByProjectId as string | null) ?? null,
    requestedAt: String(data.requestedAt),
    approvedAt: (data.approvedAt as string | null) ?? null,
    approvedByAdminUid: (data.approvedByAdminUid as string | null) ?? null,
    rejectedAt: (data.rejectedAt as string | null) ?? null,
    rejectedByAdminUid: (data.rejectedByAdminUid as string | null) ?? null,
    rejectionReason: (data.rejectionReason as string | null) ?? null,
  };
}

function parseAssignment(
  id: string,
  data: Record<string, unknown>,
): SenderIdAssignment {
  return {
    projectId: String(data.projectId),
    senderId: String(data.senderId),
    status: data.status as SenderIdAssignmentStatus,
    requestedAt: String(data.requestedAt),
    decidedAt: (data.decidedAt as string | null) ?? null,
    decidedByAdminUid: (data.decidedByAdminUid as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    purpose: (data.purpose as string | null) ?? null,
    description: (data.description as string | null) ?? null,
  };
}

/** Deterministic assignment ID. */
export function assignmentId(projectId: string, value: string): string {
  return `${projectId}__${value}`;
}

// ----- Registry ops -----

export async function getSenderId(
  env: Env,
  value: string,
): Promise<SenderId | null> {
  const doc = await firestoreGetDoc(env, VALUES, value);
  return doc ? parseSenderId(doc.id, doc.data) : null;
}

export async function listSenderIds(
  env: Env,
  status?: SenderIdValueStatus,
): Promise<SenderId[]> {
  const { docs } = await firestoreListDocs(env, VALUES, { pageSize: 500 });
  const all = docs.map((d) => parseSenderId(d.id, d.data));
  const filtered = status ? all.filter((s) => s.status === status) : all;
  return filtered.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function createSenderId(
  env: Env,
  value: string,
  opts: {
    status: SenderIdValueStatus;
    requestedByProjectId: string | null;
    adminUid: string | null;
  },
): Promise<SenderId> {
  const now = new Date().toISOString();
  const isApproved = opts.status === 'approved';
  const isRejected = opts.status === 'rejected';

  const data = {
    value,
    status: opts.status,
    requestedByProjectId: opts.requestedByProjectId,
    requestedAt: now,
    approvedAt: isApproved ? now : null,
    approvedByAdminUid: isApproved ? opts.adminUid : null,
    rejectedAt: isRejected ? now : null,
    rejectedByAdminUid: isRejected ? opts.adminUid : null,
    rejectionReason: null,
  };

  try {
    const doc = await firestoreCreateDoc(env, VALUES, data, { docId: value });
    return parseSenderId(doc.id, doc.data);
  } catch (err) {
    // Concurrent create — another request landed first. Read it back.
    const existing = await getSenderId(env, value);
    if (existing) return existing;
    throw err;
  }
}

export async function updateSenderIdStatus(
  env: Env,
  value: string,
  status: SenderIdValueStatus,
  adminUid: string,
  rejectionReason: string | null = null,
): Promise<SenderId> {
  const now = new Date().toISOString();
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const fields: Record<string, unknown> = {
    status,
    approvedAt: isApproved ? now : null,
    approvedByAdminUid: isApproved ? adminUid : null,
    rejectedAt: isRejected ? now : null,
    rejectedByAdminUid: isRejected ? adminUid : null,
    rejectionReason: isRejected ? rejectionReason : null,
  };

  const doc = await firestoreUpdateDoc(env, VALUES, value, fields);
  return parseSenderId(doc.id, doc.data);
}

// ----- Assignment ops -----

export async function getAssignment(
  env: Env,
  projectId: string,
  value: string,
): Promise<SenderIdAssignment | null> {
  const id = assignmentId(projectId, value);
  const doc = await firestoreGetDoc(env, ASSIGNMENTS, id);
  return doc ? parseAssignment(doc.id, doc.data) : null;
}

export async function listAssignmentsForProject(
  env: Env,
  projectId: string,
): Promise<SenderIdAssignment[]> {
  const docs = await firestoreQuery(env, ASSIGNMENTS, [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  return docs
    .map((d) => parseAssignment(d.id, d.data))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function listAssignmentsForValue(
  env: Env,
  value: string,
): Promise<SenderIdAssignment[]> {
  const docs = await firestoreQuery(env, ASSIGNMENTS, [
    { field: 'senderId', op: 'EQUAL', value },
  ]);
  return docs
    .map((d) => parseAssignment(d.id, d.data))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function listPendingAssignments(
  env: Env,
): Promise<SenderIdAssignment[]> {
  const docs = await firestoreQuery(env, ASSIGNMENTS, [
    { field: 'status', op: 'EQUAL', value: 'pending' },
  ]);
  return docs
    .map((d) => parseAssignment(d.id, d.data))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export async function createAssignment(
  env: Env,
  projectId: string,
  value: string,
  status: SenderIdAssignmentStatus,
  adminUid: string | null,
  notes: string | null = null,
): Promise<SenderIdAssignment> {
  const id = assignmentId(projectId, value);
  const now = new Date().toISOString();
  const decided = status === 'approved' || status === 'rejected' || status === 'revoked';

  const data = {
    projectId,
    senderId: value,
    status,
    requestedAt: now,
    decidedAt: decided ? now : null,
    decidedByAdminUid: decided ? adminUid : null,
    notes,
  };

  try {
    const doc = await firestoreCreateDoc(env, ASSIGNMENTS, data, { docId: id });
    return parseAssignment(doc.id, doc.data);
  } catch (err) {
    const existing = await getAssignment(env, projectId, value);
    if (existing) return existing;
    throw err;
  }
}

export async function updateAssignmentStatus(
  env: Env,
  projectId: string,
  value: string,
  status: SenderIdAssignmentStatus,
  adminUid: string,
  notes: string | null = null,
): Promise<SenderIdAssignment> {
  const id = assignmentId(projectId, value);
  const now = new Date().toISOString();

  const doc = await firestoreUpdateDoc(env, ASSIGNMENTS, id, {
    status,
    decidedAt: now,
    decidedByAdminUid: adminUid,
    ...(notes !== null ? { notes } : {}),
  });
  return parseAssignment(doc.id, doc.data);
}

// ----- Project name enrichment helper -----

export async function projectNameMap(
  env: Env,
): Promise<Map<string, string>> {
  const projects = await listProjects(env, {});
  return new Map(projects.map((p) => [p.id, p.name]));
}