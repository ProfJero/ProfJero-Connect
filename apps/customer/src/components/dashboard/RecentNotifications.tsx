import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { recentNotifications, type NotificationTone } from '../../mock/dashboard';
import { cn } from '../../lib/utils';

const TONE_STYLES: Record<NotificationTone, { bg: string; color: string }> = {
  success: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
  info: { bg: 'bg-blue-100 dark:bg-blue-500/20', color: 'text-[#1a6cf0] dark:text-blue-400' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-500/20', color: 'text-amber-600 dark:text-amber-400' },
};

export function RecentNotifications() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Notifications</h3>
        <Link to="/notifications" className="text-[#1a6cf0] dark:text-blue-400 hover:underline text-xs font-medium">
          View all →
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {recentNotifications.map((n, i) => {
          const Icon = n.icon;
          const tone = TONE_STYLES[n.tone];
          return (
            <div key={i} className="flex items-start justify-between gap-3 text-xs group cursor-pointer">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', tone.bg, tone.color)}>
                  <Icon className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{n.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{n.description}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.time}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 mt-1" strokeWidth={2} />
            </div>
          );
        })}
      </div>
    </div>
  );
}