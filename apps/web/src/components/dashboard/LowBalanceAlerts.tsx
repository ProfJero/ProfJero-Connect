import { Bell } from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { lowBalanceAlerts } from '../../mock/dashboard';

export function LowBalanceAlerts() {
  return (
    <Card className="p-5" data-purpose="low-balance-widget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
          <Bell className="w-4 h-4 text-rose-500" />
          <span>Low Balance Alerts</span>
        </div>
        <ViewAllLink />
      </div>
      <div className="space-y-3">
        {lowBalanceAlerts.map((alert) => {
          const isCritical = alert.severity === 'critical';
          return (
            <div
              key={alert.project}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-slate-800">{alert.project}</div>
                <div className="text-[11px] text-slate-500">
                  <span
                    className={`font-semibold ${isCritical ? 'text-rose-600' : 'text-slate-700'}`}
                  >
                    {alert.units.toLocaleString()}
                  </span>{' '}
                  units remaining
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                  isCritical
                    ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                    : 'bg-amber-50 text-amber-600 border-amber-200/60'
                }`}
              >
                {isCritical ? 'Critical' : 'Low'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}