import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

// ─────────────────────────────────────────────────────────────────────
// Wallet
// ─────────────────────────────────────────────────────────────────────

export interface WalletData {
  availableUnits: number;
  reservedUnits: number;
  totalUnits: number;
  lowBalanceThreshold: number | null;
  updatedAt: string | null;
}

export function useWallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<WalletData>('/customer/wallet');
      if (mountedRef.current) setData(res);
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

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

interface TransactionsResponse {
  transactions: WalletTransaction[];
  count: number;
  nextCursor: string | null;
}

export interface UseTransactionsOptions {
  limit?: number;
}

export function useTransactions(opts: UseTransactionsOptions = {}) {
  const limit = opts.limit ?? 20;
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<TransactionsResponse>(
        `/customer/wallet/transactions?limit=${limit}`,
      );
      if (!mountedRef.current) return;
      setTransactions(res.transactions);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get<TransactionsResponse>(
        `/customer/wallet/transactions?limit=${limit}&before=${encodeURIComponent(nextCursor)}`,
      );
      if (!mountedRef.current) return;
      setTransactions((prev) => [...prev, ...res.transactions]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, limit]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor !== null,
    refresh,
    loadMore,
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
    projectId: string;
    status: 'active' | 'suspended';
  };
  project: {
    id: string;
    name: string;
    origin: 'admin' | 'customer';
  };
}

export function useProfile() {
  const [data, setData] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CustomerProfileData>('/customer/me');
      if (mountedRef.current) setData(res);
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: {
      displayName?: string;
      organisationName?: string;
      phone?: string | null;
    }) => {
      setSaving(true);
      try {
        const res = await api.put<CustomerProfileData>('/customer/me', patch);
        if (mountedRef.current) setData(res);
        return res;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [],
  );

  return { data, loading, error, saving, refresh, update };
}