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
    '1GB': { guest: 4.7, member: 4.5, api: 4.1 },
    '2GB': { guest: 9.4, member: 9.0, api: 8.2 },
    '3GB': { guest: 14.1, member: 13.5, api: 12.3 },
    '4GB': { guest: 18.8, member: 18.0, api: 16.4 },
    '5GB': { guest: 23.5, member: 22.5, api: 20.5 },
    '6GB': { guest: 28.2, member: 27.0, api: 24.6 },
    '8GB': { guest: 37.6, member: 36.0, api: 32.8 },
    '10GB': { guest: 47.0, member: 45.0, api: 41.0 },
    '15GB': { guest: 70.5, member: 67.5, api: 61.5 },
    '20GB': { guest: 94.0, member: 90.0, api: 82.0 },
    '25GB': { guest: 117.5, member: 112.5, api: 102.5 },
    '30GB': { guest: 141.0, member: 135.0, api: 123.0 },
    '40GB': { guest: 188.0, member: 180.0, api: 164.0 },
    '50GB': { guest: 235.0, member: 225.0, api: 205.0 },
  },
  Telecel: {
    '10GB': { guest: 47.0, member: 45.0, api: 41.0 },
    '15GB': { guest: 70.5, member: 67.5, api: 61.5 },
    '20GB': { guest: 94.0, member: 90.0, api: 82.0 },
    '25GB': { guest: 117.5, member: 112.5, api: 102.5 },
    '30GB': { guest: 141.0, member: 135.0, api: 123.0 },
    '40GB': { guest: 188.0, member: 180.0, api: 164.0 },
    '50GB': { guest: 235.0, member: 225.0, api: 205.0 },
    '100GB': { guest: 470.0, member: 450.0, api: 410.0 },
  },
  AirtelTigo: {
    '1GB': { guest: 4.7, member: 4.5, api: 4.1 },
    '2GB': { guest: 9.4, member: 9.0, api: 8.2 },
    '3GB': { guest: 14.1, member: 13.5, api: 12.3 },
    '4GB': { guest: 18.8, member: 18.0, api: 16.4 },
    '5GB': { guest: 23.5, member: 22.5, api: 20.5 },
    '6GB': { guest: 28.2, member: 27.0, api: 24.6 },
    '7GB': { guest: 32.9, member: 31.5, api: 28.7 },
    '8GB': { guest: 37.6, member: 36.0, api: 32.8 },
    '10GB': { guest: 47.0, member: 45.0, api: 41.0 },
    '20GB': { guest: 94.0, member: 90.0, api: 82.0 },
    '25GB': { guest: 117.5, member: 112.5, api: 102.5 },
    '30GB': { guest: 141.0, member: 135.0, api: 123.0 },
  },
};

/** When the published price list was last updated (shown in admin). */
export const DATA_PRICE_LIST_UPDATED = '2026-11-26';

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

// ─────────────────────────────────────────────────────────────────────
// Fees and real profit
// ─────────────────────────────────────────────────────────────────────

/**
 * The money model behind every customer checkout.
 *
 *   customer sees ............ price (bundle price / package price)
 *   gateway charges .......... price + serviceCharge   (shown only on the payment page)
 *   gateway keeps ............ gatewayFee% of what it charged
 *   we pay the provider ...... apiCost, but topping up the provider wallet
 *                              costs depositFee% on top, so each cedi of
 *                              provider credit really costs (1 + depositFee%)
 */
export interface FeeModel {
  /** Added to the amount charged at the payment gateway. Never shown in our UI. */
  serviceChargePercent: number;
  /** What the payment gateway keeps from each charge (Paystack Ghana: 1.98%). */
  gatewayFeePercent: number;
  /** Fee charged when topping up the data provider wallet (3%). */
  providerDepositFeePercent: number;
}

export const DEFAULT_FEE_MODEL: FeeModel = {
  serviceChargePercent: 2,
  gatewayFeePercent: 1.98,
  providerDepositFeePercent: 3,
};

const cleanPesewas = (n: number) => Math.round(Math.round(n * 1e6) / 1e6);

/** Service charge in pesewas for a price in pesewas (rounded to the nearest pesewa). */
export function serviceChargePesewas(pricePesewas: number, percent: number): number {
  if (!(percent > 0)) return 0;
  return cleanPesewas((pricePesewas * percent) / 100);
}

/** Price + service charge: the amount sent to the payment gateway. */
export function gatewayAmountPesewas(pricePesewas: number, percent: number): number {
  return pricePesewas + serviceChargePesewas(pricePesewas, percent);
}

export interface ProfitBreakdown {
  /** Price the customer saw. */
  priceGhs: number;
  /** Service charge added at the payment page. */
  serviceChargeGhs: number;
  /** Total charged by the gateway. */
  chargedGhs: number;
  /** Kept by the gateway. */
  gatewayFeeGhs: number;
  /** What actually reaches us. */
  netReceivedGhs: number;
  /** Provider API price. */
  providerCostGhs: number;
  /** Provider deposit fee attributable to this purchase. */
  depositFeeGhs: number;
  /** Provider price + deposit fee. */
  totalCostGhs: number;
  /** netReceived − totalCost. */
  profitGhs: number;
  /** profit as a % of the price the customer saw. */
  profitPercent: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Real profit on one sale, after the gateway fee and the provider deposit
 * fee. `chargedPesewas` defaults to price + service charge.
 */
export function dataProfit(args: {
  priceGhs: number;
  providerCostGhs: number;
  fees?: Partial<FeeModel>;
  chargedPesewas?: number;
}): ProfitBreakdown {
  const fees = { ...DEFAULT_FEE_MODEL, ...(args.fees ?? {}) };
  const pricePesewas = Math.round(args.priceGhs * 100);
  const charged = args.chargedPesewas ?? gatewayAmountPesewas(pricePesewas, fees.serviceChargePercent);
  const chargedGhs = charged / 100;
  const gatewayFeeGhs = (chargedGhs * fees.gatewayFeePercent) / 100;
  const netReceivedGhs = chargedGhs - gatewayFeeGhs;
  const depositFeeGhs = (args.providerCostGhs * fees.providerDepositFeePercent) / 100;
  const totalCostGhs = args.providerCostGhs + depositFeeGhs;
  const profitGhs = netReceivedGhs - totalCostGhs;
  return {
    priceGhs: r2(args.priceGhs),
    serviceChargeGhs: r2(chargedGhs - pricePesewas / 100),
    chargedGhs: r2(chargedGhs),
    gatewayFeeGhs: r2(gatewayFeeGhs),
    netReceivedGhs: r2(netReceivedGhs),
    providerCostGhs: r2(args.providerCostGhs),
    depositFeeGhs: r2(depositFeeGhs),
    totalCostGhs: r2(totalCostGhs),
    profitGhs: r2(profitGhs),
    profitPercent: args.priceGhs > 0 ? Math.round((profitGhs / args.priceGhs) * 1000) / 10 : 0,
  };
}
