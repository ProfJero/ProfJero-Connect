import {
  Briefcase,
  UsersRound,
  Layers,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type MetricIcon =
  | 'briefcase'
  | 'users-round'
  | 'layers'
  | 'wallet'
  | 'alert-circle';

export interface Metric {
  label: string;
  value: string;
  footnote: string;
  iconBg: string;
  icon: MetricIcon;
  /** Optional period delta. Omit when we don't have comparable history yet. */
  delta?: { direction: 'up' | 'down'; value: string };
}

const ICON_MAP: Record<MetricIcon, LucideIcon> = {
  briefcase: Briefcase,
  'users-round': UsersRound,
  layers: Layers,
  wallet: Wallet,
  'alert-circle': AlertCircle,
};

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = ICON_MAP[metric.icon];

  // If delta is present, choose arrow + color. 'Failed Messages' is the one
  // metric where down is good; everything else up is good.
  let deltaEl: React.ReactNode = null;
  if (metric.delta) {
    const isGood =
      (metric.label === 'Failed Messages' && metric.delta.direction === 'down') ||
      (metric.label !== 'Failed Messages' && metric.delta.direction === 'up');
    const Arrow = metric.delta.direction === 'up' ? ArrowUpRight : ArrowDownRight;
    deltaEl = (
      <span
        className={cn(
          'text-[11px] font-semibold flex items-center',
          isGood ? 'text-emerald-500' : 'text-red-500',
        )}
      >
        <Arrow className="w-3 h-3" strokeWidth={2.5} />
        {metric.delta.value}
      </span>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-start gap-3.5">
      <div
        className={cn(
          'w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0',
          metric.iconBg,
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs font-medium text-slate-500">{metric.label}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-slate-900">{metric.value}</span>
          {deltaEl}
        </div>
        <div className="text-[10px] text-slate-400 mt-1">{metric.footnote}</div>
      </div>
    </div>
  );
}