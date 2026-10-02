import { AlertTriangle } from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { WalletListEntry } from '@profjero/shared';

const DEFAULT_THRESHOLD = 500;
const CRITICAL_THRESHOLD = 100;

interface Props {
  entries: WalletListEntry[];
  onProjectClick?: (projectId: string) => void;
}

export function LowBalanceAlerts({ entries, onProjectClick }: Props) {
  const flagged = entries
    .filter((e) => {
      const t = e.wallet.lowBalanceThreshold ?? DEFAULT_THRESHOLD;
      return e.wallet.availableUnits > 0 && e.wallet.availableUnits < t;
    })
    .sort((a, b) => a.wallet.availableUnits - b.wallet.availableUnits)
    .slice(0, 4);

  return (
    <Card className="p-4" data-purpose="low-balance-alerts">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" strokeWidth={2} />
          <h4 className="text-xs font-bold text-slate-800">Low Balance Alerts</h4>
        </div>
        <ViewAllLink label="View all" href="/wallets" />
      </div>

      {flagged.length === 0 ? (
        <div className="py-6 text-center text-[11px] text-slate-500">
          All wallets are healthy.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-1">
          {flagged.map((e) => {
            const critical = e.wallet.availableUnits < CRITICAL_THRESHOLD;
            return (
              <button
                key={e.project.id}
                onClick={() => onProjectClick?.(e.project.id)}
                disabled={!onProjectClick}
                className={cn(
                  'w-full py-2.5 flex items-center justify-between text-left',
                  onProjectClick && 'hover:bg-slate-50 -mx-2 px-2 rounded transition',
                )}
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {e.project.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {e.wallet.availableUnits.toLocaleString()} units available
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold rounded border',
                    critical
                      ? 'text-rose-700 bg-rose-50 border-rose-200/50'
                      : 'text-amber-700 bg-amber-50 border-amber-200/50',
                  )}
                >
                  {critical ? 'Critical' : 'Low'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}