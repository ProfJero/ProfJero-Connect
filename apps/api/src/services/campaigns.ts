import {
  getSegmentInfo,
  type Campaign,
  type CampaignInput,
  type CampaignStatus,
  type MessageTemplate,
  type MessageTemplateInput,
} from '@profjero/shared';
import {
  firestoreCreateDoc,
  firestoreDeleteDoc,
  firestoreGetDoc,
  firestoreQuery,
  firestoreUpdateDoc,
  runTransaction,
  type FirestoreDoc,
} from '../lib/firestore';
import { DomainError } from '../lib/domainError';
import { composeSend } from './compose';
import { listContacts } from './contacts';
import { assertSenderIdAllowed } from './senderIds';
import { sendSmsBatch } from './sms';
import { getSettings } from './settings';
import { notifyProject } from './notifications';
import type { Env } from '../types/env';

const CAMPAIGNS = 'campaigns';
const TEMPLATES = 'messageTemplates';

// ─────────────────────────────────────────────────────────────────────
// Time zones (Intl is available in Workers)
// ─────────────────────────────────────────────────────────────────────

/** Calendar parts of `date` as seen in `tz`. */
export function zonedParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

/** The UTC instant for a wall-clock time in `tz`. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  let guess = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess), tz);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess -= asUtc - Date.UTC(year, month - 1, day, hour, minute);
  }
  return new Date(guess);
}

/** Next time it is `HH:mm` in `tz`, strictly after `after`. */
export function nextDailyRun(sendTime: string, tz: string, after: Date): Date {
  const [h, m] = sendTime.split(':').map(Number);
  const today = zonedParts(after, tz);
  let run = zonedTimeToUtc(today.year, today.month, today.day, h, m, tz);
  if (run.getTime() <= after.getTime()) {
    const tomorrow = zonedParts(new Date(after.getTime() + 86_400_000), tz);
    run = zonedTimeToUtc(tomorrow.year, tomorrow.month, tomorrow.day, h, m, tz);
  }
  return run;
}

