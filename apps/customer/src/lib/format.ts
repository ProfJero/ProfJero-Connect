import type { WalletTransaction, WalletTransactionType } from './hooks';

/**
 * Ledger entries we don't show to customers on CP1.
 *
 * reserve / confirm / release are internal SMS-accounting events.
 * They move units between the available and reserved pools, or finalize
 * a charge, and are only meaningful next to the SMS batch they belong to.
 * Until CP2 ships Send SMS (and can group these per-batch), we hide them.
 *
 * purchase / refund / manual_credit / manual_debit / reversal / adjustment
 * are wallet-level events and are always shown.
 */
export function isDisplayable(tx: WalletTransaction): boolean {
  return !(
    tx.type === 'reserve' ||
    tx.type === 'confirm' ||
    tx.type === 'release'
  );
}

export type DisplayTxType =
  | 'Wallet Funding'
  | 'SMS'
  | 'Refund'
  | 'Adjustment';

export function getDisplayType(tx: WalletTransaction): DisplayTxType {
  switch (tx.type) {
    case 'purchase':
    case 'manual_credit':
      return 'Wallet Funding';
    case 'refund':
      return 'Refund';
    case 'reversal':
    case 'adjustment':
    case 'manual_debit':
      return 'Adjustment';
    default:
      return 'Adjustment';
  }
}

export function getDisplayDescription(tx: WalletTransaction): string {
  if (tx.description) return tx.description;
  switch (tx.type) {
    case 'purchase':
      return 'Wallet top-up';
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

/**
 * Amount label for the ledger. Reflects the net change to the wallet
 * total (available + reserved). For most events this is just
 * availableDelta; reserve/release net to zero and are filtered out
 * upstream by isDisplayable.
 */
export function getAmount(tx: WalletTransaction): {
  text: string;
  positive: boolean;
} {
  const net = tx.availableDelta + tx.reservedDelta;
  if (net === 0) return { text: '0 units', positive: false };
  const sign = net > 0 ? '+' : '−';
  return {
    text: `${sign} ${Math.abs(net).toLocaleString()} units`,
    positive: net > 0,
  };
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
export function getStatus(_tx: WalletTransaction): 'Completed' {
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