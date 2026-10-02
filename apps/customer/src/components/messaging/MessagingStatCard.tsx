import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MessagingStat {
  label: string;
  value: string;
  /** e.g. "↑ 12%" — omitted when there is no previous-period baseline. */
  delta?: { text: string; good: boolean } | null;
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export function MessagingStatCard({ stat, loading }: { stat: MessagingStat; loading?: boolean }) {
  const Icon = stat.icon;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0', stat.iconBg)}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          {loading ? (
            <span className="h-6 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stat.value}</span>
          )}
          {!loading && stat.delta && (
            <span
              className={cn(
                'text-[11px] font-semibold',
                stat.delta.good ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {stat.delta.text}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">{stat.footnote}</p>
      </div>
    </div>
  );
}
