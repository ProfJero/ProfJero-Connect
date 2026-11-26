/**
 * Client mirror of apps/api/src/lib/phone.ts so previews match what the
 * server will accept. The server re-validates; this is for feedback only.
 */
export function normalizePhone(input: string): string {
  let s = input.trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('0') && s.length === 10) s = '233' + s.slice(1);
  return s;
}

export function isValidNormalizedPhone(normalized: string): boolean {
  return /^[1-9][0-9]{8,14}$/.test(normalized);
}

/**
 * Split pasted text (newlines, commas, semicolons, tabs) into unique valid
 * numbers plus the entries that didn't parse.
 */
export function parsePhoneList(text: string): { valid: string[]; invalid: string[] } {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/[\n,;\t]+/)) {
    const entry = raw.trim();
    if (!entry) continue;
    const p = normalizePhone(entry);
    if (!isValidNormalizedPhone(p)) {
      invalid.push(entry);
    } else if (!seen.has(p)) {
      seen.add(p);
      valid.push(p);
    }
  }
  return { valid, invalid };
}
