import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
  { label: 'Overview', path: '/messaging', icon: LayoutDashboard, end: true },
  { label: 'Campaigns', path: '/messaging/campaigns', icon: Megaphone, end: false },
  { label: 'Message History', path: '/messaging/history', icon: Clock, end: false },
];

export function MessagingTabs() {
  return (
    <section className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <nav className="flex gap-8 text-xs font-semibold whitespace-nowrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 py-2.5 border-b-2 transition-colors',
                  isActive
                    ? 'text-[#1a6cf0] dark:text-blue-400 border-[#1a6cf0] dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200',
                )
              }
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </section>
  );
}