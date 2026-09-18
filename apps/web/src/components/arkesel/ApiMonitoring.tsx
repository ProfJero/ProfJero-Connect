import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { apiMonitorChips } from '../../mock/arkesel';
import { cn } from '../../lib/utils';

export function ApiMonitoring() {
  return (
    <Card className="p-5" data-purpose="api-monitoring">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">API Monitoring</h3>
        <p className="text-[11px] text-slate-500">Real-time API performance and statistics.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {apiMonitorChips.map((chip) => {
          const Icon = chip.icon;
          const footnoteColor =
            chip.footnoteColor === 'emerald'
              ? 'text-emerald-600 font-medium'
              : chip.footnoteColor === 'rose'
                ? 'text-rose-500 font-medium'
                : 'text-slate-400';
          return (
            <div
              key={chip.label}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center gap-1.5">
                {chip.dotColor && (
                  <span className={cn('w-2 h-2 rounded-full inline-block', chip.dotColor)} />
                )}
                {Icon && (
                  <Icon
                    className={cn('text-xs w-3 h-3', chip.iconColor ?? 'text-slate-500')}
                    strokeWidth={2}
                  />
                )}
                <span className="text-[11px] font-semibold text-slate-500">{chip.label}</span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">{chip.value}</p>
              <p className={cn('text-[10px] mt-0.5', footnoteColor)}>{chip.footnote}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-rose-500 w-3.5 h-3.5" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-slate-500">Error Rate</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-rose-600">1.7%</span>
          <span className="text-[10px] text-slate-400 ml-2">Within acceptable range</span>
        </div>
      </div>
    </Card>
  );
}