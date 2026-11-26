import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminAlert, Provider } from '@profjero/shared';
import { apiFetch } from './api';
import { useApi } from './useApi';

/**
 * Data the admin chrome shows on every page: the alert bell and the
 * sidebar's SMS provider balance. Fetched once in AppLayout, polled, and
 * refreshable after actions that change them.
 */
interface AlertsResponse {
  alerts: AdminAlert[];
  unreadCount: number;
  seenAt: string | null;
}

interface AdminDataValue {
  alerts: AdminAlert[];
  unreadCount: number;
  alertsLoading: boolean;
  alertsError: Error | null;
  markAlertsSeen: () => Promise<void>;
  refreshAlerts: () => void;
  smsProvider: Provider | null;
  providersLoading: boolean;
  refreshProviders: () => void;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);
const POLL_MS = 60_000;

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const alerts = useApi<AlertsResponse>('/admin/alerts');
  const providers = useApi<{ providers: Provider[] }>('/admin/providers');
  // Optimistic: alerts older than this are shown as read immediately.
  const [seenAtLocal, setSeenAtLocal] = useState<string | null>(null);
  const { reload: reloadAlerts } = alerts;
  const { reload: reloadProviders } = providers;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      reloadAlerts();
      reloadProviders();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [reloadAlerts, reloadProviders]);

  const markAlertsSeen = useCallback(async () => {
    setSeenAtLocal(new Date().toISOString());
    try {
      await apiFetch('/admin/alerts/seen', { method: 'POST' });
    } finally {
      reloadAlerts();
    }
  }, [reloadAlerts]);

  const value = useMemo<AdminDataValue>(() => {
    const list = (alerts.data?.alerts ?? []).map((a) =>
      seenAtLocal && a.latestAt <= seenAtLocal ? { ...a, unread: false } : a,
    );
    return {
      alerts: list,
      unreadCount: list.filter((a) => a.unread).length,
      alertsLoading: alerts.loading && !alerts.data,
      alertsError: alerts.error,
      markAlertsSeen,
      refreshAlerts: reloadAlerts,
      smsProvider: providers.data?.providers.find((p) => p.service === 'sms') ?? null,
      providersLoading: providers.loading && !providers.data,
      refreshProviders: reloadProviders,
    };
  }, [alerts.data, alerts.loading, alerts.error, seenAtLocal, markAlertsSeen, reloadAlerts, providers.data, providers.loading, reloadProviders]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminData(): AdminDataValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used inside <AdminDataProvider>');
  return ctx;
}
