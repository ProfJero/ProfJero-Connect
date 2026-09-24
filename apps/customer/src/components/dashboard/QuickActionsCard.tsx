import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { quickActions } from '../../mock/dashboard';
import { cn } from '../../lib/utils';

const PATHS: Record<string, string> = {
  'Send SMS': '/messaging/sms',
  'Buy Data': '/services/data',
  'Buy Airtime': '/services/airtime',
  'Add Sender ID': '/messaging/sender-ids',
};

export function QuickActionsCard() {
  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">
        Quick Actions
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const to = PATHS[action.label] ?? '/dashboard';
          const isRotate = action.label === 'Send SMS';
          return (
            <Link
              key={action.label}
              to={to}
              className={cn(
                'border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between transition-all group',
                action.hover,
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform', action.iconBg, action.iconColor)}>
                <Icon className={cn('w-5 h-5', isRotate && '-rotate-45 translate-x-0.5')} strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{action.label}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{action.description}</p>
              </div>
              <ArrowRight className={cn('w-3.5 h-3.5 mt-2.5 self-end', action.arrowColor)} strokeWidth={2} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}