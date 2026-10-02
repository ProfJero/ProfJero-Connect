import type { WalletTransaction, WalletTransactionType } from './hooks';

/**
 * Ledger entries shown to customers.
 *
 * The API's summary view already drops per-recipient `confirm` entries.
 * A send appears as its `reserve` (units leave the available balance) and,
 * if some recipients failed, a `release` (units come back). Amounts use
 * availableDelta, so the running total matches the balance the customer
 * actually sees.
 */
export function isDisplayable(tx: WalletTransaction): boolean {
  return tx.type !== 'confirm';
}

export type DisplayTxType = 'Wallet Funding' | 'SMS' | 'Refund' | 'Adjustment';

export function getDisplayType(tx: WalletTransaction): DisplayTxType {
  switch (tx.type) {
    case 'purchase':
    case 'manual_credit':
      return 'Wallet Funding';
    case 'reserve':
      return 'SMS';
    case 'release':
    case 'refund':
      return 'Refund';
    default:
      return 'Adjustment';
  }
}

export function getDisplayDescription(tx: WalletTransaction): string {
  if (tx.type === 'reserve') {
    const n = tx.description?.match(/(\d+) recipients?/)?.[1];
    return n ? `SMS send — ${Number(n).toLocaleString()} recipient${n === '1' ? '' : 's'}` : 'SMS send';
  }
  if (tx.type === 'release') return 'Units returned — message not delivered';
  if (tx.type === 'purchase') return 'Wallet top-up';
  if (tx.description) return tx.description;
  switch (tx.type) {
    case 'manual_credit':
      return 'Wallet credit';
    case 'manual_debit':
      return 'Wallet debit';
    case 'refund':
      return 'Refund';
    case 'reversal':
      return 'Reversal';
    case 'adjustment':
      return 'Adjustment';
    default:
      return 'Transaction';
  }
}

/** Change to the available balance, e.g. "+ 500 units". */
export function getAmount(tx: WalletTransaction): {
  text: string;
  positive: boolean;
} {
  const net = tx.availableDelta;
  if (net === 0) return { text: '0 units', positive: false };
  const sign = net > 0 ? '+' : '−';
  return {
    text: `${sign} ${Math.abs(net).toLocaleString()} units`,
    positive: net > 0,
  };
}

/** Link to the related screen for a ledger row, if any. */
export function getTxLink(tx: WalletTransaction): string | null {
  if ((tx.type === 'reserve' || tx.type === 'release') && tx.batchId) {
    return `/messaging/history/${encodeURIComponent(tx.batchId)}`;
  }
  return null;
}

/** e.g. "Sep 27, 2026 4:37 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** e.g. "Sep 27, 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** All ledger entries are committed; the type is here for symmetry. */
export function getStatus(tx: WalletTransaction): 'Completed' {
  void tx;
  return 'Completed';
}

/**
 * Short reference derived from the ledger doc ID. The raw ID looks like
 * "manual_credit__signup__LhUmnE5Ny..." — we take the last segment and
 * trim to 12 characters for display.
 */
export function shortRef(id: string): string {
  const parts = id.split('__');
  const last = parts[parts.length - 1] ?? id;
  return last.length > 14 ? last.slice(0, 14) + '…' : last;
}

// Type re-export so consumers don't need to import from two places.
export type { WalletTransactionType };
/** e.g. "just now", "5 min ago", "3 h ago", "2 days ago", then a date. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return formatDate(iso);
}

/** "233241234567" → "+233 24 123 4567" (Ghana); other numbers get a "+". */
export function formatPhone(normalized: string): string {
  const p = normalized.replace(/^\+/, '');
  if (/^233\d{9}$/.test(p)) {
    return `+233 ${p.slice(3, 5)} ${p.slice(5, 8)} ${p.slice(8)}`;
  }
  return `+${p}`;
}

/** GH₵ with two decimals. */
export function formatGhs(amount: number): string {
  return `GH₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Percent change label vs the previous period. Null when there is no
 * baseline (previous = 0) — we don't invent "+100%" from nothing.
 */
export function deltaLabel(current: number, previous: number): { text: string; up: boolean } | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { text: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}%`, up: pct >= 0 };
}
