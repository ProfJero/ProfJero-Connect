import { Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { providerActivityRows } from '../../mock/reports';
import { cn } from '../../lib/utils';

const TONE_STYLES = {
  Normal: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Warning: 'bg-amber-50 text-amber-600 border-amber-200',
  Info: 'bg-blue-50 text-blue-600 border-blue-200',
} as const;

const TONE_DOT = {
  Normal: 'bg-emerald-500',
  Warning: 'bg-amber-500',
  Info: 'bg-blue-500',
} as const;

export function RecentProviderActivity() {
  return (
    <Card className="p-5 lg:col-span-4" data-purpose="recent-provider-activity">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-700" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Recent Provider Activity</h3>
        </div>
        <a className="text-xs font-semibold text-blue-600 hover:text-blue-700" href="#">
          View All →
        </a>
      </div>

      <div className="space-y-2.5">
        {providerActivityRows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between text-xs py-1',
              i < providerActivityRows.length - 1 && 'border-b border-slate-100',
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                  row.iconBg,
                  row.iconColor,
                )}
              >
                {row.icon}
              </span>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block leading-none mb-0.5">
                  {row.time}
                </span>
                <span className="font-medium text-slate-700 truncate block">{row.label}</span>
              </div>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 border text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0 ml-2',
                TONE_STYLES[row.tone],
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', TONE_DOT[row.tone])} />
              {row.tone}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}