import { cn } from '../../lib/utils';
import type { KpiCardData } from '../../mock/reports';

export function KpiCard({ card }: { card: KpiCardData }) {
  const Icon = card.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs',
            card.iconBg,
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500">{card.label}</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-slate-900 tracking-tight">{card.value}</span>
            <span
              className={cn(
                'text-[11px] font-semibold',
                card.deltaColor === 'emerald' ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {card.deltaColor === 'emerald' ? '↑' : '↓'} {card.delta}
            </span>
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-2 pl-[52px]">vs. previous 30 days</div>
    </div>
  );
}