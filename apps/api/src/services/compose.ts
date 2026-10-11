import { contactVariables, extractVariables, hasVariables, normalizeFieldKey, renderTemplate } from '@profjero/shared';
import { isValidNormalizedPhone, normalizePhone } from '../lib/phone';
import { DomainError } from '../lib/domainError';
import { listContacts, resolveContacts, type Contact } from './contacts';
import type { Env } from '../types/env';

export interface ComposeInput {
  message: string;
  /** Typed/pasted numbers. */
  recipients?: string[];
  contactIds?: string[];
  groupIds?: string[];
  /** Per-number variables supplied directly (API users), phone → fields. */
  fieldsByPhone?: Map<string, Record<string, string>>;
  maxRecipients: number;
}

export interface Composed {
  recipients: string[];
  /** phone → final text, only for personalised messages. */
  personalized?: Map<string, string>;
  /** Variables the template uses. */
  variables: string[];
}

/**
 * Turn a send request into the final recipient list and, for templates,
 * each recipient's text. Variables come from (in priority order) fields
 * supplied with the request, then the matching contact in the address book
 * (by contact/group selection or by phone number), then the placeholder's
 * fallback. A variable with no value and no fallback is an error naming how
 * many recipients are affected — never a silent "Hi ,".
 */
export async function composeSend(env: Env, projectId: string, input: ComposeInput): Promise<Composed> {
  const invalid: string[] = [];
  const phones: string[] = [];
  for (const raw of input.recipients ?? []) {
    const p = normalizePhone(raw);
    if (isValidNormalizedPhone(p)) phones.push(p);
    else invalid.push(raw);
  }
  if (invalid.length > 0) {
    const sample = invalid.slice(0, 3).map((v) => `"${v}"`).join(', ');
    throw new DomainError(
      `${invalid.length} invalid phone number${invalid.length === 1 ? '' : 's'}: ${sample}${invalid.length > 3 ? '…' : ''}. Use the format +233XXXXXXXXX or 0XXXXXXXXX.`,
      400,
    );
  }

  const personalised = hasVariables(input.message);
  const selected = await resolveContacts(env, projectId, input.contactIds ?? [], input.groupIds ?? []);
  const recipients = [...new Set([...phones, ...selected.map((c) => c.phone)])];

  if (recipients.length === 0) {
    throw new DomainError('No recipients — the selected contacts or groups are empty.', 400);
  }
  if (recipients.length > input.maxRecipients) {
    throw new DomainError(
      `Too many recipients (${recipients.length.toLocaleString('en-US')}). The maximum per send is ${input.maxRecipients.toLocaleString('en-US')}.`,
      400,
    );
  }

  const variables = extractVariables(input.message).map((v) => v.key);
  if (!personalised) return { recipients, variables };

  // Typed numbers that are also saved contacts get their details too.
  const byPhone = new Map<string, Contact>();
  for (const c of selected) byPhone.set(c.phone, c);
  if (phones.some((p) => !byPhone.has(p))) {
    for (const c of await listContacts(env, projectId)) if (!byPhone.has(c.phone)) byPhone.set(c.phone, c);
  }

  const out = new Map<string, string>();
  const missingCount = new Map<string, number>();
  for (const phone of recipients) {
    const contact = byPhone.get(phone);
    const vars: Record<string, string> = contact ? contactVariables(contact) : { phone };
    for (const [k, v] of Object.entries(input.fieldsByPhone?.get(phone) ?? {})) vars[normalizeFieldKey(k)] = v;
    const { text, missing } = renderTemplate(input.message, vars);
    for (const m of missing) missingCount.set(m, (missingCount.get(m) ?? 0) + 1);
    out.set(phone, text);
  }

  if (missingCount.size > 0) {
    const parts = [...missingCount.entries()].map(([k, n]) => `{${k}} is empty for ${n} recipient${n === 1 ? '' : 's'}`);
    const first = [...missingCount.keys()][0];
    throw new DomainError(
      `${parts.join('; ')}. Fill in those contacts, or add a fallback such as {${first}|Customer}.`,
      400,
    );
  }
  return { recipients, personalized: out, variables };
}
