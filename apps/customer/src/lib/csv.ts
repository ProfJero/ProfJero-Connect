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

// ─────────────────────────────────────────────────────────────────────
// Column mapping for contact imports
// ─────────────────────────────────────────────────────────────────────

export type ColumnRole = 'phone' | 'name' | 'firstName' | 'lastName' | 'email' | 'dateOfBirth' | 'custom' | 'skip';

export const COLUMN_ROLE_LABELS: Record<ColumnRole, string> = {
  phone: 'Phone number',
  name: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  dateOfBirth: 'Date of birth',
  custom: 'Custom field',
  skip: "Don't import",
};

const ROLE_HEADERS: Array<[ColumnRole, string[]]> = [
  ['phone', PHONE_HEADERS],
  ['firstName', ['first name', 'firstname', 'first', 'given name', 'forename']],
  ['lastName', ['last name', 'lastname', 'last', 'surname', 'family name']],
  ['name', NAME_HEADERS],
  ['email', EMAIL_HEADERS],
  ['dateOfBirth', ['dob', 'date of birth', 'birthday', 'birth date', 'birthdate', 'd.o.b']],
];

/** Best guess for a column from its header; unknown headers become custom fields. */
export function guessRole(header: string): ColumnRole {
  const h = header.trim().toLowerCase().replace(/[_-]+/g, ' ');
  for (const [role, names] of ROLE_HEADERS) if (names.includes(h)) return role;
  return h ? 'custom' : 'skip';
}

export interface ImportTable {
  /** Header names (or "Column 1"…) */
  headers: string[];
  hasHeader: boolean;
  rows: string[][];
}

/** Parse a CSV into headers + rows, detecting whether the first row is a header. */
export function readImportTable(text: string): ImportTable {
  const all = parseCsv(text);
  if (all.length === 0) return { headers: [], hasHeader: false, rows: [] };
  const first = all[0];
  const looksLikeHeader = first.some((c) => guessRole(c) !== 'custom' && guessRole(c) !== 'skip') ||
    !first.some((c) => /^\+?[\d\s\-()]{7,}$/.test(c.trim()));
  const width = Math.max(...all.map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => (looksLikeHeader ? (first[i] ?? '').trim() : '') || `Column ${i + 1}`);
  return { headers, hasHeader: looksLikeHeader, rows: looksLikeHeader ? all.slice(1) : all };
}

export interface ImportRow {
  phone: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  customFields?: Record<string, string>;
}

/** Apply the chosen column roles to every row. */
export function mapImportRows(table: ImportTable, roles: ColumnRole[]): ImportRow[] {
  return table.rows
    .map((r) => {
      const out: ImportRow = { phone: '' };
      const custom: Record<string, string> = {};
      roles.forEach((role, i) => {
        const v = (r[i] ?? '').trim();
        if (!v || role === 'skip') return;
        if (role === 'custom') custom[table.headers[i]] = v;
        else out[role] = v;
      });
      if (Object.keys(custom).length) out.customFields = custom;
      return out;
    })
    .filter((r) => r.phone !== '');
}
