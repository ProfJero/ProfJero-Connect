import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useApi } from './useApi';
import type { NotificationsResponse } from './types';
import { SUPPORT_EMAIL } from './config';

/**
 * Account-wide data several screens show at once: the wallet balance
 * (topbar, dashboard, wallet, send SMS) and the unread notification count
 * (topbar bell, sidebar badge). One fetch each, shared, refreshed after
 * actions that change them — so a send or top-up updates every place.
 */

export interface WalletData {
  availableUnits: number;
  reservedUnits: number;
  totalUnits: number;
  lowBalanceThreshold: number | null;
  updatedAt: string | null;
}

interface AccountContextValue {
  wallet: {
    data: WalletData | null;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  };
  unreadCount: number;
  refreshNotifications: () => void;
  config: PlatformConfig;
}

/** Operator-controlled settings (admin dashboard → Settings). */
export interface PlatformConfig {
  platformName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  /** Completes "usually takes …", e.g. "up to 1 business day". */
  senderIdReviewSla: string;
  maxRecipientsPerSend: number;
  topupsEnabled: boolean;
  topupsDisabledMessage: string | null;
}

/** Used until /customer/config answers (and if it can't be reached). */
const DEFAULT_CONFIG: PlatformConfig = {
  platformName: 'ProfJero Connect',
  supportEmail: SUPPORT_EMAIL,
  supportPhone: null,
  senderIdReviewSla: 'up to 1 business day',
  maxRecipientsPerSend: 1000,
  topupsEnabled: true,
  topupsDisabledMessage: null,
};

const AccountContext = createContext<AccountContextValue | null>(null);

/** Poll interval for the unread badge; notifications are not push yet. */
const NOTIFICATION_POLL_MS = 60_000;

export function AccountProvider({ children }: { children: ReactNode }) {
  const wallet = useApi<WalletData>('/customer/wallet');
  const notifications = useApi<NotificationsResponse>('/customer/notifications?limit=1');
  const configApi = useApi<Partial<PlatformConfig>>('/customer/config');
  const refreshNotifications = notifications.refresh;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshNotifications();
    }, NOTIFICATION_POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshNotifications]);

  const refreshWallet = wallet.refresh;
  const value = useMemo<AccountContextValue>(
    () => ({
      wallet: {
        data: wallet.data,
        loading: wallet.loading && !wallet.data,
        error: wallet.error,
        refresh: refreshWallet,
      },
      unreadCount: notifications.data?.unreadCount ?? 0,
      refreshNotifications,
      config: {
        ...DEFAULT_CONFIG,
        ...configApi.data,
        // An unset support email in Settings falls back to the build-time one.
        supportEmail: configApi.data?.supportEmail ?? DEFAULT_CONFIG.supportEmail,
      },
    }),
    [wallet.data, wallet.loading, wallet.error, refreshWallet, notifications.data, refreshNotifications, configApi.data],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside <AccountProvider>');
  return ctx;
}

/** Wallet balance from the shared account context. */
// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
  return useAccount().wallet;
}

/** Refresh balance + notifications after an action that changes both. */
// eslint-disable-next-line react-refresh/only-export-components
export function useRefreshAccount() {
  const { wallet, refreshNotifications } = useAccount();
  const refreshWallet = wallet.refresh;
  return useCallback(() => {
    refreshWallet();
    refreshNotifications();
  }, [refreshWallet, refreshNotifications]);
}

/** Operator-controlled platform settings (support contact, limits, …). */
// eslint-disable-next-line react-refresh/only-export-components
export function usePlatformConfig(): PlatformConfig {
  return useAccount().config;
}
