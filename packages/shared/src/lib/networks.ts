/**
 * Ghana mobile networks, detected from the number prefix. Numbers can be
 * ported between networks, so treat the result as a strong hint (warn the
 * buyer), never as proof.
 */
export type GhanaNetwork = 'MTN' | 'Telecel' | 'AirtelTigo';

const PREFIXES: Record<string, GhanaNetwork> = {
  '24': 'MTN', '25': 'MTN', '53': 'MTN', '54': 'MTN', '55': 'MTN', '59': 'MTN',
  '20': 'Telecel', '50': 'Telecel',
  '26': 'AirtelTigo', '27': 'AirtelTigo', '56': 'AirtelTigo', '57': 'AirtelTigo',
};

/** Network for a Ghana number in any common format, or null if unknown. */
export function detectGhanaNetwork(phone: string): GhanaNetwork | null {
  let s = phone.trim().replace(/[\s\-()]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  if (s.startsWith('00')) s = s.slice(2);
  let local: string;
  if (s.startsWith('233') && s.length === 12) local = s.slice(3);
  else if (s.startsWith('0') && s.length === 10) local = s.slice(1);
  else return null;
  if (!/^\d{9}$/.test(local)) return null;
  return PREFIXES[local.slice(0, 2)] ?? null;
}

/**
 * Canonical network name for a provider label ("MTN", "Vodafone",
 * "AT", "AirtelTigo Ishare" …) so catalog and detected networks compare.
 */
export function canonicalNetwork(name: string): GhanaNetwork | null {
  const n = name.toLowerCase().replace(/[^a-z]/g, '');
  if (n.startsWith('mtn')) return 'MTN';
  if (n.startsWith('telecel') || n.startsWith('vodafone') || n === 'voda') return 'Telecel';
  if (n.startsWith('airtel') || n.startsWith('tigo') || n === 'at' || n.startsWith('atishare') || n.startsWith('atbigtime')) return 'AirtelTigo';
  return null;
}
