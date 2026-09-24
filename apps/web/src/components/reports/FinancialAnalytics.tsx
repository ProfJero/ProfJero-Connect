import { DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { formatGhs } from '../../lib/reportAggregation';

export interface FinancialCard {
  label: string;
  shortLabel: string;
  shortBg: string;
  value: string;
}

interface Props {
  cards: FinancialCard[];
}

export function FinancialAnalytics({ cards }: Props) {
  return (
    <Card className="p-5 lg:col-span-4" data-purpose="financial-analytics">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-4 h-4 text-blue-600" strokeWidth={2} />
        <h3 className="text-sm font-bold text-slate-900">Financial Analytics</h3>
      </div>
      <p className="text-xs text-slate-400 mb-3.5">Revenue and payment metrics.</p>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-slate-50 border border-slate-100 rounded-lg p-2.5"
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <span
                className={cn(
                  'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold',
                  card.shortBg,
                )}
              >
                {card.shortLabel}
              </span>
              <span className="truncate">{card.label}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { formatGhs };