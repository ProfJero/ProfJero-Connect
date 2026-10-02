import { Link } from 'react-router-dom';
import { NotificationItem } from '../notifications/NotificationItem';
import { ErrorState } from '../ui/States';
import { useApi } from '../../lib/useApi';
import type { NotificationsResponse } from '../../lib/types';

export function RecentNotifications() {
  const { data, loading, error, refresh } = useApi<NotificationsResponse>('/customer/notifications?limit=4');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Notifications</h3>
        <Link to="/notifications" className="text-[#1a6cf0] dark:text-blue-400 hover:underline text-xs font-medium">
          View all →
        </Link>
      </div>
      {loading && !data ? (
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} className="m-0 mt-3" />
      ) : (data?.notifications.length ?? 0) === 0 ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          No notifications yet. Payment receipts, Sender ID decisions and balance alerts will show up here.
        </p>
      ) : (
        <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
          {data!.notifications.map((n) => (
            <NotificationItem key={n.id} item={n} compact />
          ))}
        </div>
      )}
    </div>
  );
}