function addInterval(from: Date, repeat: 'daily' | 'weekly' | 'monthly'): Date {
  const d = new Date(from);
  if (repeat === 'daily') d.setUTCDate(d.getUTCDate() + 1);
  else if (repeat === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
  else {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    // Clamp (31st → last day of a shorter month).
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d;
}

// ─────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────

function parseCampaign(doc: FirestoreDoc): Campaign {
  const d = doc.data;
  return {
    id: doc.id,
    projectId: String(d.projectId),
    name: String(d.name ?? ''),
    kind: (d.kind as Campaign['kind']) ?? 'once',
    status: (d.status as CampaignStatus) ?? 'scheduled',
    senderId: String(d.senderId ?? ''),
    message: String(d.message ?? ''),
    recipients: (d.recipients as string[]) ?? [],
    contactIds: (d.contactIds as string[]) ?? [],
    groupIds: (d.groupIds as string[]) ?? [],
    scheduledAt: (d.scheduledAt as string | null) ?? null,
    repeat: (d.repeat as Campaign['repeat']) ?? null,
    endsAt: (d.endsAt as string | null) ?? null,
    sendTime: (d.sendTime as string | null) ?? null,
    timezone: String(d.timezone ?? 'Africa/Accra'),
    nextRunAt: (d.nextRunAt as string | null) ?? null,
    lastRunAt: (d.lastRunAt as string | null) ?? null,
    lastBatchId: (d.lastBatchId as string | null) ?? null,
    lastError: (d.lastError as string | null) ?? null,
    runs: Number(d.runs ?? 0),
    estimate: (d.estimate as Campaign['estimate']) ?? null,
    recipientFields: (d.recipientFields as Record<string, Record<string, string>> | null) ?? null,
    createdAt: String(d.createdAt),
    updatedAt: String(d.updatedAt),
  };
}

export async function listCampaigns(env: Env, projectId: string): Promise<Campaign[]> {
  const docs = await firestoreQuery(env, CAMPAIGNS, [{ field: 'projectId', op: 'EQUAL', value: projectId }]);
  return docs.map(parseCampaign).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOwnCampaign(env: Env, projectId: string, id: string): Promise<Campaign> {
  const doc = await firestoreGetDoc(env, CAMPAIGNS, id);
  if (!doc || doc.data.projectId !== projectId) throw new DomainError('Campaign not found.', 404);
  return parseCampaign(doc);
}

/** Recipients + units a campaign would use right now (for the form and list). */
const fieldsMap = (r?: Record<string, Record<string, string>> | null) =>
  r ? new Map(Object.entries(r)) : undefined;

async function estimate(
  env: Env,
  projectId: string,
  input: CampaignInput,
  recipientFields?: Record<string, Record<string, string>>,
): Promise<{ recipients: number; units: number }> {
  const settings = await getSettings(env);
  if (input.kind === 'birthday') {
    // Rough: contacts in the audience with a date of birth, spread over a year.
    const contacts = await birthdayAudience(env, projectId, input.contactIds ?? [], input.groupIds ?? []);
    const withDob = contacts.filter((c) => !!c.dateOfBirth).length;
    return { recipients: withDob, units: withDob * getSegmentInfo(input.message).segmentCount };
  }
  const composed = await composeSend(env, projectId, {
    message: input.message,
    recipients: input.recipients,
    contactIds: input.contactIds,
    groupIds: input.groupIds,
    fieldsByPhone: fieldsMap(recipientFields),
    maxRecipients: settings.sms.maxRecipientsPerSend,
  });
  const units = composed.recipients.reduce(
    (s, r) => s + getSegmentInfo(composed.personalized?.get(r) ?? input.message).segmentCount,
    0,
  );
  return { recipients: composed.recipients.length, units };
}

async function birthdayAudience(env: Env, projectId: string, contactIds: string[], groupIds: string[]) {
  const all = await listContacts(env, projectId);
  if (contactIds.length === 0 && groupIds.length === 0) return all;
  const ids = new Set(contactIds);
  const groups = new Set(groupIds);
  return all.filter((c) => ids.has(c.id) || c.groupIds.some((g) => groups.has(g)));
}

function firstRun(input: CampaignInput, tz: string, now: Date): Date {
  if (input.kind === 'birthday') return nextDailyRun(input.sendTime!, tz, now);
  return new Date(input.scheduledAt!);
}

/** Validate and save a new campaign (or replace a scheduled one's details). */
export async function saveCampaign(
  env: Env,
  projectId: string,
  input: CampaignInput,
  actor: string,
  existingId?: string,
  /** Per-number variables supplied via the API (phone → fields). */
  recipientFields?: Record<string, Record<string, string>>,
): Promise<Campaign> {
  const settings = await getSettings(env);
  const tz = settings.general.timezone;
  const now = new Date();

  try {
    await assertSenderIdAllowed(env, projectId, input.senderId);
  } catch (err) {
    throw new DomainError(err instanceof Error ? err.message : 'Sender ID is not allowed.', 400);
  }
  const next = firstRun(input, tz, now);
  if (input.kind !== 'birthday' && next.getTime() < now.getTime() - 60_000) {
    throw new DomainError('The scheduled time is in the past.', 400);
  }
  if (next.getTime() > now.getTime() + 366 * 86_400_000) {
    throw new DomainError('Campaigns can be scheduled up to a year ahead.', 400);
  }
  if (recipientFields && JSON.stringify(recipientFields).length > 400_000) {
    throw new DomainError('Too much personalisation data for one scheduled send (max ~400 KB). Split it up.', 400);
  }
  const est = await estimate(env, projectId, input, recipientFields);

  const fields = {
    projectId,
    name: input.name,
    kind: input.kind,
    status: 'scheduled',
    senderId: input.senderId,
    message: input.message,
    recipients: input.recipients ?? [],
    contactIds: input.contactIds ?? [],
    groupIds: input.groupIds ?? [],
    scheduledAt: input.kind === 'birthday' ? null : input.scheduledAt!,
    repeat: input.kind === 'recurring' ? input.repeat! : null,
    endsAt: input.kind === 'recurring' ? input.endsAt ?? null : null,
    sendTime: input.kind === 'birthday' ? input.sendTime! : null,
    timezone: tz,
    nextRunAt: next.toISOString(),
    estimate: est,
    recipientFields: recipientFields ?? null,
    lastError: null,
    updatedAt: now.toISOString(),
    updatedBy: actor,
  };

  if (existingId) {
    const current = await getOwnCampaign(env, projectId, existingId);
    if (current.status !== 'scheduled') throw new DomainError(`A ${current.status} campaign can't be edited.`, 409);
    await firestoreUpdateDoc(env, CAMPAIGNS, existingId, fields);
    return getOwnCampaign(env, projectId, existingId);
  }

  const active = (await listCampaigns(env, projectId)).filter((c) => c.status === 'scheduled').length;
  if (active >= 50) throw new DomainError('You can have at most 50 scheduled campaigns. Cancel one first.', 409);

  const doc = await firestoreCreateDoc(env, CAMPAIGNS, {
    ...fields,
    runs: 0,
    lastRunAt: null,
    lastBatchId: null,
    createdAt: now.toISOString(),
    createdBy: actor,
  });
  return parseCampaign(doc);
}

export async function cancelCampaign(env: Env, projectId: string, id: string): Promise<Campaign> {
  const c = await getOwnCampaign(env, projectId, id);
  if (c.status !== 'scheduled') throw new DomainError(`A ${c.status} campaign can't be cancelled.`, 409);
  await firestoreUpdateDoc(env, CAMPAIGNS, id, { status: 'cancelled', nextRunAt: null, updatedAt: new Date().toISOString() });
  return { ...c, status: 'cancelled', nextRunAt: null };
}

/** Bring the next run forward to now; the dispatcher sends it within a minute. */
export async function sendCampaignNow(env: Env, projectId: string, id: string): Promise<Campaign> {
  const c = await getOwnCampaign(env, projectId, id);
  if (c.status !== 'scheduled') throw new DomainError(`A ${c.status} campaign can't be sent.`, 409);
  const now = new Date().toISOString();
  await firestoreUpdateDoc(env, CAMPAIGNS, id, { nextRunAt: now, updatedAt: now });
  return { ...c, nextRunAt: now };
}

export async function deleteCampaign(env: Env, projectId: string, id: string): Promise<void> {
  const c = await getOwnCampaign(env, projectId, id);
  if (c.status === 'sending') throw new DomainError('This campaign is sending right now. Try again in a minute.', 409);
  await firestoreDeleteDoc(env, CAMPAIGNS, id);
}

// ─────────────────────────────────────────────────────────────────────
// Dispatch (every minute, from the cron)
// ─────────────────────────────────────────────────────────────────────

/** Send every scheduled campaign whose time has come. */
export async function dispatchDueCampaigns(env: Env): Promise<{ dispatched: number; failed: number }> {
  const now = new Date();
  const due = (await firestoreQuery(env, CAMPAIGNS, [{ field: 'status', op: 'EQUAL', value: 'scheduled' }]))
    .map(parseCampaign)
    .filter((c) => c.nextRunAt && new Date(c.nextRunAt).getTime() <= now.getTime())
    .slice(0, 25); // the rest go next minute

  let dispatched = 0;
  let failed = 0;
  for (const c of due) {
    // Claim it so two dispatchers can't run the same campaign.
    const claimed = await runTransaction(env, async (txn) => {
      const doc = await txn.get(CAMPAIGNS, c.id);
      if (!doc || doc.data.status !== 'scheduled' || doc.data.nextRunAt !== c.nextRunAt) return false;
      txn.write({
        path: `${CAMPAIGNS}/${c.id}`,
        fields: { status: 'sending', updatedAt: now.toISOString() },
        updateFieldPaths: ['status', 'updatedAt'],
        precondition: { updateTime: doc.updateTime },
      });
      return true;
    });
    if (!claimed) continue;
    const ok = await runCampaign(env, c, now);
    if (ok) dispatched += 1;
    else failed += 1;
  }
  return { dispatched, failed };
}

async function runCampaign(env: Env, c: Campaign, now: Date): Promise<boolean> {
  const runNo = c.runs + 1;
  let batchId: string | null = null;
  let error: string | null = null;
  let skipped = false;

  try {
    const settings = await getSettings(env);
    let recipients: string[] | undefined = c.recipients;
    let contactIds: string[] | undefined = c.contactIds;
    let groupIds: string[] | undefined = c.groupIds;

    if (c.kind === 'birthday') {
      const today = zonedParts(now, c.timezone);
      const mmdd = `${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;
      const celebrants = (await birthdayAudience(env, c.projectId, c.contactIds, c.groupIds)).filter(
        (ct) => ct.dateOfBirth?.slice(5) === mmdd || (mmdd === '02-28' && ct.dateOfBirth?.slice(5) === '02-29' && !isLeap(today.year)),
      );
      recipients = undefined;
      groupIds = undefined;
      contactIds = celebrants.map((ct) => ct.id);
      if (contactIds.length === 0) skipped = true;
    }

    if (!skipped) {
      const composed = await composeSend(env, c.projectId, {
        message: c.message,
        recipients,
        contactIds,
        groupIds,
        fieldsByPhone: fieldsMap(c.recipientFields),
        maxRecipients: settings.sms.maxRecipientsPerSend,
      });
      batchId = `cmp_${c.id}_${runNo}`;
      await sendSmsBatch(env, {
        projectId: c.projectId,
        apiKeyId: null,
        senderId: c.senderId,
        message: c.message,
        recipients: composed.recipients,
        personalized: composed.personalized,
        idempotencyKey: batchId,
        actor: `campaign:${c.id}`,
        campaignId: c.id,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    error = msg.includes('Insufficient available units')
      ? "Your wallet didn't have enough units when this campaign was due. Top up and reschedule it."
      : msg;
    batchId = null;
  }

  // Next run, if any.
  let nextRunAt: string | null = null;
  if (c.kind === 'birthday') nextRunAt = nextDailyRun(c.sendTime ?? '08:00', c.timezone, now).toISOString();
  if (c.kind === 'recurring' && c.repeat) {
    let next = addInterval(new Date(c.nextRunAt ?? now.toISOString()), c.repeat);
    while (next.getTime() <= now.getTime()) next = addInterval(next, c.repeat); // skip missed slots
    if (!c.endsAt || next.getTime() <= new Date(c.endsAt).getTime()) nextRunAt = next.toISOString();
  }
  const status: CampaignStatus = nextRunAt ? 'scheduled' : error ? 'failed' : 'sent';

  await firestoreUpdateDoc(env, CAMPAIGNS, c.id, {
    status,
    nextRunAt,
    runs: skipped ? c.runs : runNo,
    lastRunAt: now.toISOString(),
    lastBatchId: batchId ?? c.lastBatchId,
    lastError: error,
    updatedAt: new Date().toISOString(),
  });

  if (error) {
    await notifyProject(env, {
      projectId: c.projectId,
      id: `campaign_failed__${c.id}__${runNo}`,
      type: 'sms',
      severity: 'error',
      title: `Campaign "${c.name}" was not sent`,
      body: error,
      link: '/messaging/campaigns',
      email: true,
    });
  } else if (!skipped && c.kind === 'once') {
    await notifyProject(env, {
      projectId: c.projectId,
      id: `campaign_sent__${c.id}`,
      type: 'sms',
      severity: 'success',
      title: `Campaign "${c.name}" is sending`,
      body: 'Your scheduled campaign started on time. Delivery reports appear in Message History.',
      link: batchId ? `/messaging/history/${encodeURIComponent(batchId)}` : '/messaging/history',
    });
  }
  return !error;
}

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

// ─────────────────────────────────────────────────────────────────────
// Saved message templates
// ─────────────────────────────────────────────────────────────────────

export async function listTemplates(env: Env, projectId: string): Promise<MessageTemplate[]> {
  const docs = await firestoreQuery(env, TEMPLATES, [{ field: 'projectId', op: 'EQUAL', value: projectId }]);
  return docs
    .map((d) => ({ id: d.id, name: String(d.data.name), body: String(d.data.body), createdAt: String(d.data.createdAt), updatedAt: String(d.data.updatedAt) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveTemplate(env: Env, projectId: string, input: MessageTemplateInput, id?: string): Promise<MessageTemplate> {
  const now = new Date().toISOString();
  if (id) {
    const doc = await firestoreGetDoc(env, TEMPLATES, id);
    if (!doc || doc.data.projectId !== projectId) throw new DomainError('Template not found.', 404);
    await firestoreUpdateDoc(env, TEMPLATES, id, { name: input.name, body: input.body, updatedAt: now });
    return { id, ...input, createdAt: String(doc.data.createdAt), updatedAt: now };
  }
  if ((await listTemplates(env, projectId)).length >= 100) throw new DomainError('You can save up to 100 templates.', 409);
  const doc = await firestoreCreateDoc(env, TEMPLATES, { projectId, ...input, createdAt: now, updatedAt: now });
  return { id: doc.id, ...input, createdAt: now, updatedAt: now };
}

export async function deleteTemplate(env: Env, projectId: string, id: string): Promise<void> {
  const doc = await firestoreGetDoc(env, TEMPLATES, id);
  if (!doc || doc.data.projectId !== projectId) throw new DomainError('Template not found.', 404);
  await firestoreDeleteDoc(env, TEMPLATES, id);
}
