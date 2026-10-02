import { ArrowRight, Send, Plus, AtSign, Users, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface QuickAction {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  hover: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Send SMS',
    description: 'Message one or many',
    to: '/messaging/sms',
    icon: Send,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-[#1764e0] dark:text-blue-400',
    hover: 'hover:border-blue-200 hover:bg-blue-50/30 dark:hover:bg-blue-500/5',
  },
  {
    label: 'Add Funds',
    description: 'Buy SMS units',
    to: '/wallet/add-funds',
    icon: Plus,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5',
  },
  {
    label: 'Sender ID',
    description: 'Request a sender name',
    to: '/messaging/sender-ids/request',
    icon: AtSign,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:border-purple-200 hover:bg-purple-50/30 dark:hover:bg-purple-500/5',
  },
  {
    label: 'Contacts',
    description: 'Manage your lists',
    to: '/contacts',
    icon: Users,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-700 dark:text-amber-400',
    hover: 'hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-500/5',
  },
];

export function QuickActionsCard() {
  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">Quick Actions</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className={cn(
                'border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between transition-all group',
                action.hover,
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform', action.iconBg, action.iconColor)}>
                <Icon className={cn('w-5 h-5', action.icon === Send && '-rotate-45 translate-x-0.5')} strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{action.label}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{action.description}</p>
              </div>
              <ArrowRight className={cn('w-3.5 h-3.5 mt-2.5 self-end', action.iconColor)} strokeWidth={2} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
