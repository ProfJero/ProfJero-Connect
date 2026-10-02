import {
  Package,
  Send,
  Check,
  X,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SmsMetricIcon = 'package' | 'send' | 'check' | 'x' | 'help';

export interface Metric {
  label: string;
  value: string;
  footnote: string;
  icon: SmsMetricIcon;
  iconBg: string;
}

const ICON_MAP: Record<SmsMetricIcon, LucideIcon> = {
  package: Package,
  send: Send,
  check: Check,
  x: X,
  help: HelpCircle,
};

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = ICON_MAP[metric.icon];
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-start gap-3">
      <div
        className={cn(
          'w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0',
          metric.iconBg,
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-slate-500 block">
          {metric.label}
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-lg font-bold text-slate-900">{metric.value}</span>
        </div>
        <span className="text-[10px] text-slate-500 block mt-0.5">
          {metric.footnote}
        </span>
      </div>
    </div>
  );
}