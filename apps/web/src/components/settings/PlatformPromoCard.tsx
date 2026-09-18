import { Info, ShieldCheck, CheckCircle2, TrendingUp, LifeBuoy } from 'lucide-react';
import { Card } from '../ui/Card';
import { platformPromo } from '../../mock/settings';
import { cn } from '../../lib/utils';

const VALUE_ICON = {
  Secure: ShieldCheck,
  Reliable: CheckCircle2,
  Scalable: TrendingUp,
  '24/7 Support': LifeBuoy,
} as const;

const TONE_COLORS = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-500',
  teal: 'text-teal-500',
} as const;

export function PlatformPromoCard() {
  return (
    <Card
      className="p-6 lg:col-span-4 flex flex-col justify-between"
      data-purpose="platform-promo-info-card"
    >
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-[#1976d2] text-white flex items-center justify-center">
            <Info className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Platform Information</h3>
        </div>

        <div className="bg-[#f5f9ff] rounded-xl p-4 border border-blue-100 mb-4">
          <h4 className="text-sm font-bold text-slate-900">{platformPromo.name}</h4>
          <p className="text-[11px] text-slate-500 mb-2">{platformPromo.tagline}</p>
          <p className="text-xs text-slate-600 leading-relaxed">{platformPromo.description}</p>

          <div className="grid grid-cols-4 gap-2 pt-4 mt-3 border-t border-blue-100 text-center">
            {platformPromo.values.map((value) => {
              const Icon = VALUE_ICON[value.label as keyof typeof VALUE_ICON];
              return (
                <div key={value.label} className="flex flex-col items-center">
                  <Icon
                    className={cn('w-4 h-4 mb-1', TONE_COLORS[value.tone])}
                    strokeWidth={2}
                  />
                  <span className="text-[10px] font-semibold text-slate-700">{value.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}