/**
 * Normalize a phone number to E.164-without-plus form: `233XXXXXXXXX`.
 *
 * Accepts:
 *   "+233240000010"     → 233240000010
 *   "233240000010"      → 233240000010
 *   "0240000010"        → 233240000010  (Ghana local, 10 digits starting 0)
 *   "+233 24 000 0010"  → 233240000010
 *   "00233240000010"    → 233240000010
 *
 * The Ghana-specific `0` → `233` rewrite only fires for 10-digit inputs
 * beginning with `0`. Other country codes pass through unchanged.
 */
export function normalizePhone(input: string): string {
  let s = input.trim().replace(/[\s\-()]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  if (s.startsWith('0') && s.length === 10) {
    s = '233' + s.slice(1);
  }
  return s;
}