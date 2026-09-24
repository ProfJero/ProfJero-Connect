/**
 * SMS segment calculator implementing the GSM 03.38 standard.
 *
 * Billing semantics (matches Arkesel and every major SMS gateway):
 *   - Every GSM-7 basic character = 1 unit
 *   - Every GSM-7 extended character = 2 units (escape sequence)
 *   - A message using only GSM-7 chars sends as GSM-7
 *   - A message with any non-GSM-7 char sends as UCS-2
 *   - GSM-7: 1-160 units = 1 segment; else ceil(units / 153)
 *   - UCS-2: 1-70 code units = 1 segment; else ceil(codeUnits / 67)
 */

// GSM 03.38 default alphabet — 128 characters, each costs 1 unit.
const GSM7_BASIC = new Set<string>([
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', '\u001B', 'Æ', 'æ', 'ß', 'É',
  ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
  '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à',
]);

// GSM 03.38 extension table — each costs 2 units (escape + char).
const GSM7_EXTENDED = new Set<string>([
  '\f', '^', '{', '}', '\\', '[', '~', ']', '|', '€',
]);

export type SmsEncoding = 'GSM-7' | 'UCS-2';

export interface SegmentInfo {
  /** Which encoding will be used for this message. */
  encoding: SmsEncoding;
  /** Number of user-perceived characters (code points). */
  characterCount: number;
  /** Number of billable units before segmentation. */
  unitCount: number;
  /** Number of billable SMS segments. This is what the wallet charges. */
  segmentCount: number;
  /**
   * Characters in the message that forced UCS-2 encoding. Empty for GSM-7
   * messages. Useful for UI hints ("this emoji costs 2 UCS-2 units").
   */
  nonGsmChars: string[];
}

/**
 * Compute encoding, units, and segments for a message. This is the single
 * source of truth for wallet billing on the server and the live cost
 * preview on the client.
 */
export function getSegmentInfo(message: string): SegmentInfo {
  if (message.length === 0) {
    return {
      encoding: 'GSM-7',
      characterCount: 0,
      unitCount: 0,
      segmentCount: 1,
      nonGsmChars: [],
    };
  }

  // First pass: check GSM-7 compatibility and count units.
  let gsm7Units = 0;
  let characterCount = 0;
  const nonGsmChars: string[] = [];

  for (const char of message) {
    characterCount += 1;
    if (GSM7_BASIC.has(char)) {
      gsm7Units += 1;
    } else if (GSM7_EXTENDED.has(char)) {
      gsm7Units += 2;
    } else {
      nonGsmChars.push(char);
    }
  }

  if (nonGsmChars.length === 0) {
    const segmentCount =
      gsm7Units <= 160 ? 1 : Math.ceil(gsm7Units / 153);
    return {
      encoding: 'GSM-7',
      characterCount,
      unitCount: gsm7Units,
      segmentCount,
      nonGsmChars: [],
    };
  }

  // UCS-2 path. message.length counts UTF-16 code units, which is exactly
  // what carriers charge for (BMP chars = 1, emoji/surrogate pairs = 2).
  const codeUnits = message.length;
  const segmentCount = codeUnits <= 70 ? 1 : Math.ceil(codeUnits / 67);

  return {
    encoding: 'UCS-2',
    characterCount,
    unitCount: codeUnits,
    segmentCount,
    nonGsmChars,
  };
}

/**
 * Convenience wrapper for the hot path — returns just the billable segments.
 */
export function getSegmentCount(message: string): number {
  return getSegmentInfo(message).segmentCount;
}