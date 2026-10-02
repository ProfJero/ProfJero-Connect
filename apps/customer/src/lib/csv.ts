/**
 * Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF).
 * Enough for contact lists exported from spreadsheets; no dependency.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',' || ch === ';' || ch === '\t') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ParsedContactRow {
  name?: string;
  phone: string;
  email?: string;
}

const PHONE_HEADERS = ['phone', 'phone number', 'mobile', 'number', 'msisdn', 'telephone', 'tel', 'contact'];
const NAME_HEADERS = ['name', 'full name', 'fullname', 'contact name'];
const EMAIL_HEADERS = ['email', 'e-mail', 'email address'];

/**
 * Map a CSV to contact rows. Uses a header row when one is recognised;
 * otherwise guesses the phone column as the one that looks most numeric.
 */
export function csvToContacts(text: string): ParsedContactRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const find = (names: string[]) => header.findIndex((h) => names.includes(h));
  let phoneCol = find(PHONE_HEADERS);
  const nameCol = find(NAME_HEADERS);
  const emailCol = find(EMAIL_HEADERS);
  const hasHeader = phoneCol >= 0 || nameCol >= 0;
  const body = hasHeader ? rows.slice(1) : rows;

  if (phoneCol < 0) {
    const width = Math.max(...body.map((r) => r.length));
    let best = 0;
    let bestScore = -1;
    for (let c = 0; c < width; c++) {
      const score = body.filter((r) => /^\+?[\d\s\-()]{7,}$/.test((r[c] ?? '').trim())).length;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    phoneCol = best;
  }

  return body
    .map((r) => ({
      phone: (r[phoneCol] ?? '').trim(),
      name: nameCol >= 0 ? (r[nameCol] ?? '').trim() || undefined : undefined,
      email: emailCol >= 0 ? (r[emailCol] ?? '').trim() || undefined : undefined,
    }))
    .filter((r) => r.phone !== '');
}

/** Read a File as text (UTF-8). */
export function readFileText(file: File): Promise<string> {
  return file.text();
}
