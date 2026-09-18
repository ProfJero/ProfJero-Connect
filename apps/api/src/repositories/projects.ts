import {
  ProjectSchema,
  type Project,
  type ProjectStatus,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@profjero/shared';
import {
  firestoreCreateDoc,
  firestoreGetDoc,
  firestoreListDocs,
  firestoreUpdateDoc,
  type FirestoreDoc,
} from '../lib/firestore';
import type { Env } from '../types/env';

const COLLECTION = 'projects';

function parseProject(doc: FirestoreDoc): Project {
  const parsed = ProjectSchema.safeParse({ id: doc.id, ...doc.data });
  if (!parsed.success) {
    throw new Error(
      `Malformed project doc "${doc.id}": ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export async function listProjects(
  env: Env,
  filters: { status?: ProjectStatus; search?: string } = {},
): Promise<Project[]> {
  // NOTE: Firestore REST has no full-text search. We fetch all (up to 300) and
  // filter in memory. Fine for M2 scale. If project count crosses a few hundred,
  // switch to runQuery with structured filters, or add a lowercase `searchKey`
  // field indexed with array-contains on keywords.
  const { docs } = await firestoreListDocs(env, COLLECTION, { pageSize: 300 });

  let projects: Project[] = [];
  for (const d of docs) {
    try {
      projects.push(parseProject(d));
    } catch (err) {
      // Don't let one bad doc poison the whole list — log and skip.
      console.error('Skipping malformed project doc:', err);
    }
  }

  if (filters.status) {
    projects = projects.filter((p) => p.status === filters.status);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle) ||
        (p.contactEmail ?? '').toLowerCase().includes(needle),
    );
  }

  projects.sort((a, b) => a.name.localeCompare(b.name));
  return projects;
}

export async function getProject(env: Env, id: string): Promise<Project | null> {
  const doc = await firestoreGetDoc(env, COLLECTION, id);
  return doc ? parseProject(doc) : null;
}

export async function createProject(
  env: Env,
  input: CreateProjectInput,
  adminUid: string,
): Promise<Project> {
  const now = new Date().toISOString();
  const doc = await firestoreCreateDoc(env, COLLECTION, {
    name: input.name,
    description: input.description ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
    updatedBy: adminUid,
  });
  return parseProject(doc);
}

export async function updateProject(
  env: Env,
  id: string,
  patch: UpdateProjectInput,
  adminUid: string,
): Promise<Project | null> {
  const existing = await getProject(env, id);
  if (!existing) return null;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.contactEmail !== undefined) updates.contactEmail = patch.contactEmail;
  if (patch.contactPhone !== undefined) updates.contactPhone = patch.contactPhone;
  if (patch.status !== undefined) updates.status = patch.status;

  const doc = await firestoreUpdateDoc(env, COLLECTION, id, updates);
  return parseProject(doc);
}

export async function archiveProject(
  env: Env,
  id: string,
  adminUid: string,
): Promise<Project | null> {
  return updateProject(env, id, { status: 'archived' }, adminUid);
}