import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SmsMetric } from '../../mock/smsLogs';

export function MetricCard({ metric }: { metric: SmsMetric }) {
  const Icon = metric.icon;
  const Arrow = metric.delta.direction === 'up' ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0', metric.iconBg)}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-slate-500 block">{metric.label}</span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-bold text-slate-900">{metric.value}</span>
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-semibold',
              metric.delta.color === 'emerald' ? 'text-emerald-600' : 'text-red-500',
            )}
          >
            <Arrow className="w-2.5 h-2.5 mr-0.5" strokeWidth={2.5} />
            {metric.delta.value}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block mt-0.5">{metric.footnote}</span>
      </div>
    </div>
  );
}