import {
  Wallet,
  Lock,
  Activity,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type WalletMetricIcon = 'wallet' | 'lock' | 'activity' | 'alert';

export interface Metric {
  label: string;
  value: string;
  footnote: string;
  icon: WalletMetricIcon;
  iconBg: string;
}

const ICON_MAP: Record<WalletMetricIcon, LucideIcon> = {
  wallet: Wallet,
  lock: Lock,
  activity: Activity,
  alert: AlertTriangle,
};

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = ICON_MAP[metric.icon];
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:shadow transition">
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 shadow-md',
            metric.iconBg,
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 font-medium">{metric.label}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metric.value}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{metric.footnote}</p>
        </div>
      </div>
    </div>
  );
}