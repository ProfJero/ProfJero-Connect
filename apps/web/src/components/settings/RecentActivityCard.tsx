import { Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { recentActivity, type RecentActivityItem } from '../../mock/settings';
import { cn } from '../../lib/utils';

const DOT_COLORS: Record<RecentActivityItem['color'], string> = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
};

export function RecentActivityCard() {
  return (
    <Card
      className="p-6 lg:col-span-4 flex flex-col justify-between"
      data-purpose="recent-activity-card"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">Latest platform activity and updates.</p>

        <div className="space-y-3 pt-1">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full mt-1 shrink-0',
                    DOT_COLORS[item.color],
                  )}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.title}</h4>
                  <p className="text-[10.5px] text-slate-400">{item.detail}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap pl-2">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
        <a
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          href="#"
        >
          <span>View all activity</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </Card>
  );
}