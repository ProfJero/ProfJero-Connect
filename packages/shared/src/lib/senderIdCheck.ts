/**
 * Automatic Sender ID screening.
 *
 * Runs in microseconds with no network or database calls, so the customer
 * sees the verdict while typing and the server decides the moment the
 * request arrives. It answers one question: is this name safe for us to
 * approve without a person looking at it?
 *
 *   reject  — format problems, government / regulator names, well-known
 *             brands, banks and networks, scam bait, generic words people
 *             use to spoof ("INFO", "ALERT", "BANK"), profanity.
 *   review  — close look-alikes of protected names ("G00GLE", "MTNN"),
 *             a brand name requested by an organisation that may own it,
 *             or a description too thin to judge. A person decides.
 *   approve — everything else.
 *
 * The final verification is done by our SMS provider (with the networks)
 * when the first message is sent; this screen only decides whether we
 * let the name through to that step.
 */

export type SenderIdVerdict = 'approve' | 'review' | 'reject';

export interface SenderIdFinding {
  code:
    | 'length'
    | 'characters'
    | 'no_letters'
    | 'spacing'
    | 'government'
    | 'brand'
    | 'generic'
    | 'scam'
    | 'profanity'
    | 'lookalike'
    | 'brand_owner'
    | 'description'
    | 'reserved';
  verdict: Exclude<SenderIdVerdict, 'approve'>;
  message: string;
}

export interface SenderIdCheckResult {
  verdict: SenderIdVerdict;
  findings: SenderIdFinding[];
  /** The organisation name and the Sender ID clearly match (shown as a positive hint). */
  matchesOrganisation: boolean;
}

export const SENDER_ID_MIN_LENGTH = 3;
export const SENDER_ID_MAX_LENGTH = 11;
export const SENDER_ID_DESCRIPTION_MIN = 50;

// Government, regulators, security services, public utilities and
// international bodies. Short codes (≤3 letters) only match as a whole
// word so "ECOSHOP" isn't caught by "EC".
const GOVERNMENT = [
  'GOV', 'GOVT', 'GOVERNMENT', 'GHANAGOV', 'GHGOV', 'PRESIDENT', 'PRESIDENCY', 'JUBILEEHOUSE',
  'PARLIAMENT', 'MINISTRYOF', 'JUDICIARY', 'SUPREMECOURT', 'HIGHCOURT', 'POLICE', 'GPS', 'CID', 'MTTD',
  'ARMY', 'NAVY', 'AIRFORCE', 'MILITARY', 'GAF', 'SOLDIER', 'PRISONS', 'IMMIGRATION', 'GIS', 'CUSTOMS', 'CEPS',
  'FIRESERVICE', 'GNFS', 'NADMO', 'NACOC', 'BNI', 'NIB', 'EOCO', 'OSP', 'CHRAJ', 'NCCE', 'ELECTORAL', 'ECGHANA',
  'GRA', 'TAX', 'NHIS', 'NHIA', 'GHS', 'MOH', 'MOE', 'MOF', 'MOFEP', 'GES', 'GTEC', 'WAEC', 'NAB', 'BOG',
  'BANKOFGHANA', 'NCA', 'SEC', 'NPA', 'NIA', 'GHANACARD', 'DVLA', 'SSNIT', 'NPRA', 'PURC', 'ECG', 'NEDCO', 'GWCL',
  'GRIDCO', 'VRA', 'GPHA', 'GACL', 'GCAA', 'FDA', 'GSA', 'EPA', 'COCOBOD', 'LANDSCOMM', 'NLA',
  'WHO', 'UNICEF', 'UNDP', 'UNITEDNATIONS', 'ECOWAS', 'AFRICANUNION', 'EMBASSY', 'COVID', 'MOHGHANA',
];

// Networks, banks, payments, big platforms and SMS providers — names
// people impersonate to phish.
const BRANDS = [
  'MTN', 'MTNGHANA', 'MOMO', 'MOBILEMONEY', 'TELECEL', 'VODAFONE', 'VODACASH', 'AIRTELTIGO', 'AIRTEL', 'TIGO',
  'GLO', 'ATMONEY', 'GCB', 'ECOBANK', 'ABSA', 'STANBIC', 'FIDELITY', 'CALBANK', 'ZENITH', 'UBA', 'ACCESSBANK',
  'FNB', 'SOCGEN', 'SOCIETEGENERALE', 'PRUDENTIAL', 'ADB', 'CBG', 'OMNIBSIC', 'FBN', 'STANCHART', 'STANDARDCHARTERED',
  'GTBANK', 'REPUBLICBANK', 'BANKOFAFRICA', 'NIBBANK', 'ARB', 'GHIPSS', 'GHLINK', 'VISA', 'MASTERCARD', 'PAYPAL',
  'PAYSTACK', 'FLUTTERWAVE', 'HUBTEL', 'EXPRESSPAY', 'ZEEPAY', 'GMONEY', 'GOOGLE', 'GMAIL', 'FACEBOOK', 'META',
  'WHATSAPP', 'INSTAGRAM', 'APPLE', 'ICLOUD', 'MICROSOFT', 'OUTLOOK', 'AMAZON', 'NETFLIX', 'TIKTOK', 'TELEGRAM',
  'TWITTER', 'YOUTUBE', 'BOLT', 'UBER', 'YANGO', 'JUMIA', 'DHL', 'FEDEX', 'UPS', 'BINANCE', 'COINBASE',
  'ARKESEL', 'MNOTIFY', 'NALO', 'BETWAY', 'SPORTYBET', 'BET9JA', 'GOIL', 'STARLINK', 'MOMOPAY', 'MTNMOMO',
];

