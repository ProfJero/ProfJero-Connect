import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface KpiCardData {
  label: string;
  value: string;
  footnote: string;
  icon: LucideIcon;
  iconBg: string;
}

export function KpiCard({ card }: { card: KpiCardData }) {
  const Icon = card.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs',
            card.iconBg,
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-500">{card.label}</span>
          <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            {card.value}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 mt-2 pl-[52px]">
        {card.footnote}
      </div>
    </div>
  );
}