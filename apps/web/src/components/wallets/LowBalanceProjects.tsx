import { AlertTriangle, Bell } from 'lucide-react';
import { Card } from '../ui/Card';
import { ViewAllLink } from '../ui/Card';
import { lowBalanceProjects } from '../../mock/wallets';
import { cn } from '../../lib/utils';

export function LowBalanceProjects() {
  return (
    <Card className="p-4" data-purpose="low-balance-alert-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" strokeWidth={2} />
          <h4 className="text-xs font-bold text-slate-800">Low Balance Projects</h4>
        </div>
        <ViewAllLink label="View all" />
      </div>

      <div className="divide-y divide-slate-100 mt-2">
        {lowBalanceProjects.map((item) => {
          const isCritical = item.severity === 'Critical';
          const iconBg = isCritical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600';
          return (
            <div key={item.project} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', iconBg)}>
                  {item.avatarBg ? (
                    <span className="text-[10px] font-bold">{item.project.charAt(0)}</span>
                  ) : (
                    <Bell className="w-3.5 h-3.5" strokeWidth={2} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{item.project}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.units.toLocaleString()} units remaining
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
                {item.severity}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}