/** Short brand codes that are distinctive enough to flag at the start of a name. */
const SHORT_BRAND_PREFIXES = ['MTN', 'MOMO', 'GCB', 'UBA', 'ABSA', 'FNB', 'CBG', 'DHL'];

/** Our own brand: never handed to a customer. */
const RESERVED = ['PROFJERO', 'PJCONNECT', 'PROFJEROCONNECT'];

// Whole-name generic words that make spoofing easy.
const GENERIC = [
  'INFO', 'ALERT', 'ALERTS', 'NOTICE', 'NOTIFY', 'SMS', 'MSG', 'MESSAGE', 'OTP', 'CODE', 'VERIFY', 'VERIFICATION',
  'SECURITY', 'SECURE', 'BANK', 'BANKING', 'PAYMENT', 'PAYMENTS', 'PAY', 'LOAN', 'LOANS', 'CREDIT', 'WALLET',
  'ACCOUNT', 'ADMIN', 'SUPPORT', 'SERVICE', 'CUSTOMER', 'CUSTOMERCARE', 'HELPDESK', 'TEST', 'TESTING', 'NOREPLY',
  'AUTH', 'LOGIN', 'PROMO', 'OFFER', 'DEALS', 'FREE', 'UPDATE', 'SYSTEM', 'OFFICIAL', 'GHANA', 'GH', 'NEWS',
];

// Scam bait anywhere in the name.
const SCAM = ['LOTTERY', 'WINNER', 'WINNERS', 'PRIZE', 'JACKPOT', 'FREEMONEY', 'CASHOUT', 'CLAIMNOW', 'GIVEAWAY', 'REWARDS', 'BONUSCASH', 'LOTTO', 'AWOOF'];

const PROFANITY = ['FUCK', 'SHIT', 'BITCH', 'ASSHOLE', 'DICK', 'PUSSY', 'CUNT', 'SEX', 'PORN', 'XXX', 'NUDE', 'KOTE', 'TWEA', 'GYIMIE'];

const LEET: Record<string, string> = { '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '7': 'T', '8': 'B', '9': 'G', '$': 'S', '@': 'A' };

/** Upper-case, letters/digits only. */
const squash = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
/** As squash, with digits read as the letters they imitate. */
const unleet = (s: string) => s.toUpperCase().replace(/[0-9$@]/g, (c) => LEET[c] ?? c).replace(/[^A-Z]/g, '');
const words = (s: string) => s.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);

/**
 * Government names: whole word for short codes (≤4), anywhere for longer
 * ones. Brands: whole word, or at the start ("APPLESTORE" but not
 * "PINEAPPLE"), so ordinary words that contain a brand still pass.
 */
