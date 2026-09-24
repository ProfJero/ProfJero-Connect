import { cn } from '../../lib/utils';
import type { MetricCardData } from '../../mock/dashboard';

export function MetricCard({ metric }: { metric: MetricCardData }) {
  const Icon = metric.icon;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
          {metric.label}
        </div>
        <div className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate">
          {metric.value}
        </div>
        <div className="flex items-center gap-1 text-[11px] mt-0.5 flex-wrap">
          {metric.delta && (
            <span
              className={cn(
                'font-semibold',
                metric.deltaTone === 'emerald'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {metric.delta}
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 font-normal">{metric.footer}</span>
        </div>
      </div>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', metric.iconBg, metric.iconColor)}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
    </div>
  );
}