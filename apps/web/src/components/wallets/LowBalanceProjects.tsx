import { AlertTriangle } from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { WalletListEntry } from '@profjero/shared';

const DEFAULT_LOW_BALANCE_THRESHOLD = 500;
const CRITICAL_THRESHOLD = 100;

interface Props {
  entries: WalletListEntry[];
  onProjectClick?: (projectId: string) => void;
}

export function LowBalanceProjects({ entries, onProjectClick }: Props) {
  const flagged = entries
    .filter((e) => {
      const t =
        e.wallet.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD;
      return e.wallet.availableUnits > 0 && e.wallet.availableUnits < t;
    })
    .sort((a, b) => a.wallet.availableUnits - b.wallet.availableUnits);

  return (
    <Card className="p-4" data-purpose="low-balance-alert-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" strokeWidth={2} />
          <h4 className="text-xs font-bold text-slate-800">Low Balance Projects</h4>
        </div>
        <ViewAllLink label="View all" />
      </div>

      {flagged.length === 0 ? (
        <div className="py-8 text-center text-[11px] text-slate-400">
          All wallets are healthy.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 mt-2">
          {flagged.map((e) => {
            const isCritical =
              e.wallet.availableUnits < CRITICAL_THRESHOLD;
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
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center',
                      isCritical
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    <span className="text-[10px] font-bold">
                      {e.project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {e.project.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {e.wallet.availableUnits.toLocaleString()} units available
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold rounded border',
                    isCritical
                      ? 'text-rose-600 bg-rose-50 border-rose-200/50'
                      : 'text-amber-600 bg-amber-50 border-amber-200/50',
                  )}
                >
                  {isCritical ? 'Critical' : 'Low'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}