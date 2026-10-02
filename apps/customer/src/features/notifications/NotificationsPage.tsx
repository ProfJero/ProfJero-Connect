import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, BellOff, Mail } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/States';
import { btnSecondary, cardClass } from '../../components/ui/buttons';
import { api } from '../../lib/api';
import { useCursorList } from '../../lib/useApi';
import { useAccount } from '../../lib/account';
import { NOTIFICATION_TYPES } from '../../lib/notificationStyles';
import { cn } from '../../lib/utils';
import type { CustomerNotification, NotificationsResponse, NotificationType } from '../../lib/types';

type Filter = 'all' | 'unread' | NotificationType;

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { refreshNotifications } = useAccount();
  const qs = new URLSearchParams({ limit: '20' });
  if (filter === 'unread') qs.set('unread', 'true');
  else if (filter !== 'all') qs.set('type', filter);
  const list = useCursorList<CustomerNotification>(`/customer/notifications?${qs}`, 'notifications');
  const meta = list.raw as unknown as NotificationsResponse | null;
  // Locally-read IDs so the dot clears instantly, before the refetch.
  const [readLocally, setReadLocally] = useState<Set<string>>(new Set());

  const markRead = (n: CustomerNotification) => {
    if (n.readAt || readLocally.has(n.id)) return;
    setReadLocally((s) => new Set(s).add(n.id));
    api.post(`/customer/notifications/${encodeURIComponent(n.id)}/read`).then(refreshNotifications, () => {});
  };

  const markAll = async () => {
    await api.post('/customer/notifications/read-all').catch(() => {});
    setReadLocally(new Set());
    list.refresh();
    refreshNotifications();
  };

  const typesPresent = (Object.keys(NOTIFICATION_TYPES) as NotificationType[]).filter((t) => (meta?.counts[t] ?? 0) > 0);
  const filters: Array<{ id: Filter; label: string; count?: number }> = [
    { id: 'all', label: 'All', count: meta?.total },
    { id: 'unread', label: 'Unread', count: meta?.unreadCount },
    ...typesPresent.map((t) => ({ id: t as Filter, label: NOTIFICATION_TYPES[t].label, count: meta?.counts[t] })),
  ];

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-5xl w-full mx-auto">
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="Payments, Sender ID decisions, balance alerts and message problems."
        actions={
          (meta?.unreadCount ?? 0) > 0 && (
            <button type="button" onClick={markAll} className={btnSecondary}>
              <Check className="w-3.5 h-3.5 text-[#1764e0] dark:text-blue-400" strokeWidth={2.5} />
              Mark all as read
            </button>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
              filter === f.id
                ? 'bg-[#1a6cf0] border-[#1a6cf0] text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300',
            )}
          >
            {f.label}
            {f.count !== undefined && <span className="ml-1 opacity-70 font-normal">{f.count}</span>}
          </button>
        ))}
      </div>

      <section className={cn(cardClass, 'overflow-hidden')}>
        {list.loading ? (
          <SkeletonRows rows={6} />
        ) : list.error && list.items.length === 0 ? (
          <ErrorState error={list.error} onRetry={list.refresh} />
        ) : list.items.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === 'all' ? "You're all caught up" : 'Nothing here'}
            description={
              filter === 'all'
                ? "We'll let you know when a payment arrives, a Sender ID is approved, or your balance runs low."
                : 'No notifications match this filter.'
            }
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.items.map((n) => (
                <NotificationItem
                  key={n.id}
                  item={readLocally.has(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n}
                  onOpen={markRead}
                />
              ))}
            </div>
            {list.hasMore && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <button type="button" onClick={list.loadMore} disabled={list.loadingMore} className={btnSecondary}>
                  {list.loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5" strokeWidth={2} />
        Important updates are also emailed to you.{' '}
        <Link to="/settings#notifications" className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline">
          Email settings
        </Link>
      </p>
    </main>
  );
}
