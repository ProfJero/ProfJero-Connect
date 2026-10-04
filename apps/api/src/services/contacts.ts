import {
  firestoreBatchWrite,
  firestoreCreateDoc,
  firestoreDeleteDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  type BatchWrite,
  type FirestoreDoc,
} from '../lib/firestore';
import { isValidNormalizedPhone, normalizePhone } from '../lib/phone';
import { DomainError } from '../lib/domainError';
import { BUILTIN_TEMPLATE_FIELDS, normalizeFieldKey } from '@profjero/shared';
import type { Env } from '../types/env';
import type {
  ContactGroupColor,
  ContactGroupInput,
  ContactInput,
  ImportContacts,
  UpdateContact,
} from '@profjero/shared';

/**
 * Customer address book.
 *
 * contacts/{projectId}__{phone}  — the phone (normalized, 233…) is part of
 *   the doc ID, so one tenant can't hold the same number twice and imports
 *   are naturally idempotent.
 * contactGroups/{autoId}         — named lists; membership lives on the
 *   contact as `groupIds` so a contact can be in several groups.
 *
 * Every read is a single-field projectId query (no composite indexes);
 * filtering and sorting happen in memory. That's fine for the v1 scale of
 * a few thousand contacts per customer.
 */

const CONTACTS = 'contacts';
const GROUPS = 'contactGroups';

