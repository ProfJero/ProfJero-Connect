/**
 * Personalised SMS templates.
 *
 *   "Hi {first_name}, your balance is {balance|0}. Happy birthday on {dob}!"
 *
 * - Placeholders are `{field}`; names are case-insensitive and spaces or
 *   dashes count as underscores (`{First Name}` = `{first_name}`).
 * - `{field|fallback}` uses the fallback when the recipient has no value.
 * - Unknown text in braces that isn't a valid name (e.g. "{ }") is left as is.
 *
 * Rendering happens before a send, per recipient, so billing (segments) and
 * the preview are exact for every message.
 */

const PLACEHOLDER = /\{\s*([A-Za-z][A-Za-z0-9 _-]{0,39}?)\s*(?:\|([^{}]{0,60}))?\}/g;

/** Canonical field key: lowercase, spaces/dashes → underscores. */
export function normalizeFieldKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/** Built-in fields every contact can provide (custom fields add more). */
export const BUILTIN_TEMPLATE_FIELDS = ['first_name', 'last_name', 'name', 'phone', 'email', 'dob'] as const;

export interface TemplateVariable {
  key: string;
  fallback: string | null;
}

/** The distinct variables used in a template (first fallback wins). */
export function extractVariables(template: string): TemplateVariable[] {
  const seen = new Map<string, TemplateVariable>();
  for (const m of template.matchAll(PLACEHOLDER)) {
    const key = normalizeFieldKey(m[1]);
    if (!key || seen.has(key)) continue;
    seen.set(key, { key, fallback: m[2] !== undefined ? m[2].trim() : null });
  }
  return [...seen.values()];
}

export function hasVariables(template: string): boolean {
  PLACEHOLDER.lastIndex = 0;
  const found = PLACEHOLDER.test(template);
  PLACEHOLDER.lastIndex = 0;
  return found;
}

export interface RenderResult {
  text: string;
  /** Variables with no value and no fallback (rendered as empty). */
  missing: string[];
}

/** Render one recipient's message. `vars` keys must be normalized. */
export function renderTemplate(template: string, vars: Record<string, string | null | undefined>): RenderResult {
  const missing = new Set<string>();
  const text = template.replace(PLACEHOLDER, (_whole, rawKey: string, fallback?: string) => {
    const key = normalizeFieldKey(rawKey);
    const value = vars[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
    if (fallback !== undefined) return fallback.trim();
    missing.add(key);
    return '';
  });
  // Tidy double spaces left by empty values ("Hi  ," → "Hi ,").
  return { text: text.replace(/ {2,}/g, ' ').trim(), missing: [...missing] };
}

/** Contact-like shape the renderer understands. */
export interface TemplateContact {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  customFields?: Record<string, string> | null;
}

/** Variables for a contact: built-ins (with sensible derivations) + custom fields. */
export function contactVariables(c: TemplateContact): Record<string, string> {
  const parts = (c.name ?? '').trim().split(/\s+/).filter(Boolean);
  const first = c.firstName?.trim() || parts[0] || '';
  const last = c.lastName?.trim() || (parts.length > 1 ? parts.slice(1).join(' ') : '');
  const full = c.name?.trim() || [first, last].filter(Boolean).join(' ');
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.customFields ?? {})) {
    const key = normalizeFieldKey(k);
    if (key && v !== null && v !== undefined) vars[key] = String(v);
  }
  // Built-ins win over a custom field with the same name.
  Object.assign(vars, {
    first_name: first,
    last_name: last,
    name: full,
    phone: c.phone,
    email: c.email ?? '',
    dob: c.dateOfBirth ?? '',
  });
  return vars;
}
