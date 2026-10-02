import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_TYPES, SEVERITY_STYLES } from '../../lib/notificationStyles';
import { formatDateTime, timeAgo } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerNotification } from '../../lib/types';

export function NotificationItem({
  item,
  onOpen,
  compact,
}: {
  item: CustomerNotification;
  /** Called before navigating (used to mark it read). */
  onOpen?: (item: CustomerNotification) => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const Icon = NOTIFICATION_TYPES[item.type]?.icon ?? NOTIFICATION_TYPES.account.icon;
  const unread = item.readAt === null;

  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.(item);
        if (item.link) navigate(item.link);
      }}
      className={cn(
        'w-full text-left flex items-start gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group',
        compact ? 'py-2.5' : 'p-4 sm:gap-4',
      )}
    >
      {!compact && (
        <div className="w-2 flex justify-center shrink-0 pt-4">
          <span className={cn('w-2 h-2 rounded-full', unread ? 'bg-[#1a6cf0]' : 'bg-transparent')} />
        </div>
      )}
      <div className={cn('rounded-xl flex items-center justify-center shrink-0', compact ? 'w-8 h-8' : 'w-10 h-10', SEVERITY_STYLES[item.severity])}>
        <Icon className={compact ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#1a6cf0] dark:group-hover:text-blue-400 transition',
            unread ? 'font-bold' : 'font-semibold',
            compact && 'truncate',
          )}
        >
          {item.title}
        </h3>
        <p className={cn('text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug', compact && 'line-clamp-2 text-[11px]')}>
          {item.body}
        </p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500" title={formatDateTime(item.createdAt)}>
          {timeAgo(item.createdAt)}
        </span>
      </div>
      {item.link && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-1" strokeWidth={2} />}
    </button>
  );
}
