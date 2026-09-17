import { Tag, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { quickStats } from '../../mock/dashboard';

const ICONS = {
  tag: Tag,
  'trending-up': TrendingUp,
  'check-circle-2': CheckCircle2,
};

export function QuickStats() {
  return (
    <Card className="p-5" data-purpose="quick-stats-widget">
      <h3 className="font-bold text-slate-800 text-sm mb-4">Quick Stats</h3>
      <div className="space-y-3.5">
        {quickStats.map((stat) => {
          const Icon = ICONS[stat.icon];
          return (
            <div key={stat.label} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500">{stat.label}</div>
                <div className="text-xs font-bold text-slate-800">
                  {stat.value}{' '}
                  {stat.suffix && (
                    <span className="text-[10px] font-normal text-slate-400">{stat.suffix}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}