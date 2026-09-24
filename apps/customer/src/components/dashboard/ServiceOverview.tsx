import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { serviceOverview } from '../../mock/dashboard';
import { cn } from '../../lib/utils';

const PATHS: Record<string, string> = {
  SMS: '/messaging/sms',
  Data: '/services/data',
  Airtime: '/services/airtime',
  API: '/api',
};

export function ServiceOverview() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Service Overview</h3>
        <Link to="/services/data" className="text-[#1a6cf0] dark:text-blue-400 hover:underline text-xs font-medium">
          View all →
        </Link>
      </div>

      <div className="mt-3 space-y-2.5">
        {serviceOverview.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={PATHS[item.name] ?? '/dashboard'}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.iconBg, item.iconColor)}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {item.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" strokeWidth={2} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}