function contains(value: string, token: string, mode: 'government' | 'brand' = 'government'): boolean {
  const ws = words(value);
  const sq = squash(value);
  const ul = unleet(value);
  if (ws.includes(token) || sq === token || ul === token) return true;
  if (token.length <= 4) return false;
  if (mode === 'brand') return sq.startsWith(token) || ul.startsWith(token);
  return sq.includes(token) || ul.includes(token);
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

/** The Sender ID is the organisation's name, initials or an obvious shortening of it. */
export function senderIdMatchesOrganisation(value: string, organisationName: string | null | undefined): boolean {
  if (!organisationName) return false;
  const v = squash(value);
  const orgWords = words(organisationName).filter((w) => !['LTD', 'LIMITED', 'CO', 'COMPANY', 'THE', 'AND', 'OF', 'GH', 'GHANA', 'ENT', 'ENTERPRISE', 'ENTERPRISES'].includes(w));
  if (orgWords.length === 0 || v.length < 2) return false;
  const joined = orgWords.join('');
  const initials = orgWords.map((w) => w[0]).join('');
  if (joined.startsWith(v) || v.startsWith(joined) || joined.includes(v) && v.length >= 4) return true;
  if (v === initials || v.startsWith(initials) && initials.length >= 2) return true;
  return orgWords.some((w) => w.length >= 4 && (v.includes(w) || (v.length >= 4 && w.startsWith(v))));
}

function describeQuality(description: string): string | null {
  const d = description.trim();
  if (d.length < SENDER_ID_DESCRIPTION_MIN) {
    return `Describe how you'll use it in at least ${SENDER_ID_DESCRIPTION_MIN} characters (${d.length} so far).`;
  }
  const ws = d.toLowerCase().split(/\s+/).filter(Boolean);
  const unique = new Set(ws);
  const letters = d.replace(/[^a-z]/gi, '');
  if (ws.length < 8 || unique.size < 6 || new Set(letters.toLowerCase()).size < 8) {
    return 'The description looks too thin to judge. Say who you will message and what about.';
  }
  return null;
}

export function checkSenderId(
  rawValue: string,
  context: { organisationName?: string | null; description?: string | null } = {},
): SenderIdCheckResult {
  const value = rawValue.trim();
  const findings: SenderIdFinding[] = [];
  const add = (f: SenderIdFinding) => findings.push(f);
  const matchesOrganisation = senderIdMatchesOrganisation(value, context.organisationName);

  // 1. Format (what the networks accept).
  if (value.length < SENDER_ID_MIN_LENGTH || value.length > SENDER_ID_MAX_LENGTH) {
    add({ code: 'length', verdict: 'reject', message: `Use ${SENDER_ID_MIN_LENGTH}–${SENDER_ID_MAX_LENGTH} characters (spaces count).` });
  }
  if (!/^[A-Za-z0-9 _-]*$/.test(value)) {
    add({ code: 'characters', verdict: 'reject', message: 'Only letters, numbers, spaces, hyphens and underscores are allowed.' });
  }
  if (value && !/[A-Za-z]/.test(value)) {
    add({ code: 'no_letters', verdict: 'reject', message: 'Include at least one letter — number-only Sender IDs are not allowed.' });
  }
  if (/\s{2,}/.test(value) || /^[ _-]|[ _-]$/.test(value)) {
    add({ code: 'spacing', verdict: 'reject', message: 'Remove double spaces and leading or trailing symbols.' });
  }
  if (findings.length > 0 || !value) {
    return { verdict: 'reject', findings, matchesOrganisation };
  }

  const sq = squash(value);
  const ul = unleet(value);

  // 2. Hard blocks.
  const reserved = RESERVED.find((t) => sq.includes(t) || ul.includes(t));
  if (reserved) add({ code: 'reserved', verdict: 'reject', message: 'This name is reserved by the platform.' });

  const gov = GOVERNMENT.find((t) => contains(value, t));
  if (gov) {
    add({ code: 'government', verdict: 'reject', message: `"${gov}" belongs to a government, regulatory or public body. These names need official authorisation — contact support if you represent the institution.` });
  }

  const scam = SCAM.find((t) => sq.includes(t) || ul.includes(t));
  if (scam) add({ code: 'scam', verdict: 'reject', message: 'Words like "winner", "prize" or "jackpot" are commonly used in scams and are not allowed.' });

  const rude = PROFANITY.find((t) => sq.includes(t) || ul.includes(t));
  if (rude) add({ code: 'profanity', verdict: 'reject', message: 'This Sender ID contains offensive language.' });

  if (GENERIC.includes(sq) || GENERIC.includes(ul)) {
    add({ code: 'generic', verdict: 'reject', message: 'Too generic — recipients can’t tell who it’s from. Use your business or brand name.' });
  }

  const brand = BRANDS.find((t) => contains(value, t, 'brand'));
  if (brand) {
    if (context.organisationName && contains(context.organisationName, brand, 'brand')) {
      add({ code: 'brand_owner', verdict: 'review', message: `"${brand}" is a protected brand. Because your organisation name includes it, our team will confirm ownership.` });
    } else {
      add({ code: 'brand', verdict: 'reject', message: `"${brand}" is a protected brand (a network, bank, payment or well-known company). Use your own business name.` });
    }
  }

  // 3. Look-alikes of protected names (G00GLE, MTNN, PAYSTAK, MTNPROMO…).
  const shortBrand = !brand ? SHORT_BRAND_PREFIXES.find((t) => sq.startsWith(t) || ul.startsWith(t)) : undefined;
  if (shortBrand && !(context.organisationName && contains(context.organisationName, shortBrand, 'brand'))) {
    add({ code: 'lookalike', verdict: 'review', message: `Starts with "${shortBrand}", a protected brand. Our team will check it isn't impersonation.` });
  }
  if (!gov && !brand && !reserved && !shortBrand) {
    const protectedNames = [...BRANDS, ...GOVERNMENT, ...RESERVED].filter((t) => t.length >= 5);
    const near = protectedNames.find((t) => ul !== t && sq !== t && (editDistance(ul, t) <= 1 || editDistance(sq, t) === 1));
    if (near) add({ code: 'lookalike', verdict: 'review', message: `Looks very similar to "${near}". Our team will check it isn't impersonation.` });
  }

  // 4. The description has to say what the messages are for.
  if (context.description !== undefined && context.description !== null) {
    const problem = describeQuality(context.description);
    if (problem) add({ code: 'description', verdict: context.description.trim().length < SENDER_ID_DESCRIPTION_MIN ? 'reject' : 'review', message: problem });
  }

  const verdict: SenderIdVerdict = findings.some((f) => f.verdict === 'reject')
    ? 'reject'
    : findings.some((f) => f.verdict === 'review')
      ? 'review'
      : 'approve';
  return { verdict, findings, matchesOrganisation };
}
