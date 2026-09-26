import { notificationFilters, notifications, type NotificationFilter } from '../../mock/notifications';
import { cn } from '../../lib/utils';

function countFor(id: NotificationFilter['id']): number {
  if (id === 'all') return notifications.length;
  return notifications.filter((n) => n.category === id).length;
}

export function NotificationFilters({
  active,
  onChange,
}: {
  active: NotificationFilter['id'];
  onChange: (id: NotificationFilter['id']) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-6 overflow-x-auto pb-1">
      {notificationFilters.map((filter) => {
        const isActive = active === filter.id;
        const count = countFor(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors shrink-0',
              isActive
                ? 'bg-[#1a6cf0] text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:border-slate-300 dark:hover:border-slate-700',
            )}
          >
            <span>{filter.label}</span>
            <span
              className={cn(
                'text-[11px] px-1.5 py-0.5 rounded-full font-bold',
                isActive
                  ? 'bg-blue-400/40 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}