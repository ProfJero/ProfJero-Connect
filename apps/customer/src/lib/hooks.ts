import { useCallback, useState } from 'react';
import { api } from './api';
import { useApi, useCursorList } from './useApi';

export { useWallet } from './account';
export type { WalletData } from './account';

// ─────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────

export type WalletTransactionType =
  | 'reserve'
  | 'confirm'
  | 'release'
  | 'purchase'
  | 'refund'
  | 'manual_credit'
  | 'manual_debit'
  | 'reversal'
  | 'adjustment';

export interface WalletTransaction {
  id: string;
  projectId: string;
  type: WalletTransactionType;
  availableDelta: number;
  reservedDelta: number;
  availableAfter: number;
  reservedAfter: number;
  batchId: string | null;
  recordId: string | null;
  amountGhs: number | null;
  description: string | null;
  createdBy: string;
  createdAt: string;
  reversesTransactionId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UseTransactionsOptions {
  limit?: number;
  /** Comma-separated ledger types to include (server-side filter). */
  types?: string;
}

/**
 * Wallet ledger, newest first, in the customer "summary" view (one row
 * per send rather than one per recipient — see wallet router).
 */
export function useTransactions(opts: UseTransactionsOptions = {}) {
  const limit = opts.limit ?? 20;
  const list = useCursorList<WalletTransaction>(
    `/customer/wallet/transactions?view=summary&limit=${limit}${opts.types ? `&types=${encodeURIComponent(opts.types)}` : ''}`,
    'transactions',
  );
  return {
    transactions: list.items,
    loading: list.loading,
    loadingMore: list.loadingMore,
    error: list.error,
    hasMore: list.hasMore,
    refresh: list.refresh,
    loadMore: list.loadMore,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────

export interface CustomerProfileData {
  customer: {
    uid: string;
    email: string;
    displayName: string;
    organisationName: string | null;
    phone: string | null;
    projectId: string;
    status: 'active' | 'suspended';
    createdAt: string;
    emailNotifications: boolean;
  };
  project: {
    id: string;
    name: string;
    origin: 'admin' | 'customer';
  };
}

export function useProfile() {
  const { data, loading, error, refresh, setData } = useApi<CustomerProfileData>('/customer/me');
  const [saving, setSaving] = useState(false);

  const update = useCallback(
    async (patch: {
      displayName?: string;
      organisationName?: string;
      phone?: string | null;
    }) => {
      setSaving(true);
      try {
        const res = await api.put<CustomerProfileData>('/customer/me', patch);
        setData(() => res);
        return res;
      } finally {
        setSaving(false);
      }
    },
    [setData],
  );

  return { data, loading: loading && !data, error, saving, refresh, update };
}
