import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { WalletMetric } from '../../mock/wallets';

export function MetricCard({ metric }: { metric: WalletMetric }) {
  const Icon = metric.icon;
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
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUp className="w-3 h-3 mr-0.5" strokeWidth={2.5} />
              {metric.delta}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{metric.footnote}</p>
        </div>
      </div>
    </div>
  );
}