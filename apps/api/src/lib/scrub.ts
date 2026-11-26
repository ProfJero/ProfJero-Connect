/**
 * Customer-facing responses must never name an upstream provider
 * (state.md §7 "No provider names in customer UI"). Ledger descriptions,
 * payment failure reasons and SMS provider errors were written for the
 * admin and can contain those names, so every customer router passes
 * free text through here before returning it.
 */
const PROVIDER_PATTERNS: Array<[RegExp, string]> = [
  [/paystack/gi, 'payment'],
  [/arkesel/gi, 'SMS service'],
];

export function scrubProviderNames(text: string): string;
export function scrubProviderNames(text: string | null): string | null;
export function scrubProviderNames(text: string | null): string | null {
  if (text === null) return null;
  let out = text;
  for (const [re, replacement] of PROVIDER_PATTERNS) {
    out = out.replace(re, replacement);
  }
  return out;
}
