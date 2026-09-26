import { ChevronRight } from 'lucide-react';
import type { NotificationItem as NotificationItemType } from '../../mock/notifications';
import { cn } from '../../lib/utils';

export function NotificationItem({ item }: { item: NotificationItemType }) {
  const Icon = item.icon;
  return (
    <div className="p-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition cursor-pointer group">
      {/* Unread dot */}
      <div className="w-2 flex justify-center shrink-0">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            item.read ? 'bg-transparent' : 'bg-[#1a6cf0]',
          )}
        />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          item.iconBg,
          item.iconColor,
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1a6cf0] dark:group-hover:text-blue-400 transition truncate">
          {item.title}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {item.description}
        </p>
      </div>

      {/* Date/time — hidden on very small screens */}
      <div className="text-right shrink-0 hidden sm:block">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
          {item.date}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{item.time}</span>
      </div>

      {/* Read/unread badge — hidden on very small */}
      <span
        className={cn(
          'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border hidden sm:inline-block',
          item.read
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-sky-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 border-sky-100 dark:border-blue-500/20',
        )}
      >
        {item.read ? 'Read' : 'Unread'}
      </span>

      <ChevronRight
        className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0"
        strokeWidth={2}
      />
    </div>
  );
}