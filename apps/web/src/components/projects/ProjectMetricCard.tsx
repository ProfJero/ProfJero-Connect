import {
  Package,
  Send,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DetailMetric } from '../../mock/projectDetails';

const ICONS: Record<DetailMetric['icon'], LucideIcon> = {
  units: Package,
  send: Send,
  alert: AlertCircle,
  percent: Percent,
  calendar: Calendar,
  money: DollarSign,
  clock: Clock,
};

export function ProjectMetricCard({ metric }: { metric: DetailMetric }) {
  const Icon = ICONS[metric.icon];
  const isRotate = metric.icon === 'send';

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between shadow-xs">
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <div
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            metric.iconBg,
          )}
        >
          <Icon
            className={cn('w-4 h-4', isRotate && '-rotate-45')}
            strokeWidth={2}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium truncate">{metric.label}</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          {metric.valuePrefix && (
            <span className="text-xs font-semibold text-slate-700">{metric.valuePrefix}</span>
          )}
          <span className="text-lg font-bold text-slate-900 tracking-tight">{metric.value}</span>
          {metric.delta.value && (
            <span
              className={cn(
                'text-[10px] font-semibold px-1 py-0.5 rounded',
                metric.delta.tone === 'emerald'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-red-600 bg-red-50',
              )}
            >
              {metric.delta.direction === 'up' ? '↑' : '↓'} {metric.delta.value}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{metric.footnote}</p>
      </div>
    </div>
  );
}