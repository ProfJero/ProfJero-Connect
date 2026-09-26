import { cn } from '../../lib/utils';
import type { TransactionMetric } from '../../mock/transactions';

export function TransactionMetricCard({ metric }: { metric: TransactionMetric }) {
  const Icon = metric.icon;
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-4">
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          metric.iconBg,
          metric.iconColor,
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {metric.label}
        </div>
        <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
          {metric.value}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
          {metric.footnote}
        </div>
      </div>
    </div>
  );
}