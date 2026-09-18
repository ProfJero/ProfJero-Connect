import { cn } from '../../lib/utils';
import type { ProviderMetric } from '../../mock/arkesel';

export function ProviderMetricCard({ metric }: { metric: ProviderMetric }) {
  const Icon = metric.icon;
  const isLongValue = metric.value.length > 20;
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
      <div
        className={cn(
          'w-10 h-10 rounded-full text-white flex items-center justify-center mb-3 shrink-0',
          metric.iconBg,
        )}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight leading-tight block">
          {metric.label}
        </span>
        <h3
          className={cn(
            'font-bold mt-0.5 leading-snug',
            isLongValue ? 'text-xs' : 'text-base',
            metric.valueColor === 'emerald' ? 'text-emerald-600' : 'text-slate-900',
          )}
        >
          {metric.value}
        </h3>
        {metric.badge && (
          <div className="mt-1">
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                metric.badge.tone === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700',
              )}
            >
              {metric.badge.label}
            </span>
          </div>
        )}
        {metric.footnote && (
          <p
            className={cn(
              'text-[11px] mt-0.5',
              metric.label === 'Last Failed API Request'
                ? 'text-rose-500 font-semibold'
                : 'text-slate-400',
            )}
          >
            {metric.footnote}
          </p>
        )}
      </div>
    </div>
  );
}