/**
 * Data provider reference prices (GHS), from the provider's published
 * price list. "api" is what we actually pay through the API; "guest" is
 * what anyone pays on the provider's own site, so our price should stay
 * at or below it to be worth buying here.
 *
 * Bundles not listed here use the price the provider's API reports.
 */
export interface DataReferencePrice {
  api: number;
  member: number;
  guest: number;
}

export const DATA_REFERENCE_PRICES: Record<string, Record<string, DataReferencePrice>> = {
  MTN: {
    '1GB': { guest: 4.7, member: 4.5, api: 4.0 },
    '2GB': { guest: 9.4, member: 9.0, api: 8.0 },
    '3GB': { guest: 14.1, member: 13.5, api: 12.0 },
    '4GB': { guest: 18.8, member: 18.0, api: 16.0 },
    '5GB': { guest: 23.5, member: 22.5, api: 20.0 },
    '6GB': { guest: 28.2, member: 27.0, api: 24.0 },
    '8GB': { guest: 37.6, member: 36.0, api: 32.0 },
    '10GB': { guest: 47.0, member: 45.0, api: 40.0 },
    '15GB': { guest: 70.5, member: 67.5, api: 60.0 },
    '20GB': { guest: 94.0, member: 90.0, api: 80.0 },
    '25GB': { guest: 117.5, member: 112.5, api: 100.0 },
    '30GB': { guest: 141.0, member: 135.0, api: 120.0 },
  },
};

/** Default markup for newly synced bundles: keeps MTN prices below the provider's guest price. */
export const DEFAULT_DATA_MARKUP_PERCENT = 10;

const normSize = (size: string) => size.toUpperCase().replace(/\s+/g, '');
const normNetwork = (n: string) => {
  const s = n.toUpperCase().replace(/[^A-Z]/g, '');
  if (s.startsWith('MTN')) return 'MTN';
  if (s.startsWith('TELECEL') || s.startsWith('VODAFONE')) return 'Telecel';
  if (s.startsWith('AIRTEL') || s.startsWith('TIGO') || s === 'AT') return 'AirtelTigo';
  return n;
};

export function dataReferencePrice(network: string, size: string): DataReferencePrice | null {
  return DATA_REFERENCE_PRICES[normNetwork(network)]?.[normSize(size)] ?? null;
}

/**
 * Cost + markup, rounded UP to the next 10 pesewas. Float noise is removed
 * first (4.00 × 1.10 = 4.4000000000000004 must give 4.40, not 4.50).
 */
export function applyDataMarkup(costGhs: number, markupPercent: number): number {
  const pesewas = Math.round(costGhs * (1 + markupPercent / 100) * 100 * 1e6) / 1e6;
  return (Math.ceil(pesewas / 10) * 10) / 100;
}
