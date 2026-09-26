import { cn } from '../../lib/utils';
import type { MessagingStat } from '../../mock/messaging';

export function MessagingStatCard({ stat }: { stat: MessagingStat }) {
  const Icon = stat.icon;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center gap-4">
      <div
        className={cn(
          'w-12 h-12 rounded-xl text-white flex items-center justify-center shrink-0',
          stat.iconBg,
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {stat.value}
          </span>
          <span
            className={cn(
              'text-[11px] font-semibold',
              stat.deltaTone === 'emerald'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {stat.delta}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{stat.footnote}</p>
      </div>
    </div>
  );
}