import { useMemo, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { NotificationFilters } from '../../components/notifications/NotificationFilters';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { NotificationSummary } from '../../components/notifications/NotificationSummary';
import {
  notifications as allNotifications,
  notificationsPagination,
  type NotificationFilter,
} from '../../mock/notifications';

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter['id']>('all');
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allNotifications;
    return allNotifications.filter((n) => n.category === activeFilter);
  }, [activeFilter]);

  const p = notificationsPagination;

  const handleMarkAllRead = () => {
    setReadIds(new Set(allNotifications.map((n) => n.id)));
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 p-3 rounded-2xl bg-[#1a6cf0] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Notifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stay updated with your latest activity, alerts and important information.
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition shrink-0"
        >
          <Check className="w-3.5 h-3.5 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2.5} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filters */}
      <NotificationFilters active={activeFilter} onChange={setActiveFilter} />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => (
              <NotificationItem
                key={item.id}
                item={{
                  ...item,
                  read: item.read || readIds.has(item.id),
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No notifications in this category.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing {p.from} - {Math.min(p.to, filtered.length)} of {p.total} notifications
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a6cf0] text-white">
                  1
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  2
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <NotificationSummary />
        </div>
      </div>
    </main>
  );
}