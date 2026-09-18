import { cn } from '../../lib/utils';
import type { PaymentMetric } from '../../mock/payments';

export function PaymentMetricCard({ metric }: { metric: PaymentMetric }) {
  const Icon = metric.icon;
  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0',
            metric.iconBg,
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
      </div>
      <div className="mt-3">
        <div className="text-base font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
          {metric.value}
          {metric.trend && (
            <span
              className={cn(
                'text-xs font-semibold',
                metric.trend.color === 'emerald' ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {metric.trend.direction === 'up' ? '↑' : '↓'} {metric.trend.value}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-normal mt-0.5">{metric.footnote}</div>
      </div>
    </div>
  );
}