export interface Contact {
  id: string;
  projectId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  customFields: Record<string, string>;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroup {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  color: ContactGroupColor;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

function contactId(projectId: string, phone: string): string {
  return `${projectId}__${phone}`;
}

function parseContact(doc: FirestoreDoc): Contact {
  const d = doc.data;
  return {
    id: doc.id,
    projectId: String(d.projectId),
    name: String(d.name ?? ''),
    firstName: (d.firstName as string | null) ?? null,
    lastName: (d.lastName as string | null) ?? null,
    phone: String(d.phone),
    email: (d.email as string | null) ?? null,
    dateOfBirth: (d.dateOfBirth as string | null) ?? null,
    customFields: d.customFields && typeof d.customFields === 'object' ? (d.customFields as Record<string, string>) : {},
    groupIds: Array.isArray(d.groupIds) ? (d.groupIds as string[]) : [],
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
  };
}

function parseGroup(doc: FirestoreDoc, contactCount: number): ContactGroup {
  const d = doc.data;
  return {
    id: doc.id,
    projectId: String(d.projectId),
    name: String(d.name ?? ''),
    description: (d.description as string | null) ?? null,
    color: ((d.color as ContactGroupColor) ?? 'blue'),
    contactCount,
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
  };
}

/** Custom field keys are stored normalized ("Loyalty Points" → loyalty_points). */
export function cleanCustomFields(raw: Record<string, string> | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const key = normalizeFieldKey(k);
    if (!key || (BUILTIN_TEMPLATE_FIELDS as readonly string[]).includes(key)) continue;
    const value = String(v ?? '').trim();
    if (value) out[key] = value.slice(0, 200);
  }
  if (Object.keys(out).length > 20) throw new DomainError('At most 20 custom fields per contact.', 400);
  return out;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/**
 * Parse a date of birth from a spreadsheet: 1990-05-12, 12/05/1990,
 * 12-05-1990 (day first, as in Ghana), 12 May 1990, May 12 1990.
 * Returns YYYY-MM-DD or null when it can't be read unambiguously.
 */
export function parseDateOfBirth(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const ok = (y: number, m: number, d: number) => {
    if (y < 1900 || y > new Date().getFullYear() || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return ok(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return ok(+m[3], +m[2], +m[1]);
  m = v.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})[a-z]*,?\s+(\d{4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) return ok(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = v.match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (m && MONTHS[m[1].toLowerCase()]) return ok(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  return null;
}

/** Display name: explicit name, else first + last. */
function displayName(name?: string | null, first?: string | null, last?: string | null): string {
  return name?.trim() || [first?.trim(), last?.trim()].filter(Boolean).join(' ');
}

/** Normalize + validate, or throw a 400 naming the bad number. */
export function normalizeOrThrow(raw: string): string {
  const phone = normalizePhone(raw);
  if (!isValidNormalizedPhone(phone)) {
    throw new DomainError(`"${raw}" is not a valid phone number.`, 400);
  }
  return phone;
}

// ─────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────

export async function listContacts(env: Env, projectId: string): Promise<Contact[]> {
  const docs = await firestoreQuery(env, CONTACTS, [
    { field: 'projectId', op: 'EQUAL', value: projectId },
  ]);
  return docs
    .map(parseContact)
    .sort((a, b) => a.name.localeCompare(b.name) || a.phone.localeCompare(b.phone));
}

export async function listGroups(
  env: Env,
  projectId: string,
  contacts?: Contact[],
): Promise<ContactGroup[]> {
  const [groupDocs, all] = await Promise.all([
    firestoreQuery(env, GROUPS, [
      { field: 'projectId', op: 'EQUAL', value: projectId },
    ]),
    contacts ? Promise.resolve(contacts) : listContacts(env, projectId),
  ]);
  const counts = new Map<string, number>();
  for (const c of all) {
    for (const g of c.groupIds) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return groupDocs
    .map((d) => parseGroup(d, counts.get(d.id) ?? 0))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getOwnContact(env: Env, projectId: string, id: string): Promise<Contact> {
  const doc = await firestoreGetDoc(env, CONTACTS, id);
  if (!doc || doc.data.projectId !== projectId) {
    throw new DomainError('Contact not found.', 404);
  }
  return parseContact(doc);
}

async function getOwnGroupDoc(env: Env, projectId: string, id: string): Promise<FirestoreDoc> {
  const doc = await firestoreGetDoc(env, GROUPS, id);
  if (!doc || doc.data.projectId !== projectId) {
    throw new DomainError('Group not found.', 404);
  }
  return doc;
}

/** Reject group IDs that don't exist or belong to another tenant. */
async function assertOwnGroups(env: Env, projectId: string, groupIds: string[]): Promise<void> {
  for (const id of new Set(groupIds)) {
    await getOwnGroupDoc(env, projectId, id);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Contact writes
// ─────────────────────────────────────────────────────────────────────

export async function createContact(
  env: Env,
  projectId: string,
  input: ContactInput,
): Promise<Contact> {
  const phone = normalizeOrThrow(input.phone);
  const groupIds = [...new Set(input.groupIds ?? [])];
  await assertOwnGroups(env, projectId, groupIds);

  const now = new Date().toISOString();
  try {
    const doc = await firestoreCreateDoc(
      env,
      CONTACTS,
      {
        projectId,
        name: displayName(input.name, input.firstName, input.lastName),
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        phone,
        email: input.email ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        customFields: cleanCustomFields(input.customFields),
        groupIds,
        createdAt: now,
        updatedAt: now,
      },
      { docId: contactId(projectId, phone) },
    );
    return parseContact(doc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('409') || msg.includes('ALREADY_EXISTS')) {
      throw new DomainError(`A contact with number +${phone} already exists.`, 409);
    }
    throw err;
  }
}

export async function updateContact(
  env: Env,
  projectId: string,
  id: string,
  input: UpdateContact,
): Promise<Contact> {
  const existing = await getOwnContact(env, projectId, id);
  if (input.groupIds) await assertOwnGroups(env, projectId, input.groupIds);

  const next: Contact = {
    ...existing,
    firstName: input.firstName !== undefined ? input.firstName?.trim() || null : existing.firstName,
    lastName: input.lastName !== undefined ? input.lastName?.trim() || null : existing.lastName,
    name: '',
    email: input.email !== undefined ? input.email ?? null : existing.email,
    dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : existing.dateOfBirth,
    customFields: input.customFields !== undefined ? cleanCustomFields(input.customFields) : existing.customFields,
    groupIds: input.groupIds ? [...new Set(input.groupIds)] : existing.groupIds,
    phone: input.phone ? normalizeOrThrow(input.phone) : existing.phone,
    updatedAt: new Date().toISOString(),
  };
  // Name follows first/last when those change and no explicit name is given.
  next.name =
    input.name?.trim() ||
    (input.firstName !== undefined || input.lastName !== undefined
      ? displayName(null, next.firstName, next.lastName) || existing.name
      : existing.name);

  const fields = {
    projectId,
    name: next.name,
    firstName: next.firstName,
    lastName: next.lastName,
    phone: next.phone,
    email: next.email,
    dateOfBirth: next.dateOfBirth,
    customFields: next.customFields,
    groupIds: next.groupIds,
    createdAt: next.createdAt,
    updatedAt: next.updatedAt,
  };

  if (next.phone === existing.phone) {
    await firestoreUpdateDoc(env, CONTACTS, id, fields);
    return next;
  }

  // Phone changed → the doc ID changes. Move atomically; fail if the new
  // number already belongs to another contact.
  const newId = contactId(projectId, next.phone);
  try {
    await firestoreBatchWrite(env, [
      { path: `${CONTACTS}/${newId}`, fields, precondition: { exists: false } },
      { deletePath: `${CONTACTS}/${id}` },
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ALREADY_EXISTS') || msg.includes('409')) {
      throw new DomainError(`A contact with number +${next.phone} already exists.`, 409);
    }
    throw err;
  }
  return { ...next, id: newId };
}

export async function deleteContacts(
  env: Env,
  projectId: string,
  ids: string[],
): Promise<number> {
  const unique = [...new Set(ids)];
  for (const id of unique) await getOwnContact(env, projectId, id);
  if (unique.length === 1) {
    await firestoreDeleteDoc(env, CONTACTS, unique[0]);
  } else {
    await firestoreBatchWrite(
      env,
      unique.map((id) => ({ deletePath: `${CONTACTS}/${id}` })),
    );
  }
  return unique.length;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: Array<{ phone: string; reason: string }>;
}

/**
 * Bulk upsert. Numbers already in the address book keep their data; they
 * only gain the target group (and a name, if they had none). Invalid and
 * duplicate rows are reported back rather than failing the whole import.
 */
export async function importContacts(
  env: Env,
  projectId: string,
  input: ImportContacts,
): Promise<ImportResult> {
  if (input.groupId) await assertOwnGroups(env, projectId, [input.groupId]);

  const existing = new Map(
    (await listContacts(env, projectId)).map((c) => [c.phone, c]),
  );
  const now = new Date().toISOString();
  const seen = new Set<string>();
  const writes: BatchWrite[] = [];
  const result: ImportResult = { created: 0, updated: 0, skipped: [] };

  for (const row of input.contacts) {
    const phone = normalizePhone(row.phone);
    if (!isValidNormalizedPhone(phone)) {
      result.skipped.push({ phone: row.phone, reason: 'Invalid phone number' });
      continue;
    }
    if (seen.has(phone)) {
      result.skipped.push({ phone: row.phone, reason: 'Duplicate in file' });
      continue;
    }
    seen.add(phone);
    const firstName = row.firstName?.trim() || null;
    const lastName = row.lastName?.trim() || null;
    const name = displayName(row.name, firstName, lastName);
    const email = row.email?.trim() && row.email.includes('@') ? row.email.trim() : null;
    const dateOfBirth = parseDateOfBirth(row.dateOfBirth);
    let customFields: Record<string, string>;
    try {
      customFields = cleanCustomFields(row.customFields);
    } catch {
      result.skipped.push({ phone: row.phone, reason: 'More than 20 custom fields' });
      continue;
    }

    const current = existing.get(phone);
    if (current) {
      const groupIds =
        input.groupId && !current.groupIds.includes(input.groupId)
          ? [...current.groupIds, input.groupId]
          : current.groupIds;
      // Default: only fill what's blank. updateExisting: the file wins.
      const pick = <T,>(fromFile: T | null, cur: T | null): T | null =>
        input.updateExisting ? (fromFile ?? cur) : (cur || fromFile);
      const placeholderName = !current.name || current.name === `+${phone}`;
      const fields = {
        groupIds,
        name: input.updateExisting ? name || current.name : placeholderName && name ? name : current.name,
        firstName: pick(firstName, current.firstName),
        lastName: pick(lastName, current.lastName),
        email: pick(email, current.email),
        dateOfBirth: pick(dateOfBirth, current.dateOfBirth),
        customFields: input.updateExisting
          ? { ...current.customFields, ...customFields }
          : { ...customFields, ...current.customFields },
      };
      const changed =
        fields.groupIds !== current.groupIds ||
        fields.name !== current.name ||
        fields.firstName !== current.firstName ||
        fields.lastName !== current.lastName ||
        fields.email !== current.email ||
        fields.dateOfBirth !== current.dateOfBirth ||
        JSON.stringify(fields.customFields) !== JSON.stringify(current.customFields);
      if (!changed) {
        result.skipped.push({ phone: row.phone, reason: 'Already in contacts' });
        continue;
      }
      writes.push({
        path: `${CONTACTS}/${current.id}`,
        fields: { ...fields, updatedAt: now },
        updateFieldPaths: [...Object.keys(fields), 'updatedAt'],
      });
      result.updated += 1;
    } else {
      writes.push({
        path: `${CONTACTS}/${contactId(projectId, phone)}`,
        fields: {
          projectId,
          name: name || `+${phone}`,
          firstName,
          lastName,
          phone,
          email,
          dateOfBirth,
          customFields,
          groupIds: input.groupId ? [input.groupId] : [],
          createdAt: now,
          updatedAt: now,
        },
      });
      result.created += 1;
    }
  }

  await firestoreBatchWrite(env, writes);
  return result;
}

// ─────────────────────────────────────────────────────────────────────
// Group writes
// ─────────────────────────────────────────────────────────────────────

const MAX_GROUPS = 100;

export async function createGroup(
  env: Env,
  projectId: string,
  input: ContactGroupInput,
): Promise<ContactGroup> {
  const groups = await listGroups(env, projectId);
  if (groups.length >= MAX_GROUPS) {
    throw new DomainError(`You can have at most ${MAX_GROUPS} groups.`, 409);
  }
  if (groups.some((g) => g.name.toLowerCase() === input.name.toLowerCase())) {
    throw new DomainError(`A group named "${input.name}" already exists.`, 409);
  }
  const now = new Date().toISOString();
  const doc = await firestoreCreateDoc(env, GROUPS, {
    projectId,
    name: input.name,
    description: input.description ?? null,
    color: input.color ?? 'blue',
    createdAt: now,
    updatedAt: now,
  });
  return parseGroup(doc, 0);
}

export async function updateGroup(
  env: Env,
  projectId: string,
  id: string,
  input: Partial<ContactGroupInput>,
): Promise<ContactGroup> {
  await getOwnGroupDoc(env, projectId, id);
  if (input.name) {
    const groups = await listGroups(env, projectId);
    if (groups.some((g) => g.id !== id && g.name.toLowerCase() === input.name!.toLowerCase())) {
      throw new DomainError(`A group named "${input.name}" already exists.`, 409);
    }
  }
  const fields: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.name !== undefined) fields.name = input.name;
  if (input.description !== undefined) fields.description = input.description ?? null;
  if (input.color !== undefined) fields.color = input.color;
  await firestoreUpdateDoc(env, GROUPS, id, fields);
  const groups = await listGroups(env, projectId);
  const updated = groups.find((g) => g.id === id);
  if (!updated) throw new DomainError('Group not found.', 404);
  return updated;
}

/** Deletes the group and removes it from every member. Contacts stay. */
export async function deleteGroup(env: Env, projectId: string, id: string): Promise<void> {
  await getOwnGroupDoc(env, projectId, id);
  const contacts = await listContacts(env, projectId);
  const now = new Date().toISOString();
  const writes: BatchWrite[] = contacts
    .filter((c) => c.groupIds.includes(id))
    .map((c) => ({
      path: `${CONTACTS}/${c.id}`,
      fields: { groupIds: c.groupIds.filter((g) => g !== id), updatedAt: now },
      updateFieldPaths: ['groupIds', 'updatedAt'],
    }));
  writes.push({ deletePath: `${GROUPS}/${id}` });
  await firestoreBatchWrite(env, writes);
}

export async function setGroupMembership(
  env: Env,
  projectId: string,
  groupId: string,
  contactIds: string[],
  action: 'add' | 'remove',
): Promise<number> {
  await getOwnGroupDoc(env, projectId, groupId);
  const byId = new Map((await listContacts(env, projectId)).map((c) => [c.id, c]));
  const now = new Date().toISOString();
  const writes: BatchWrite[] = [];
  for (const id of new Set(contactIds)) {
    const c = byId.get(id);
    if (!c) continue; // Not this tenant's contact (or deleted) — ignore.
    const has = c.groupIds.includes(groupId);
    if (action === 'add' && has) continue;
    if (action === 'remove' && !has) continue;
    writes.push({
      path: `${CONTACTS}/${c.id}`,
      fields: {
        groupIds:
          action === 'add'
            ? [...c.groupIds, groupId]
            : c.groupIds.filter((g) => g !== groupId),
        updatedAt: now,
      },
      updateFieldPaths: ['groupIds', 'updatedAt'],
    });
  }
  await firestoreBatchWrite(env, writes);
  return writes.length;
}

// ─────────────────────────────────────────────────────────────────────
// Send-time expansion
// ─────────────────────────────────────────────────────────────────────

/**
 * Full contacts for the given contact and group IDs, scoped to this tenant
 * (used to personalise messages). Unknown IDs are ignored.
 */
export async function resolveContacts(
  env: Env,
  projectId: string,
  contactIds: string[],
  groupIds: string[],
): Promise<Contact[]> {
  if (contactIds.length === 0 && groupIds.length === 0) return [];
  const wantedContacts = new Set(contactIds);
  const wantedGroups = new Set(groupIds);
  return (await listContacts(env, projectId)).filter(
    (c) => wantedContacts.has(c.id) || c.groupIds.some((g) => wantedGroups.has(g)),
  );
}

/** Every custom field key used across this tenant's contacts (for the "Insert field" menu). */
export async function listCustomFieldKeys(env: Env, projectId: string): Promise<string[]> {
  const keys = new Set<string>();
  for (const c of await listContacts(env, projectId)) for (const k of Object.keys(c.customFields)) keys.add(k);
  return [...keys].sort();
}

/**
 * Phones for the given contacts and groups, scoped to this tenant.
 * Unknown IDs (deleted, or another tenant's) are ignored, never resolved.
 */
export async function resolveContactPhones(
  env: Env,
  projectId: string,
  contactIds: string[],
  groupIds: string[],
): Promise<string[]> {
  if (contactIds.length === 0 && groupIds.length === 0) return [];
  const contacts = await listContacts(env, projectId);
  const wantedContacts = new Set(contactIds);
  const wantedGroups = new Set(groupIds);
  return contacts
    .filter(
      (c) =>
        wantedContacts.has(c.id) || c.groupIds.some((g) => wantedGroups.has(g)),
    )
    .map((c) => c.phone);
}
