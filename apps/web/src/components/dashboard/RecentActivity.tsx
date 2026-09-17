import {
  DollarSign,
  MessageSquare,
  Coins,
  MessageSquareOff,
  FolderPlus,
} from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { recentActivity, type ActivityItem } from '../../mock/dashboard';

const ICON_MAP: Record<ActivityItem['type'], { icon: typeof DollarSign; bg: string }> = {
  payment: { icon: DollarSign, bg: 'bg-emerald-500' },
  sms: { icon: MessageSquare, bg: 'bg-blue-600' },
  units: { icon: Coins, bg: 'bg-teal-500' },
  failed: { icon: MessageSquareOff, bg: 'bg-rose-500' },
  project: { icon: FolderPlus, bg: 'bg-blue-500' },
};

export function RecentActivity() {
  return (
    <Card className="p-5" data-purpose="recent-activity-widget">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">Recent Activity</h3>
        <ViewAllLink />
      </div>
      <div className="space-y-4">
        {recentActivity.map((item, i) => {
          const { icon: Icon, bg } = ICON_MAP[item.type];
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full ${bg} text-white flex items-center justify-center shrink-0 mt-0.5`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800">{item.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{item.detail}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}